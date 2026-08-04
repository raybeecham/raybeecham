#!/usr/bin/env python3
"""Normalize public terminology and small UX details after the refinement pass."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(relative: str, old: str, new: str, expected: int = 1) -> None:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    count = content.count(old)
    if count != expected:
        raise RuntimeError(f"{relative}: expected {expected} occurrence(s) of {old!r}, found {count}")
    path.write_text(content.replace(old, new), encoding="utf-8")


def replace_optional(relative: str, old: str, new: str) -> None:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if old in content:
        path.write_text(content.replace(old, new), encoding="utf-8")


def main() -> None:
    replace_optional("README.md", "Research Earth", "Research Network")
    replace_optional("docs/assets/evidence-os-banner.svg", "Research Earth", "Research Network")
    replace_optional("site/assets/evidence-os-social.svg", "RESEARCH EARTH", "RESEARCH NETWORK")
    replace_optional("site/assets/evidence-os-data.js", "research earth", "research network")

    replace(
        "site/assets/evidence-os-terminal.js",
        '    "  earth                       open research earth",',
        '    "  network | earth             open research network",',
    )
    replace(
        "site/assets/evidence-os-terminal.js",
        '    if (head === "earth" || head === "globe") return navigate("#research-earth", "research earth");',
        '    if (head === "network" || head === "earth" || head === "globe") return navigate("#research-earth", "research network");',
    )
    replace(
        "site/assets/evidence-os-refinements.js",
        "    disclosure.open = true;",
        "    disclosure.open = false;",
    )
    replace(
        "scripts/validate_portfolio.py",
        '        data_text and SITE / "assets" / "evidence-os-data.js",',
        '        SITE / "assets" / "evidence-os-data.js",',
    )

    print("EvidenceOS refinement polish applied")


if __name__ == "__main__":
    main()
