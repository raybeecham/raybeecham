#!/usr/bin/env python3
"""Render the profile banners from the latest circuit run in assets/qpu-run.json.

The banner draws the same circuit that scripts/qpu_banner_run.py executes. Each
wire's output bit replays that qubit's value across the recorded shots, one shot
per photon arrival, and a caption names the device and date. The README line
between the QPU-RUN markers is refreshed from the same data.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "assets" / "qpu-run.json"
README = ROOT / "README.md"
START, END = "<!-- QPU-RUN:START -->", "<!-- QPU-RUN:END -->"

SANS = "Segoe UI,Helvetica Neue,Arial,sans-serif"
MONO = "ui-monospace,SFMono-Regular,Consolas,Menlo,monospace"
TEAL, VIOLET, AMBER = "#4fe3d0", "#a78bfa", "#fbbf24"
PANEL, WIRE, MUTED = "#0b1122", "#2a3550", "#5d6b85"
NAME = "Ray Beecham"
TAGLINE = "Evidence before claims. Mission before technology."
TITLE = "Ray Beecham | Security, quantum, and applied AI"

WIRES = (78, 128, 178, 228)
X0, XM = 556, 872            # first wire x, meter centre x
TRAVEL = XM - 18 - X0        # photon path length, wire start to meter face
PERIOD = 3.4                 # seconds per photon trip; measurement events sync to it
STAGGER = 0.85
FALLBACK_SHOTS = ["1011", "0110"]


def load_run() -> dict | None:
    if not STATE.is_file():
        return None
    return json.loads(STATE.read_text(encoding="utf-8")).get("latest")


def run_date(run: dict) -> str:
    return datetime.fromisoformat(run["completed_at"]).strftime("%b %d, %Y").replace(" 0", " ")


def caption(run: dict | None) -> str:
    if not run:
        return ""
    if run["simulated"]:
        return f"↳ simulated shots · {run['backend']} noise model · awaiting first hardware run"
    return f"↳ real shots · {run['backend']} · {run['shots']:,} shots · {run_date(run)}"


def delay(i: int) -> float:
    return -i * STAGGER


def gate(x, y, label, color):
    return (f'<rect x="{x - 15}" y="{y - 15}" width="30" height="30" rx="5" fill="{PANEL}" stroke="{color}" stroke-width="1.5"/>'
            f'<text x="{x}" y="{y + 5}" text-anchor="middle" font-family="{SANS}" font-size="14" font-weight="600" fill="{color}">{label}</text>')


def cnot(x, control, target, color):
    return (f'<path d="M{x} {control}V{target + 11 if target > control else target - 11}" stroke="{color}" stroke-width="1.5"/>'
            f'<circle cx="{x}" cy="{control}" r="5" fill="{color}"/>'
            f'<circle cx="{x}" cy="{target}" r="11" fill="{PANEL}" stroke="{color}" stroke-width="1.5"/>'
            f'<path d="M{x - 11} {target}H{x + 11}M{x} {target - 11}V{target + 11}" stroke="{color}" stroke-width="1.5"/>')


def output_bits(i: int, y: int, shots: list[str]) -> str:
    """Wire i shows shot k's bit from its k-th photon arrival until the next one."""
    cycle = PERIOD * len(shots)
    texts = []
    for k, shot in enumerate(shots):
        start = k * PERIOD + delay(i)  # arrival time of the k-th photon on this wire
        texts.append(f'<text x="962" y="{y + 5}" class="shot{" s0" if k == 0 else ""}" '
                     f'style="animation-duration:{cycle:.1f}s;animation-delay:{start if start <= 0 else start - cycle:.2f}s">{shot[i]}</text>')
    return f'<g font-family="{MONO}" font-size="15" font-weight="700" fill="{AMBER}">{"".join(texts)}</g>'


