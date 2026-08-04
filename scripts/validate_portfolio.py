#!/usr/bin/env python3
"""Dependency-free validation for the static research portfolio.

The checks are intentionally deterministic and suitable for local use and CI.
They validate document structure, local links, asset references, accessibility
basics, modularity boundaries, and lightweight file-size budgets.
"""

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
HTML_FILES = (SITE / "index.html", SITE / "404.html")
REQUIRED_COMPONENTS = (
    SITE / "assets" / "portfolio-components.css",
    SITE / "assets" / "portfolio-data.js",
    SITE / "assets" / "tdaf-demo.js",
)


@dataclass
class Document:
    path: Path
    ids: set[str] = field(default_factory=set)
    duplicate_ids: set[str] = field(default_factory=set)
    references: list[tuple[str, str, dict[str, str]]] = field(default_factory=list)
    anchor_targets: list[str] = field(default_factory=list)
    aria_controls: list[str] = field(default_factory=list)
    images_without_alt: list[str] = field(default_factory=list)
    blank_target_without_rel: list[str] = field(default_factory=list)
    style_tags: int = 0
    inline_scripts: list[str] = field(default_factory=list)
    h1_count: int = 0
    title_text: str = ""
    meta_description: str = ""
    canonical: str = ""


class PortfolioHTMLParser(HTMLParser):
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
            self.doc.meta_description = attrs.get("content", "").strip()
        elif tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.doc.canonical = attrs.get("href", "").strip()

        for attribute in ("href", "src"):
            value = attrs.get(attribute)
            if value:
                self.doc.references.append((tag, value, attrs))

        href = attrs.get("href", "")
        if tag == "a" and href.startswith("#") and len(href) > 1:
            self.doc.anchor_targets.append(unquote(href[1:]))

        controls = attrs.get("aria-controls")
        if controls:
            self.doc.aria_controls.extend(controls.split())

        if tag == "img" and "alt" not in attrs:
            self.doc.images_without_alt.append(attrs.get("src", "<unknown>"))

        if tag == "a" and attrs.get("target") == "_blank":
            rel_tokens = set(attrs.get("rel", "").lower().split())
            if "noopener" not in rel_tokens:
                self.doc.blank_target_without_rel.append(href or "<empty href>")

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
            self.doc.title_text += data
        if self._in_script and not self._script_has_src:
            self._script_parts.append(data)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def parse_document(path: Path, errors: list[str]) -> Document:
    if not path.is_file() or path.stat().st_size == 0:
        fail(errors, f"missing or empty HTML file: {path.relative_to(ROOT)}")
        return Document(path=path)

    parser = PortfolioHTMLParser(path)
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as exc:  # pragma: no cover - defensive CI reporting
        fail(errors, f"HTML parse failed for {path.relative_to(ROOT)}: {exc}")
    return parser.doc


def local_target(source: Path, raw_value: str) -> Path | None:
    value = raw_value.strip()
    if not value or value.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None

    parsed = urlparse(value)
    if parsed.scheme in {"http", "https"} or parsed.netloc:
        return None

    clean_path = unquote(parsed.path)
    if not clean_path:
        return None
    if clean_path.startswith("/"):
        # GitHub Pages project-root paths are deployment concerns, not local files.
        return None
    return (source.parent / clean_path).resolve()


