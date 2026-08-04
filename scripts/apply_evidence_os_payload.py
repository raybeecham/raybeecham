#!/usr/bin/env python3
"""Apply the staged EvidenceOS archive to the portfolio branch.

This one-time helper reconstructs a gzip-compressed tar archive from chunked
base64 files, verifies every archive member remains inside the repository, then
extracts the new EvidenceOS static site and removes superseded portfolio assets.
"""

from __future__ import annotations

import base64
import io
import shutil
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = ROOT / ".evidenceos-payload"

SUPERSEDED_PATHS = (
    "site/assets/styles.css",
    "site/assets/portfolio-components.css",
    "site/assets/site.js",
    "site/assets/portfolio-data.js",
    "site/assets/tdaf-demo.js",
    "site/assets/portfolio-social.svg",
    "docs/PORTFOLIO_MAINTENANCE.md",
    "docs/assets/research-portfolio-banner.svg",
)


def safe_extract(archive: tarfile.TarFile) -> None:
    root = ROOT.resolve()
    for member in archive.getmembers():
        target = (ROOT / member.name).resolve()
        if target != root and root not in target.parents:
            raise ValueError(f"Archive path escapes repository: {member.name}")
        if member.issym() or member.islnk():
            raise ValueError(f"Archive links are not permitted: {member.name}")
    archive.extractall(ROOT)


def main() -> None:
    chunks = sorted(PAYLOAD.glob("*.txt"))
    if len(chunks) != 10:
        raise RuntimeError(f"Expected 10 payload chunks, found {len(chunks)}")

    encoded = "".join(path.read_text(encoding="utf-8").strip() for path in chunks)
    compressed = base64.b64decode(encoded, validate=True)

    with tarfile.open(fileobj=io.BytesIO(compressed), mode="r:gz") as archive:
        safe_extract(archive)

    for relative in SUPERSEDED_PATHS:
        path = ROOT / relative
        if path.exists():
            path.unlink()

    shutil.rmtree(PAYLOAD)
    print("EvidenceOS payload applied")


if __name__ == "__main__":
    main()
