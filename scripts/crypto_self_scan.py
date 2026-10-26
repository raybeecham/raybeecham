#!/usr/bin/env python3
"""Summarize the weekly crypto-inventory self-scan of my public repositories.

Reads one inventory per repository (scan/<repo>/inventory.json, produced by
raybeecham/crypto-inventory-demo), then writes:

  reports/crypto-inventory.json  every finding, tagged with its repository
  reports/crypto-inventory.md    per-repository table and linked findings
  README.md                      one summary line between CRYPTO-SCAN markers
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT_MD = ROOT / "reports" / "crypto-inventory.md"
REPORT_JSON = ROOT / "reports" / "crypto-inventory.json"
README = ROOT / "README.md"
START, END = "<!-- CRYPTO-SCAN:START -->", "<!-- CRYPTO-SCAN:END -->"
OWNER = "raybeecham"
TOOL = "https://github.com/raybeecham/crypto-inventory-demo"
RISK_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]


def repo_path(raw: str, repo: str) -> str:
    """Reduce scanner paths (absolute, file:// or targets/<repo>/...) to repo-relative."""
    path = str(raw or "").replace("\\", "/")
    path = re.sub(r"^file://", "", path)
    marker = f"targets/{repo}/"
    if marker in path:
        path = path.split(marker, 1)[1]
    return path.lstrip("/")


def label(record: dict) -> str:
    return str(record.get("algorithm") or record.get("protocol") or record.get("api") or "unknown")


def load(scan_dir: Path) -> tuple[list[str], list[dict]]:
    repos, records = [], []
    for inventory in sorted(scan_dir.glob("*/inventory.json"), key=lambda p: p.parent.name.lower()):
        repo = inventory.parent.name
        repos.append(repo)
        data = json.loads(inventory.read_text(encoding="utf-8") or "[]")
        for record in data if isinstance(data, list) else data.get("items", []):
            record = {**record, "repo": repo, "file": repo_path(record.get("file", ""), repo)}
            records.append(record)
    records.sort(key=lambda r: (r["repo"].lower(), r["file"], r.get("line") or 0, label(r)))
    return repos, records


def counts_line(records: list[dict], limit: int = 4) -> str:
    top = Counter(label(r) for r in records).most_common(limit)
    return " · ".join(f"{name} ×{count}" for name, count in top)


def render_markdown(repos: list[str], records: list[dict], scanned_on: str) -> str:
    pqc = Counter(str(r.get("pqc_status", "UNKNOWN")).upper() for r in records)
    hndl = sum(1 for r in records if r.get("harvest_now_decrypt_later_risk"))
    lines = [
        "# Crypto self-scan",
        "",
        f"Weekly cryptographic inventory of my own public repositories, produced with "
        f"[crypto-inventory-demo]({TOOL}) (CodeQL for Python plus a TLS configuration scan). "
        f"Last scan: **{scanned_on}**.",
        "",
        f"- Repositories scanned: **{len(repos)}**",
        f"- Findings: **{len(records)}**",
        f"- PQC status: SAFE {pqc.get('SAFE', 0)} · NOT_SAFE {pqc.get('NOT_SAFE', 0)} · UNKNOWN {pqc.get('UNKNOWN', 0)}",
        f"- Harvest-now-decrypt-later exposure: {hndl}",
        "",
        "Coverage limits: Python source and text configuration only. JavaScript, TypeScript, Java builds, "
        "dependencies, and runtime traffic are not scanned here, so an empty row means \"nothing found in "
        "scanned files\", not \"no cryptography\". The scanner's own repository is excluded because it ships "
        "intentionally weak fixtures.",
        "",
        "| Repository | Findings | Most common |",
        "|---|---:|---|",
    ]
    for repo in repos:
        mine = [r for r in records if r["repo"] == repo]
        lines.append(f"| [{repo}](https://github.com/{OWNER}/{repo}) | {len(mine)} | {counts_line(mine, 3) or '—'} |")
    if records:
        lines += ["", "## Findings", "", "| Repository | Location | Algorithm | Risk | PQC | Reason |", "|---|---|---|---|---|---|"]
        for r in records:
            line = r.get("line")
            anchor = f"#L{line}" if line else ""
            location = f"[{r['file']}{':' + str(line) if line else ''}](https://github.com/{OWNER}/{r['repo']}/blob/HEAD/{r['file']}{anchor})"
            reason = str(r.get("risk_reason") or "").replace("|", "\\|")
            lines.append(f"| {r['repo']} | {location} | {label(r)} | {r.get('risk_level', '')} | {r.get('pqc_status', '')} | {reason} |")
    return "\n".join(lines) + "\n"


def readme_line(repos: list[str], records: list[dict], scanned_on: str) -> str:
    found = counts_line(records) or "no cryptographic calls found"
    not_safe = sum(1 for r in records if str(r.get("pqc_status", "")).upper() == "NOT_SAFE")
    return (f"🧾 **Crypto self-scan** of {len(repos)} public repos ({scanned_on}): {found}"
            f" · {not_safe} not quantum-safe · [full report](reports/crypto-inventory.md)")


def inject(readme: str, line: str) -> str:
    if readme.count(START) != 1 or readme.count(END) != 1:
        raise ValueError("README.md must contain exactly one CRYPTO-SCAN marker pair")
    head, rest = readme.split(START, 1)
    return f"{head}{START}\n{line}\n{END}{rest.split(END, 1)[1]}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("scan_dir", type=Path, help="directory containing <repo>/inventory.json")
    args = parser.parse_args()

    repos, records = load(args.scan_dir)
    if not repos:
        print("No inventories found; leaving reports unchanged", file=sys.stderr)
        return 1
    scanned_on = datetime.now(timezone.utc).strftime("%b %d, %Y").replace(" 0", " ")

    REPORT_MD.parent.mkdir(exist_ok=True)
    REPORT_JSON.write_text(json.dumps({"scanned_on": scanned_on, "repos": repos, "findings": records}, indent=2) + "\n",
                           encoding="utf-8", newline="\n")
    REPORT_MD.write_text(render_markdown(repos, records, scanned_on), encoding="utf-8", newline="\n")
    README.write_text(inject(README.read_text(encoding="utf-8"), readme_line(repos, records, scanned_on)),
                      encoding="utf-8", newline="\n")
    print(f"{len(records)} findings across {len(repos)} repositories")
    return 0


if __name__ == "__main__":
    sys.exit(main())