def circuit(shots: list[str]) -> str:
    """The circuit in desktop coordinates (x 520-975, y 56-250)."""
    p = []
    for i, y in enumerate(WIRES):
        p.append(f'<text x="{X0 - 8}" y="{y + 5}" text-anchor="end" font-family="{MONO}" font-size="13" fill="{MUTED}">|0⟩</text>'
                 f'<path d="M{X0} {y}H{XM - 18}" stroke="{WIRE}" stroke-width="1.5"/>'
                 f'<path d="M{XM + 18} {y - 2}H950M{XM + 18} {y + 2}H950" stroke="{WIRE}"/>')
        # Drawn before the gates so photons pass "through" them.
        p.append(f'<circle cx="{X0}" cy="{y}" r="3.2" fill="{TEAL if i % 2 == 0 else VIOLET}" filter="url(#glow)" '
                 f'class="photon" style="animation-delay:{delay(i):.2f}s"/>')
    p.extend(gate(598, y, "H", TEAL) for y in WIRES)
    p.append(cnot(648, WIRES[0], WIRES[1], VIOLET))
    p.append(cnot(688, WIRES[2], WIRES[3], VIOLET))
    p.append(cnot(728, WIRES[1], WIRES[2], TEAL))
    p.append(f'<path d="M754 {WIRES[0] - 22}V{WIRES[3] + 22}" stroke="#3a4766" stroke-dasharray="3 4"/>')  # barrier
    p.append(gate(782, WIRES[0], "T", VIOLET))
    p.append(gate(782, WIRES[3], "S", VIOLET))
    p.append(f'<rect x="808" y="{WIRES[0] - 18}" width="38" height="{WIRES[3] - WIRES[0] + 36}" rx="7" fill="{PANEL}" stroke="url(#qg)" stroke-width="1.6"/>'
             f'<text x="827" y="157" text-anchor="middle" font-family="{SANS}" font-size="13" font-weight="700" letter-spacing="1" fill="#cfd8ff" transform="rotate(-90 827 153)">QFT</text>')
    for i, y in enumerate(WIRES):
        p.append(f'<rect x="{XM - 18}" y="{y - 16}" width="36" height="32" rx="5" fill="{PANEL}" stroke="{AMBER}" stroke-width="1.5"/>'
                 f'<rect x="{XM - 18}" y="{y - 16}" width="36" height="32" rx="5" fill="{AMBER}" class="flash" style="animation-delay:{delay(i):.2f}s"/>'
                 f'<path d="M{XM - 11} {y + 8}A11 11 0 0 1 {XM + 11} {y + 8}" fill="none" stroke="{AMBER}" stroke-width="1.4"/>'
                 f'<g transform="translate({XM} {y + 8})"><path class="needle" style="animation-delay:{delay(i):.2f}s" d="M0 0L0-15" '
                 f'stroke="{AMBER}" stroke-width="1.8" stroke-linecap="round"/></g>')
        p.append(output_bits(i, y, shots))
    return "".join(p)


# Each photon reaches its meter at the end of its trip; the flash, needle kick
# and the switch to the next recorded shot all key off that same moment.
STYLE = f"""<style>
.photon{{animation:photon {PERIOD}s cubic-bezier(.45,0,.55,1) infinite}}
.flash{{opacity:0;animation:flash {PERIOD}s ease-out infinite}}
.needle{{transform:rotate(-40deg);animation:needle {PERIOD}s ease-in-out infinite}}
.shot{{opacity:0;animation-name:shot;animation-timing-function:steps(1);animation-iteration-count:infinite}}
.cursor{{animation:blink 1.1s steps(1) infinite}}
@keyframes photon{{0%{{transform:translateX(0);opacity:0}}8%,90%{{opacity:1}}100%{{transform:translateX({TRAVEL}px);opacity:0}}}}
@keyframes flash{{0%{{opacity:.28}}25%,100%{{opacity:0}}}}
@keyframes needle{{0%{{transform:rotate(-40deg)}}10%{{transform:rotate(46deg)}}22%{{transform:rotate(28deg)}}85%{{transform:rotate(36deg)}}100%{{transform:rotate(-40deg)}}}}
@keyframes blink{{50%{{opacity:0}}}}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important}}.photon{{display:none}}.s0{{opacity:1}}}}
</style>"""


def shot_keyframes(count: int) -> str:
    visible = 100 / count
    return f"<style>@keyframes shot{{0%{{opacity:1}}{visible:.3f}%,100%{{opacity:0}}}}</style>"


def defs(w, h, cx):
    return f"""<defs>
<radialGradient id="g1" cx="{cx}" cy=".5" r=".55"><stop stop-color="#2a1a5e" stop-opacity=".55"/><stop offset="1" stop-color="#2a1a5e" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx=".05" cy="1" r=".6"><stop stop-color="#0c3b3a" stop-opacity=".6"/><stop offset="1" stop-color="#0c3b3a" stop-opacity="0"/></radialGradient>
<linearGradient id="qg" x2="0" y2="1"><stop stop-color="{TEAL}"/><stop offset="1" stop-color="{VIOLET}"/></linearGradient>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#8ea2c8" opacity=".09"/></pattern>
<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="{w}" height="{h}" rx="16" fill="#060a14"/>
<rect width="{w}" height="{h}" rx="16" fill="url(#dots)"/>
<rect width="{w}" height="{h}" rx="16" fill="url(#g1)"/><rect width="{w}" height="{h}" rx="16" fill="url(#g2)"/>
<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="15.5" fill="none" stroke="#1c2540"/>"""


