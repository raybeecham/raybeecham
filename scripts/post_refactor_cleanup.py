#!/usr/bin/env python3
"""Apply small normalization fixes after the one-time portfolio refactor."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "site" / "index.html"
NOT_FOUND = ROOT / "site" / "404.html"


def update_project(html: str, heading: str, repo: str, extra_class: str) -> str:
    heading_markup = f"<h3>{heading}</h3>"
    heading_at = html.index(heading_markup)
    start = html.rfind("<article ", 0, heading_at)
    end = html.index(">", start) + 1
    opening = html[start:end]

    class_start = opening.index('class="') + len('class="')
    class_end = opening.index('"', class_start)
    classes = opening[class_start:class_end].split()
    if extra_class not in classes:
        classes.append(extra_class)

    cleaned = opening[:class_start] + " ".join(classes) + opening[class_end:]
    cleaned = cleaned.replace(" data-tilt", "")
    if "data-repo=" not in cleaned:
        cleaned = cleaned[:-1] + f' data-repo="{repo}">'
    return html[:start] + cleaned + html[end:]


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    projects = (
        ("Quantum Research Scout", "raybeecham/quantum-research-scout", "project-priority"),
        ("PQC Readiness War Room", "raybeecham/pqc-readiness-war-room", "project-priority"),
        ("Quantum Oncology Benchmark", "raybeecham/quantum-oncology-benchmark", "project-priority"),
        ("Crypto Inventory Demo", "raybeecham/crypto-inventory-demo", "project-secondary"),
        ("AI Systems Engineering Handbook", "raybeecham/claude-certified-associate-foundations", "project-secondary"),
        ("Modern Practical PKI", "raybeecham/modern-practical-pki", "project-secondary"),
        ("Chrono", "raybeecham/Chrono", "project-secondary"),
    )
    for heading, repo, extra_class in projects:
        html = update_project(html, heading, repo, extra_class)
    INDEX.write_text(html, encoding="utf-8")

    not_found = NOT_FOUND.read_text(encoding="utf-8")
    if '<meta name="description"' not in not_found:
        marker = '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        description = '  <meta name="description" content="Page not found. Return to Ray Beecham\'s research portfolio.">\n'
        if marker not in not_found:
            raise RuntimeError("404 viewport marker not found")
        not_found = not_found.replace(marker, marker + description, 1)
        NOT_FOUND.write_text(not_found, encoding="utf-8")

    print("Post-refactor normalization applied")


if __name__ == "__main__":
    main()