def validate_documents(documents: list[Document], errors: list[str]) -> None:
    ids_by_path = {doc.path.resolve(): doc.ids for doc in documents}

    for doc in documents:
        rel = doc.path.relative_to(ROOT)
        if doc.duplicate_ids:
            fail(errors, f"{rel}: duplicate IDs: {sorted(doc.duplicate_ids)}")
        if doc.images_without_alt:
            fail(errors, f"{rel}: img elements missing alt: {doc.images_without_alt}")
        if doc.blank_target_without_rel:
            fail(errors, f"{rel}: target=_blank links missing rel=noopener: {doc.blank_target_without_rel}")
        if doc.style_tags:
            fail(errors, f"{rel}: inline <style> blocks are not allowed")
        if not doc.title_text.strip():
            fail(errors, f"{rel}: missing document title")
        if not doc.meta_description:
            fail(errors, f"{rel}: missing meta description")

        if doc.path.name == "index.html":
            if doc.h1_count != 1:
                fail(errors, f"{rel}: expected exactly one h1, found {doc.h1_count}")
            if not doc.canonical:
                fail(errors, f"{rel}: missing canonical URL")
            if len(doc.inline_scripts) != 1:
                fail(errors, f"{rel}: expected one inline theme-bootstrap script, found {len(doc.inline_scripts)}")
            elif "rb-theme" not in doc.inline_scripts[0]:
                fail(errors, f"{rel}: the only inline script must be the theme bootstrap")

        for anchor_id in doc.anchor_targets + doc.aria_controls:
            if anchor_id not in doc.ids:
                fail(errors, f"{rel}: unresolved local target #{anchor_id}")

        for tag, raw_value, attrs in doc.references:
            target = local_target(doc.path, raw_value)
            if target is None:
                continue
            parsed = urlparse(raw_value)
            if not target.exists():
                fail(errors, f"{rel}: missing local {tag} target {raw_value}")
                continue
            if parsed.fragment and target.suffix.lower() in {".html", ".htm"}:
                ids = ids_by_path.get(target)
                if ids is None:
                    target_doc = parse_document(target, errors)
                    ids_by_path[target] = target_doc.ids
                    ids = target_doc.ids
                if unquote(parsed.fragment) not in ids:
                    fail(errors, f"{rel}: unresolved fragment {raw_value}")


def validate_assets(errors: list[str]) -> None:
    for required in REQUIRED_COMPONENTS:
        if not required.is_file() or required.stat().st_size == 0:
            fail(errors, f"missing modular component: {required.relative_to(ROOT)}")

    try:
        json.loads((SITE / "site.webmanifest").read_text(encoding="utf-8"))
    except Exception as exc:
        fail(errors, f"invalid site.webmanifest: {exc}")

    for svg in SITE.rglob("*.svg"):
        try:
            ElementTree.parse(svg)
        except Exception as exc:
            fail(errors, f"invalid SVG {svg.relative_to(ROOT)}: {exc}")

    for css in SITE.rglob("*.css"):
        text = css.read_text(encoding="utf-8")
        without_comments = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
        if without_comments.count("{") != without_comments.count("}"):
            fail(errors, f"unbalanced CSS braces: {css.relative_to(ROOT)}")

    sizes = {
        "index HTML": ((SITE / "index.html").stat().st_size, 110_000),
        "combined CSS": (sum(path.stat().st_size for path in SITE.rglob("*.css")), 320_000),
        "combined JS": (sum(path.stat().st_size for path in SITE.rglob("*.js")), 240_000),
    }
    for label, (actual, limit) in sizes.items():
        if actual > limit:
            fail(errors, f"{label} exceeds budget: {actual:,} bytes > {limit:,} bytes")


def validate_cleanup_contract(errors: list[str]) -> None:
    index = (SITE / "index.html").read_text(encoding="utf-8")
    site_js = (SITE / "assets" / "site.js").read_text(encoding="utf-8")
    all_text = "\n".join(path.read_text(encoding="utf-8") for path in SITE.rglob("*") if path.is_file())

    forbidden_markers = (
        "UPGRADE ADDITIONS",
        "Append this entire file",
        "Inlined directly in index.html",
        "Update print statement from 'Hello' to 'Goodbye'",
    )
    for marker in forbidden_markers:
        if marker in all_text:
            fail(errors, f"temporary implementation marker remains: {marker}")

    if "Live public evidence" not in index:
        fail(errors, "hero evidence strip must use the concise 'Live public evidence' label")
    if "identity-line" not in index:
        fail(errors, "hero is missing the personal identity line")
    if re.search(r'class="[^"]*project-card[^"]*"[^>]*data-tilt', index):
        fail(errors, "secondary project cards must not use pointer tilt")
    if "TDAF interactive walkthrough" in site_js:
        fail(errors, "dead duplicate TDAF implementation remains in site.js")
    if "Live repo freshness" in site_js:
        fail(errors, "repository data logic must live in portfolio-data.js")


def main() -> int:
    errors: list[str] = []
    documents = [parse_document(path, errors) for path in HTML_FILES]
    validate_documents(documents, errors)
    validate_assets(errors)
    validate_cleanup_contract(errors)

    if errors:
        print("Portfolio validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Portfolio validation passed")
    print(f"  HTML documents: {len(documents)}")
    print(f"  CSS files: {len(list(SITE.rglob('*.css')))}")
    print(f"  JavaScript files: {len(list(SITE.rglob('*.js')))}")
    print(f"  SVG assets: {len(list(SITE.rglob('*.svg')))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
