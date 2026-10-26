#!/usr/bin/env python3
"""Inject the latest Frontier Signal evidence into the profile README.

Reads the public signals ledger published by quantum-research-scout and rewrites
only the block between the FRONTIER-SIGNAL markers. Any fetch, schema, or marker
problem exits non-zero and leaves README.md untouched.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
SIGNALS_URL = (
    "https://raw.githubusercontent.com/raybeecham/quantum-research-scout/main/reports/signals.json"
)
DESK_URL = "https://raybeecham.github.io/quantum-research-scout/"
START = "<!-- FRONTIER-SIGNAL:START -->"
END = "<!-- FRONTIER-SIGNAL:END -->"
SUPPORTED_VERSION = 1
MAX_ITEMS = 3
WINDOW_DAYS = 7
MOMENTUM_MARKS = {"rising": "↗", "stable": "→", "declining": "↘"}

# Mirrors the client-identifier rules in validate_portfolio.py. Headlines that
# match are skipped so the automated feed never implies a client relationship.
BLOCKED_PATTERNS = (
    re.compile(r"department of energy", re.IGNORECASE),
    re.compile(r"energy\.gov", re.IGNORECASE),
    re.compile(r"\bDOE\b"),
)
MARKDOWN_SPECIALS = re.compile(r"([\\`*_\[\]<>|#])")


def load_signals(source: str) -> dict:
    if re.match(r"^https?://", source):
        request = urllib.request.Request(source, headers={"User-Agent": "raybeecham-profile"})
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
    else:
        payload = Path(source).read_text(encoding="utf-8")
    data = json.loads(payload)
    if data.get("version") != SUPPORTED_VERSION:
        raise ValueError(f"unsupported signals.json version: {data.get('version')!r}")
    if not isinstance(data.get("themes"), dict) or not data["themes"]:
        raise ValueError("signals.json has no themes")
    return data


def escape(text: str) -> str:
    return MARKDOWN_SPECIALS.sub(r"\\\1", " ".join(str(text).split()))


def safe_url(url: str) -> str | None:
    parsed = urlparse(str(url).strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    return quote(parsed.geturl(), safe=":/?#=&%@+,;~!$'*")


def is_blocked(*fields: str) -> bool:
    text = " ".join(fields)
    return any(pattern.search(text) for pattern in BLOCKED_PATTERNS)


def short_date(value: str) -> str:
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").strftime("%b %d").replace(" 0", " ")
    except ValueError:
        return escape(value)


def select_items(themes: dict, updated_at: str) -> list[dict]:
    """Highest-scoring recent evidence: one item per theme, varied sources, no repeated URLs."""
    candidates = []
    for theme, signal in themes.items():
        for item in signal.get("evidence") or []:
            url = safe_url(item.get("url", ""))
            title = item.get("title", "")
            if not url or not title or is_blocked(title, item.get("source", ""), url):
                continue
            candidates.append({**item, "url": url, "theme": theme, "signal": signal})

    try:
        cutoff = (datetime.fromisoformat(updated_at[:10]) - timedelta(days=WINDOW_DAYS)).date().isoformat()
        recent = [c for c in candidates if c.get("date", "") >= cutoff]
        candidates = recent or candidates
    except ValueError:
        pass
    candidates.sort(key=lambda c: (c.get("score", 0), c.get("date", "")), reverse=True)

    selected, seen_themes, seen_urls, seen_sources = [], set(), set(), set()
    # First pass insists on distinct sources; the second fills any remaining slots.
    for distinct_sources in (True, False):
        for item in candidates:
            if len(selected) == MAX_ITEMS:
                return selected
            if item["theme"] in seen_themes or item["url"] in seen_urls:
                continue
            if distinct_sources and item.get("source") in seen_sources:
                continue
            selected.append(item)
            seen_themes.add(item["theme"])
            seen_urls.add(item["url"])
            seen_sources.add(item.get("source"))
    return selected


def render(data: dict) -> str:
    themes = data["themes"]
    rising = sorted(
        (name for name, s in themes.items() if s.get("momentum") == "rising"),
        key=lambda name: themes[name].get("recent_count", 0),
        reverse=True,
    )
    items = select_items(themes, data.get("updated_at", ""))
    if not items:
        raise ValueError("no publishable evidence items in signals.json")

    lines = [START]
    if rising:
        lines += [f"**Rising this week:** {' · '.join(f'↗ {escape(n)}' for n in rising)}", ""]
    for item in items:
        mark = MOMENTUM_MARKS.get(item["signal"].get("momentum", ""), "·")
        source = escape(item.get("source", "Unknown source"))
        lines.append(
            f"- {mark} **{escape(item['theme'])}** · [{escape(item['title'])}]({item['url']})"
            f" <sub>{source}, {short_date(item.get('date', ''))}</sub>"
        )
    updated = escape(data.get("updated_at", "")[:16].replace("T", " "))
    lines += [
        "",
        f"<sub>Machine-selected from the [Frontier Signal]({DESK_URL}) evidence ledger"
        f" · updated {updated} UTC · headlines are not reviewed or endorsed.</sub>",
        END,
    ]
    return "\n".join(lines)


def inject(readme: str, block: str) -> str:
    if readme.count(START) != 1 or readme.count(END) != 1 or readme.index(START) > readme.index(END):
        raise ValueError("README.md must contain exactly one ordered FRONTIER-SIGNAL marker pair")
    head, rest = readme.split(START, 1)
    _, tail = rest.split(END, 1)
    return head + block + tail


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=SIGNALS_URL, help="signals.json URL or local path")
    parser.add_argument("--readme", type=Path, default=README)
    parser.add_argument("--check", action="store_true", help="print the block without writing")
    args = parser.parse_args()

    try:
        block = render(load_signals(args.source))
        current = args.readme.read_text(encoding="utf-8")
        updated = inject(current, block)
    except Exception as exc:  # noqa: BLE001 - any failure must leave the README alone
        print(f"Frontier Signal update skipped: {exc}", file=sys.stderr)
        return 1

    if args.check:
        sys.stdout.reconfigure(encoding="utf-8")
        print(block)
    elif updated != current:
        args.readme.write_text(updated, encoding="utf-8", newline="\n")
        print("README.md updated")
    else:
        print("README.md already current")
    return 0


if __name__ == "__main__":
    sys.exit(main())
