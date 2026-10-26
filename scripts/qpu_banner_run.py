#!/usr/bin/env python3
"""Run the profile banner's circuit on IBM Quantum hardware and record the shots.

State lives in assets/qpu-run.json: the latest completed run, plus any job that
is still queued. Each invocation does one step:

  * a queued job exists  -> collect it if finished, otherwise leave it alone;
                            if still queued after 3 days, cancel and resubmit
  * last run < 7 days old -> nothing to do
  * otherwise             -> submit a new job, then wait briefly for it

Open-plan queues can take hours, so a job that is not finished within
--wait-minutes is simply collected by a later scheduled run.

Use --fake BACKEND to run locally on a simulated device (no account needed;
also requires qiskit-aer).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import warnings

from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister
from qiskit.circuit.library import QFTGate
from qiskit.transpiler import generate_preset_pass_manager

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "assets" / "qpu-run.json"
SHOTS = 1024
REPLAY = 8                      # shots replayed by the banner's output bits
RUN_EVERY = timedelta(days=7)
STALE_AFTER = timedelta(days=3)  # a queued job older than this is cancelled and resubmitted
FINISHED_BAD = {"ERROR", "CANCELLED"}

# SamplerV2 is deprecated in qiskit-ibm-runtime 0.50+, but its successor does
# post-processing client-side, so a job collected by a later workflow run via
# service.job(id) would not come back as sampler results. Versions are pinned in
# requirements-qpu.txt; revisit when SamplerV2 is removed.
warnings.filterwarnings("ignore", message="The SamplerV2 class is deprecated", category=DeprecationWarning)


def banner_circuit() -> QuantumCircuit:
    """Exactly the circuit drawn in the banner: H, CNOTs, barrier, T/S, QFT, measure."""
    qc = QuantumCircuit(QuantumRegister(4, "q"), ClassicalRegister(4, "c"), name="profile_banner")
    qc.h(range(4))
    qc.cx(0, 1)
    qc.cx(2, 3)
    qc.cx(1, 2)
    qc.barrier()
    qc.t(0)
    qc.s(3)
    qc.append(QFTGate(4), range(4))
    qc.measure(range(4), range(4))
    return qc


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_state() -> dict:
    if STATE.is_file():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"latest": None, "pending": None}


def save_state(state: dict) -> None:
    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8", newline="\n")


def summarize(pub_result, backend: str, job_id: str | None, submitted_at: str, simulated: bool) -> dict:
    # Qiskit bitstrings are little-endian (c3 c2 c1 c0); store them as q0 q1 q2 q3
    # so character i is the bit measured on wire i of the banner.
    shots = [s[::-1] for s in pub_result.data.c.get_bitstrings()]
    counts = Counter(shots)
    top, top_count = counts.most_common(1)[0]
    return {
        "backend": backend,
        "simulated": simulated,
        "job_id": job_id,
        "submitted_at": submitted_at,
        "completed_at": now(),
        "shots": len(shots),
        "bit_order": "q0q1q2q3 (character i is qubit i)",
        "top_outcome": {"bits": top, "share": round(top_count / len(shots), 4)},
        "counts": dict(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))),
        "replay": shots[:REPLAY],
        "ideal": ideal_distribution(),
    }


def ideal_distribution() -> dict[str, float]:
    """Noiseless outcome probabilities for the banner circuit, keyed q0q1q2q3."""
    from qiskit.quantum_info import Statevector

    probs = Statevector(banner_circuit().remove_final_measurements(inplace=False)).probabilities_dict()
    return {bits[::-1]: round(p, 6) for bits, p in sorted(probs.items()) if p > 1e-9}


def run_fake(name: str) -> dict:
    from qiskit_ibm_runtime import SamplerV2, fake_provider

    backend = getattr(fake_provider, name)()
    isa = generate_preset_pass_manager(optimization_level=1, backend=backend).run(banner_circuit())
    submitted = now()
    result = SamplerV2(mode=backend).run([isa], shots=SHOTS).result()
    return summarize(result[0], backend.name, None, submitted, simulated=True)


def service():
    from qiskit_ibm_runtime import QiskitRuntimeService

    return QiskitRuntimeService(
        channel="ibm_quantum_platform",
        token=os.environ["IBM_QUANTUM_TOKEN"],
        instance=os.environ.get("IBM_QUANTUM_INSTANCE") or None,
    )


def collect(svc, state: dict, wait_minutes: float) -> bool:
    """Try to finish the pending job. Returns True if the state file changed."""
    pending = state["pending"]
    job = svc.job(pending["job_id"])
    deadline = time.monotonic() + wait_minutes * 60
    while True:
        status = job.status()
        if status == "DONE":
            state["latest"] = summarize(job.result()[0], pending["backend"], pending["job_id"],
                                        pending["submitted_at"], simulated=False)
            state["pending"] = None
            print(f"Collected job {pending['job_id']} from {pending['backend']}")
            return True
        if status in FINISHED_BAD:
            print(f"::warning::Job {pending['job_id']} ended as {status}; it will be resubmitted")
            state["pending"] = None
            return True
        if time.monotonic() >= deadline:
            print(f"Job {pending['job_id']} is {status}; a later run will collect it")
            return False
        time.sleep(30)


def submit(svc, state: dict) -> None:
    from qiskit_ibm_runtime import SamplerV2

    backend = svc.least_busy(min_num_qubits=4, operational=True, simulator=False)
    isa = generate_preset_pass_manager(optimization_level=1, backend=backend).run(banner_circuit())
    job = SamplerV2(mode=backend).run([isa], shots=SHOTS)
    state["pending"] = {"job_id": job.job_id(), "backend": backend.name, "submitted_at": now()}
    print(f"Submitted job {job.job_id()} to {backend.name}")


def replace_stale(svc, state: dict) -> bool:
    """Cancel a job queued longer than STALE_AFTER and resubmit to the least busy device."""
    pending = state["pending"]
    age = datetime.now(timezone.utc) - datetime.fromisoformat(pending["submitted_at"])
    if age < STALE_AFTER:
        return False
    job = svc.job(pending["job_id"])
    if job.status() not in {"QUEUED", "INITIALIZING"}:
        return False
    job.cancel()
    print(f"::warning::Job {pending['job_id']} queued on {pending['backend']} for {age.days} days; "
          "cancelled and resubmitting")
    state["pending"] = None
    submit(svc, state)
    save_state(state)
    return True


def is_due(state: dict) -> bool:
    latest = state.get("latest")
    if not latest or latest.get("simulated"):
        return True
    return datetime.now(timezone.utc) - datetime.fromisoformat(latest["completed_at"]) >= RUN_EVERY


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--fake", metavar="BACKEND", help="simulate locally, e.g. FakeTorino")
    parser.add_argument("--wait-minutes", type=float, default=20)
    parser.add_argument("--force", action="store_true", help="submit even if the last run is recent")
    args = parser.parse_args()

    state = load_state()
    if args.fake:
        state["latest"] = run_fake(args.fake)
        save_state(state)
        print(f"Simulated run on {state['latest']['backend']} recorded")
        return 0

    if not os.environ.get("IBM_QUANTUM_TOKEN"):
        print("::notice::IBM_QUANTUM_TOKEN is not set; skipping the hardware run")
        return 0

    svc = service()
    changed = False
    if state.get("pending") and replace_stale(svc, state):
        changed = True
    if not state.get("pending") and (args.force or is_due(state)):
        submit(svc, state)
        save_state(state)  # record the job id before waiting, in case the runner dies
        changed = True
    elif not state.get("pending"):
        print("Latest hardware run is under 7 days old; nothing to do")
    if state.get("pending"):
        changed = collect(svc, state, args.wait_minutes) or changed
    if changed:
        save_state(state)
    return 0


if __name__ == "__main__":
    sys.exit(main())