def document(w, h, desc, shots, body):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">
<title id="title">{TITLE}</title>
<desc id="desc">{desc}</desc>
{STYLE}{shot_keyframes(len(shots))}
{body}
</svg>
"""


def description(run: dict | None) -> str:
    base = ("A four-qubit quantum circuit with Hadamard, CNOT, phase, and QFT gates. Photons travel each wire "
            "into a measurement meter, which flashes as each one arrives")
    if not run:
        return base + "."
    source = "simulated shots" if run["simulated"] else f"real shots measured on IBM Quantum {run['backend']} on {run_date(run)}"
    return f"{base} and shows the next of {len(run['replay'])} {source}."


def off_ideal(run: dict) -> tuple[int, float]:
    """Shots on outcomes a noiseless machine can never produce."""
    shots = sum(c for bits, c in run["counts"].items() if run["ideal"].get(bits, 0) == 0)
    return shots, shots / run["shots"]


def chart(run: dict) -> str:
    """Grouped bars: noiseless probability vs measured share for all 16 outcomes."""
    w, h, left, right, top, base = 800, 330, 56, 24, 92, 262
    measured = {bits: c / run["shots"] for bits, c in run["counts"].items()}
    outcomes = sorted({f"{n:04b}" for n in range(16)},
                      key=lambda b: (-run["ideal"].get(b, 0), -measured.get(b, 0), b))
    peak = max([*run["ideal"].values(), *measured.values()])
    scale = (base - top) / (peak * 1.08)
    slot = (w - left - right) / len(outcomes)
    bar = slot * 0.34
    source = f"{run['backend']} (simulated noise model)" if run["simulated"] else f"IBM Quantum {run['backend']}"
    bars, labels = [], []
    for i, bits in enumerate(outcomes):
        x = left + i * slot + slot / 2
        ideal, real = run["ideal"].get(bits, 0), measured.get(bits, 0)
        if ideal:
            bars.append(f'<rect x="{x - bar - 1:.1f}" y="{base - ideal * scale:.1f}" width="{bar:.1f}" height="{ideal * scale:.1f}" '
                        f'rx="2" fill="none" stroke="{VIOLET}" stroke-width="1.5"/>')
        if real:
            color = TEAL if ideal else AMBER
            bars.append(f'<rect x="{x + 1:.1f}" y="{base - real * scale:.1f}" width="{bar:.1f}" height="{real * scale:.1f}" rx="2" fill="{color}"/>')
        labels.append(f'<text x="{x:.1f}" y="{base + 18}" text-anchor="middle" fill="{MUTED if not ideal else "#9aa8c3"}">{bits}</text>')
    grid = "".join(
        f'<path d="M{left} {base - v * scale:.1f}H{w - right}" stroke="{WIRE}" stroke-dasharray="2 4"/>'
        f'<text x="{left - 8}" y="{base - v * scale + 4:.1f}" text-anchor="end" fill="{MUTED}">{v:.0%}</text>'
        for v in (0.1, 0.2, 0.3, 0.4) if v <= peak * 1.08)
    shots, share = off_ideal(run)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="ct cd">
<title id="ct">Ideal vs. measured outcomes for the banner circuit</title>
<desc id="cd">Noiseless probabilities next to {run['shots']:,} shots measured on {source}. {shots} shots ({share:.0%}) landed on outcomes a perfect machine never produces.</desc>
<rect width="{w}" height="{h}" rx="12" fill="#060a14"/><rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="11.5" fill="none" stroke="#1c2540"/>
<text x="24" y="36" font-family="{SANS}" font-size="17" font-weight="600" fill="#f3f6ff">Perfect machine vs. {source}</text>
<text x="24" y="60" font-family="{SANS}" font-size="13" fill="#9aa8c3">{run['shots']:,} shots · {run_date(run)} · outcomes q0q1q2q3</text>
<g font-family="{SANS}" font-size="12" fill="#9aa8c3">
<rect x="{w - 330}" y="27" width="12" height="12" rx="2" fill="none" stroke="{VIOLET}" stroke-width="1.5"/><text x="{w - 312}" y="37">Noiseless</text>
<rect x="{w - 240}" y="27" width="12" height="12" rx="2" fill="{TEAL}"/><text x="{w - 222}" y="37">Measured</text>
<rect x="{w - 150}" y="27" width="12" height="12" rx="2" fill="{AMBER}"/><text x="{w - 132}" y="37">Impossible if noiseless</text></g>
<g font-family="{MONO}" font-size="11">{grid}</g>
<path d="M{left} {base}H{w - right}" stroke="#3a4766"/>
{"".join(bars)}
<g font-family="{MONO}" font-size="11">{"".join(labels)}</g>
<text x="24" y="{h - 18}" font-family="{SANS}" font-size="13" fill="#cfd8ff"><tspan fill="{AMBER}" font-weight="700">{shots} of {run['shots']:,} shots ({share:.0%})</tspan> landed on outcomes a perfect machine never produces{": the noise signature of real hardware." if not run["simulated"] else " (simulated noise)."}</text>
</svg>
"""


