#!/usr/bin/env python3
"""Wire the second EvidenceOS experience refinement into the static application."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def write(relative: str, content: str) -> None:
    (ROOT / relative).write_text(content, encoding="utf-8")


def replace_once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return content.replace(old, new, 1)


def update_index() -> None:
    path = "site/index.html"
    content = read(path)
    content = replace_once(
        content,
        '  <link rel="stylesheet" href="assets/evidence-os-refinements.css">\n',
        '  <link rel="stylesheet" href="assets/evidence-os-refinements.css">\n'
        '  <link rel="stylesheet" href="assets/evidence-os-experience-v2.css">\n',
        "experience-v2 stylesheet",
    )
    content = replace_once(
        content,
        '  <script src="assets/evidence-os-public-data.js" defer></script>\n'
        '  <script src="assets/evidence-os-globe.js" defer></script>',
        '  <script src="assets/evidence-os-public-data.js" defer></script>\n'
        '  <script src="assets/evidence-os-network-expansion.js" defer></script>\n'
        '  <script src="assets/evidence-os-globe.js" defer></script>',
        "research-network expansion script",
    )
    content = replace_once(
        content,
        '  <script src="assets/evidence-os-refinements.js" defer></script>\n',
        '  <script src="assets/evidence-os-refinements.js" defer></script>\n'
        '  <script src="assets/evidence-os-experience-v2.js" defer></script>\n',
        "experience-v2 script",
    )
    write(path, content)


def update_validator() -> None:
    path = "scripts/validate_portfolio.py"
    content = read(path)
    content = replace_once(
        content,
        '    SITE / "assets" / "evidence-os-refinements.css",\n',
        '    SITE / "assets" / "evidence-os-refinements.css",\n'
        '    SITE / "assets" / "evidence-os-experience-v2.css",\n',
        "required experience-v2 stylesheet",
    )
    content = replace_once(
        content,
        '    SITE / "assets" / "evidence-os-public-data.js",\n',
        '    SITE / "assets" / "evidence-os-public-data.js",\n'
        '    SITE / "assets" / "evidence-os-network-expansion.js",\n',
        "required research-network expansion",
    )
    content = replace_once(
        content,
        '    SITE / "assets" / "evidence-os-refinements.js",\n',
        '    SITE / "assets" / "evidence-os-refinements.js",\n'
        '    SITE / "assets" / "evidence-os-experience-v2.js",\n',
        "required experience-v2 script",
    )
    content = replace_once(
        content,
        '        SITE / "assets" / "evidence-os-data.js",\n'
        '        ROOT / "docs" / "EVIDENCE_OS_ARCHITECTURE.md",',
        '        SITE / "assets" / "evidence-os-data.js",\n'
        '        SITE / "assets" / "evidence-os-network-expansion.js",\n'
        '        ROOT / "docs" / "EVIDENCE_OS_ARCHITECTURE.md",',
        "public network privacy validation",
    )
    content = replace_once(
        content,
        '        SITE / "assets" / "evidence-os-refinements.css": 85_000,\n',
        '        SITE / "assets" / "evidence-os-refinements.css": 85_000,\n'
        '        SITE / "assets" / "evidence-os-experience-v2.css": 75_000,\n',
        "experience-v2 CSS budget",
    )
    content = replace_once(
        content,
        '        SITE / "assets" / "evidence-os-public-data.js": 35_000,\n',
        '        SITE / "assets" / "evidence-os-public-data.js": 35_000,\n'
        '        SITE / "assets" / "evidence-os-network-expansion.js": 45_000,\n',
        "network expansion budget",
    )
    content = replace_once(
        content,
        '        SITE / "assets" / "evidence-os-refinements.js": 90_000,\n',
        '        SITE / "assets" / "evidence-os-refinements.js": 90_000,\n'
        '        SITE / "assets" / "evidence-os-experience-v2.js": 95_000,\n',
        "experience-v2 JavaScript budget",
    )
    content = replace_once(
        content,
        '    if total_js > 320_000:\n        errors.append(f"JavaScript total exceeds 320,000-byte budget ({total_js:,})")',
        '    if total_js > 400_000:\n        errors.append(f"JavaScript total exceeds 400,000-byte budget ({total_js:,})")',
        "total JavaScript budget",
    )
    write(path, content)


def update_documentation() -> None:
    path = "docs/EVIDENCE_OS_ARCHITECTURE.md"
    content = read(path)
    marker = "## Local validation\n"
    addition = '''## Experience refinement v2

### Research-network density

The public network can be expanded through `site/assets/evidence-os-network-expansion.js`. New nodes must use public sources, avoid client-specific identifiers, remain non-operational, and add meaningful standards, public-program, security, research, or architecture diversity. Density is controlled through mission and category lenses, a visible-node directory, and source-level inspection rather than by showing every marker at equal prominence.

### Quantum interaction console

The Quantum Computer Explorer supports four synchronized views:

- Physical, with accessible component hotspots;
- Control flow, showing preparation, interaction, and measurement pathways;
- Bottlenecks, exposing connectivity, implementation, and error-correction constraints;
- Mission fit, treating workloads as experiment hypotheses rather than provider recommendations.

A comparison drawer places two architecture families side by side. All profile bars remain qualitative and cannot be described as measured scores, current backend data, or provider rankings.

### Decision-trace termination

The Decision Replay spine is rendered as discrete stage-to-stage segments. The final segment terminates at the Decide marker and must never extend into unused layout space.

### Final action hub

The principal-researcher section establishes identity and method without duplicating external profile buttons. The final section routes visitors into decision replay, the research network, the quantum lab, public source code, the terminal, or one professional contact channel.

'''
    if "## Experience refinement v2" not in content:
        content = replace_once(content, marker, addition + marker, "experience-v2 documentation")
    write(path, content)


def main() -> None:
    update_index()
    update_validator()
    update_documentation()
    print("EvidenceOS experience refinement v2 wired")


if __name__ == "__main__":
    main()
