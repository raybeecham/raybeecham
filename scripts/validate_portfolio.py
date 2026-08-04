#!/usr/bin/env python3
"""Dependency-free validation for the EvidenceOS static research environment."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
INDEX = SITE / "index.html"
NOT_FOUND = SITE / "404.html"
HTML_FILES = (INDEX, NOT_FOUND)
REQUIRED_ASSETS = (
    SITE / "assets" / "evidence-os.css",
    SITE / "assets" / "evidence-os-data.js",
    SITE / "assets" / "evidence-os.js",
    SITE / "assets" / "evidence-os-globe.js",
    SITE / "assets" / "evidence-os-terminal.js",
    SITE / "assets" / "favicon.svg",
    SITE / "assets" / "evidence-os-social.svg",
)
REQUIRED_SECTIONS = {
    "top",
    "mission-control",
    "situation-room",
    "decision-replay",
    "research-earth",
    "quantum-explorer",
    "timeline",
    "lab",
    "about",
    "contact",
    "terminal",
    "mission-drawer",
}
LEGACY_ASSETS = {
    "assets/styles.css",
    "assets/portfolio-components.css",
    "assets/site.js",
    "assets/portfolio-data.js",
    "assets/tdaf-demo.js",
}


@dataclass
class Document:
    path: Path
    ids: set[str] = field(default_factory=set)
    duplicate_ids: set[str] = field(default_factory=set)
    references: list[tuple[str, str, dict[str, str]]] = field(default_factory=list)
    anchors: list[str] = field(default_factory=list)
    aria_controls: list[str] = field(default_factory=list)
    images_without_alt: list[str] = field(default_factory=list)
    unsafe_blank_links: list[str] = field(default_factory=list)
    style_tags: int = 0
    inline_scripts: list[str] = field(default_factory=list)
    h1_count: int = 0
    title: str = ""
    description: str = ""
    canonical: str = ""
    dialog_count: int = 0
    button_without_type: int = 0


class Parser(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.doc = Document(path=path)
        self._in_title = False
        self._in_script = False
        self._script_has_src = False
        self._script_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {key: value or "" for key, value in attrs_list}
        element_id = attrs.get("id")
        if element_id:
            if element_id in self.doc.ids:
                self.doc.duplicate_ids.add(element_id)
            self.doc.ids.add(element_id)

        if tag == "h1":
            self.doc.h1_count += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "style":
            self.doc.style_tags += 1
        elif tag == "script":
            self._in_script = True
            self._script_has_src = bool(attrs.get("src"))
            self._script_parts = []
        elif tag == "meta" and attrs.get("name", "").lower() == "description":
            self.doc.description = attrs.get("content", "").strip()
        elif tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.doc.canonical = attrs.get("href", "").strip()
        elif tag == "section" and attrs.get("role") == "dialog":
            self.doc.dialog_count += 1
        elif tag == "button" and "type" not in attrs:
            self.doc.button_without_type += 1

        for attribute in ("href", "src"):
            value = attrs.get(attribute)
            if value:
                self.doc.references.append((tag, value, attrs))

        href = attrs.get("href", "")
        if tag == "a" and href.startswith("#") and len(href) > 1:
            self.doc.anchors.append(unquote(href[1:]))
        if attrs.get("aria-controls"):
            self.doc.aria_controls.extend(attrs["aria-controls"].split())
        if tag == "img" and "alt" not in attrs:
            self.doc.images_without_alt.append(attrs.get("src", "<unknown>"))
        if tag == "a" and attrs.get("target") == "_blank":
            rel = set(attrs.get("rel", "").lower().split())
            if "noopener" not in rel:
                self.doc.unsafe_blank_links.append(href or "<empty>")

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_script:
            if not self._script_has_src:
                self.doc.inline_scripts.append("".join(self._script_parts).strip())
            self._in_script = False
            self._script_has_src = False
            self._script_parts = []

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.doc.title += data
        if self._in_script and not self._script_has_src:
            self._script_parts.append(data)


def parse(path: Path, errors: list[str]) -> Document:
    if not path.is_file() or path.stat().st_size == 0:
        errors.append(f"missing or empty file: {path.relative_to(ROOT)}")
        return Document(path=path)
    parser = Parser(path)
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as exc:
        errors.append(f"HTML parse failed for {path.relative_to(ROOT)}: {exc}")
    return parser.doc


def local_target(source: Path, raw: str) -> Path | None:
    value = raw.strip()
    if not value or value.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    parsed = urlparse(value)
    if parsed.scheme in {"http", "https"} or parsed.netloc:
        return None
    path = unquote(parsed.path)
    if not path or path.startswith("/"):
        return None
    return (source.parent / path).resolve()


def validate_html(docs: list[Document], errors: list[str]) -> None:
    ids_by_path = {doc.path.resolve(): doc.ids for doc in docs}
    for doc in docs:
        rel = doc.path.relative_to(ROOT)
        if doc.duplicate_ids:
            errors.append(f"{rel}: duplicate IDs {sorted(doc.duplicate_ids)}")
        if doc.images_without_alt:
            errors.append(f"{rel}: images missing alt {doc.images_without_alt}")
        if doc.unsafe_blank_links:
            errors.append(f"{rel}: target=_blank links missing rel=noopener {doc.unsafe_blank_links}")
        if doc.style_tags:
            errors.append(f"{rel}: inline <style> blocks are not permitted")
        if doc.button_without_type:
            errors.append(f"{rel}: {doc.button_without_type} button element(s) missing explicit type")
        if not doc.title.strip():
            errors.append(f"{rel}: missing title")
        if not doc.description:
            errors.append(f"{rel}: missing meta description")

        if doc.path == INDEX:
            if doc.h1_count != 1:
                errors.append(f"{rel}: expected exactly one h1, found {doc.h1_count}")
            if not doc.canonical:
                errors.append(f"{rel}: missing canonical URL")
            if len(doc.inline_scripts) != 1 or "rb-theme" not in (doc.inline_scripts[0] if doc.inline_scripts else ""):
                errors.append(f"{rel}: only the inline rb-theme bootstrap script is permitted")
            missing_sections = sorted(REQUIRED_SECTIONS - doc.ids)
            if missing_sections:
                errors.append(f"{rel}: missing EvidenceOS section IDs {missing_sections}")
            if doc.dialog_count != 1:
                errors.append(f"{rel}: expected one terminal dialog, found {doc.dialog_count}")
        elif doc.inline_scripts:
            errors.append(f"{rel}: inline scripts are not permitted")

        for target in doc.anchors + doc.aria_controls:
            if target not in doc.ids:
                errors.append(f"{rel}: unresolved local target #{target}")

        for tag, raw, _attrs in doc.references:
            target = local_target(doc.path, raw)
            if target is None:
                continue
            if not target.exists():
                errors.append(f"{rel}: missing local {tag} target {raw}")
                continue
            fragment = urlparse(raw).fragment
            if fragment and target.suffix.lower() in {".html", ".htm"}:
                ids = ids_by_path.get(target)
                if ids is None:
                    ids = parse(target, errors).ids
                    ids_by_path[target] = ids
                if unquote(fragment) not in ids:
                    errors.append(f"{rel}: unresolved fragment {raw}")


def validate_assets(errors: list[str]) -> None:
    for path in REQUIRED_ASSETS:
        if not path.is_file() or path.stat().st_size == 0:
            errors.append(f"missing required asset: {path.relative_to(ROOT)}")

    manifest = SITE / "site.webmanifest"
    try:
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        if payload.get("short_name") != "EvidenceOS":
            errors.append("site.webmanifest: short_name must be EvidenceOS")
    except Exception as exc:
        errors.append(f"invalid site.webmanifest: {exc}")

    for svg in SITE.rglob("*.svg"):
        try:
            ElementTree.parse(svg)
        except Exception as exc:
            errors.append(f"invalid SVG {svg.relative_to(ROOT)}: {exc}")

    for css in SITE.rglob("*.css"):
        text = css.read_text(encoding="utf-8")
        if text.count("{") != text.count("}"):
            errors.append(f"unbalanced CSS braces: {css.relative_to(ROOT)}")


def validate_contract(errors: list[str]) -> None:
    index_text = INDEX.read_text(encoding="utf-8")
    js_text = "\n".join(path.read_text(encoding="utf-8") for path in SITE.rglob("*.js"))
    data_text = (SITE / "assets" / "evidence-os-data.js").read_text(encoding="utf-8")

    for legacy in LEGACY_ASSETS:
        if legacy in index_text:
            errors.append(f"index.html references legacy asset {legacy}")

    for mission_id in ("research", "secure", "pqc", "quantum", "lab"):
        if f'id: "{mission_id}"' not in data_text:
            errors.append(f"EvidenceOS data missing mission {mission_id}")

    required_terms = (
        "MISSION CONTROL",
        "DECISION REPLAY",
        "RESEARCH EARTH",
        "QUANTUM EXPLORER",
        "EvidenceOS Command Interface",
    )
    for term in required_terms:
        if term not in index_text:
            errors.append(f"index.html missing product module label: {term}")

    if js_text.count("https://api.github.com/users/raybeecham/repos") != 1:
        errors.append("expected exactly one public GitHub repository API endpoint")
    if "public_repos" in js_text:
        errors.append("broad GitHub public_repos count must not be used")
    if "innerHTML = command" in js_text or "innerHTML=command" in js_text:
        errors.append("terminal commands must never be inserted as HTML")


def validate_budgets(errors: list[str]) -> None:
    budgets = {
        INDEX: 70_000,
        SITE / "assets" / "evidence-os.css": 90_000,
        SITE / "assets" / "evidence-os-data.js": 60_000,
        SITE / "assets" / "evidence-os.js": 70_000,
        SITE / "assets" / "evidence-os-globe.js": 30_000,
        SITE / "assets" / "evidence-os-terminal.js": 30_000,
    }
    for path, limit in budgets.items():
        if path.is_file() and path.stat().st_size > limit:
            errors.append(f"{path.relative_to(ROOT)} exceeds {limit:,}-byte budget ({path.stat().st_size:,})")
    total_js = sum(path.stat().st_size for path in (SITE / "assets").glob("*.js"))
    if total_js > 180_000:
        errors.append(f"JavaScript total exceeds 180,000-byte budget ({total_js:,})")


def main() -> int:
    errors: list[str] = []
    docs = [parse(path, errors) for path in HTML_FILES]
    validate_html(docs, errors)
    validate_assets(errors)
    validate_contract(errors)
    validate_budgets(errors)

    if errors:
        print("EvidenceOS validation failed:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("EvidenceOS validation passed")
    print(f"  HTML documents: {len(HTML_FILES)}")
    print(f"  CSS bytes: {sum(path.stat().st_size for path in (SITE / 'assets').glob('*.css')):,}")
    print(f"  JavaScript bytes: {sum(path.stat().st_size for path in (SITE / 'assets').glob('*.js')):,}")
    print(f"  mission pathways: 5")
    print(f"  interactive modules: 7")
    return 0


if __name__ == "__main__":
    sys.exit(main())