def readme_line(run: dict | None) -> str:
    if not run:
        return ""
    proof = ""
    if run.get("ideal"):
        question = "How is this different from a simulation?" if not run["simulated"] else "What will change with real hardware?"
        proof = (f"\n<details><summary><sub>{question}</sub></summary>\n\n"
                 f"<img src=\"assets/qpu-chart.svg\" alt=\"Bar chart comparing noiseless probabilities with the measured shots\" width=\"100%\">\n\n"
                 f"<sub>Job <code>{run['job_id'] or 'local simulation'}</code>. Noiseless values come from a statevector simulation of the same circuit.</sub>\n</details>")
    if run["simulated"]:
        return (f"<sub>The circuit in the banner is scheduled to run weekly on IBM Quantum hardware; until the first run lands, "
                f"its output bits replay simulated shots ({run['backend']} noise model). <a href=\"assets/qpu-run.json\">Run data</a></sub>{proof}")
    top = run["top_outcome"]
    return (f"<sub>The circuit in the banner ran on IBM Quantum <b>{run['backend']}</b> on {run_date(run)}; its output bits replay "
            f"{len(run['replay'])} of {run['shots']:,} measured shots (most common outcome <code>{top['bits']}</code>, "
            f"{top['share']:.0%}). <a href=\"assets/qpu-run.json\">Run data</a></sub>{proof}")


def main() -> int:
    run = load_run()
    shots = run["replay"] if run else FALLBACK_SHOTS
    cap = caption(run)
    desc = description(run)

    desktop = document(1000, 300, desc, shots, f"""{defs(1000, 300, ".8")}
<text x="48" y="82" font-family="{MONO}" font-size="13" letter-spacing="3" fill="{TEAL}">PQC · QUANTUM · APPLIED AI</text>
<text x="45" y="156" font-family="{SANS}" font-size="68" font-weight="700" fill="#f3f6ff" letter-spacing="-1">{NAME}</text>
<text x="48" y="199" font-family="{SANS}" font-size="19" fill="#9aa8c3">{TAGLINE}</text>
<text x="48" y="248" font-family="{MONO}" font-size="13" fill="{MUTED}">$ qiskit run ./evidence.qasm <tspan class="cursor" fill="{TEAL}">▌</tspan></text>
{circuit(shots)}
<text x="970" y="278" text-anchor="end" font-family="{MONO}" font-size="11" fill="{MUTED}">{cap}</text>""")

    # Mobile: text stacked on top, the same circuit scaled and centred underneath.
    scale = 0.9
    tx = (520 - (975 - 520) * scale) / 2 - 520 * scale
    mobile = document(520, 340, desc, shots, f"""{defs(520, 340, ".5")}
<text x="32" y="44" font-family="{MONO}" font-size="12" letter-spacing="2.5" fill="{TEAL}">PQC · QUANTUM · APPLIED AI</text>
<text x="30" y="94" font-family="{SANS}" font-size="48" font-weight="700" fill="#f3f6ff" letter-spacing="-.8">{NAME}</text>
<text x="32" y="124" font-family="{SANS}" font-size="16" fill="#9aa8c3">{TAGLINE}</text>
<g transform="translate({tx:.1f} {136 - 56 * scale:.1f}) scale({scale})">{circuit(shots)}</g>
<text x="490" y="327" text-anchor="end" font-family="{MONO}" font-size="10" fill="{MUTED}">{cap}</text>""")

    (ROOT / "assets" / "profile-banner.svg").write_text(desktop, encoding="utf-8", newline="\n")
    (ROOT / "assets" / "profile-banner-mobile.svg").write_text(mobile, encoding="utf-8", newline="\n")
    if run and run.get("ideal"):
        (ROOT / "assets" / "qpu-chart.svg").write_text(chart(run), encoding="utf-8", newline="\n")

    readme = README.read_text(encoding="utf-8")
    if readme.count(START) == 1 and readme.count(END) == 1:
        head, rest = readme.split(START, 1)
        tail = rest.split(END, 1)[1]
        line = readme_line(run)
        updated = f"{head}{START}\n{line}\n{END}{tail}" if line else f"{head}{START}\n{END}{tail}"
        if updated != readme:
            README.write_text(updated, encoding="utf-8", newline="\n")
    print(f"Banners rendered from {'no run data' if not run else run['backend']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
