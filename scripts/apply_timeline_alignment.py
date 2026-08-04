#!/usr/bin/env python3
"""Wire the exact EvidenceOS timeline alignment stylesheet into the site."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "site" / "index.html"
VALIDATOR = ROOT / "scripts" / "validate_portfolio.py"


def replace_once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return content.replace(old, new, 1)


def main() -> None:
    index = INDEX.read_text(encoding="utf-8")
    index = replace_once(
        index,
        '  <link rel="stylesheet" href="assets/evidence-os-experience-v2.css">\n',
        '  <link rel="stylesheet" href="assets/evidence-os-experience-v2.css">\n'
        '  <link rel="stylesheet" href="assets/evidence-os-timeline-alignment.css">\n',
        "timeline stylesheet link",
    )
    INDEX.write_text(index, encoding="utf-8")

    validator = VALIDATOR.read_text(encoding="utf-8")
    validator = replace_once(
        validator,
        '    SITE / "assets" / "evidence-os-experience-v2.css",\n',
        '    SITE / "assets" / "evidence-os-experience-v2.css",\n'
        '    SITE / "assets" / "evidence-os-timeline-alignment.css",\n',
        "timeline required asset",
    )
    validator = replace_once(
        validator,
        '        SITE / "assets" / "evidence-os-experience-v2.css": 75_000,\n',
        '        SITE / "assets" / "evidence-os-experience-v2.css": 75_000,\n'
        '        SITE / "assets" / "evidence-os-timeline-alignment.css": 15_000,\n',
        "timeline CSS budget",
    )
    VALIDATOR.write_text(validator, encoding="utf-8")

    print("EvidenceOS timeline alignment wired")


if __name__ == "__main__":
    main()
