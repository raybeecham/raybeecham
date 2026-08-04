#!/usr/bin/env python3
"""Apply the staged EvidenceOS archive to the portfolio branch.

This one-time helper reconstructs a gzip-compressed tar archive from chunked
base64 files, verifies the exact staged payload and every archive member, then
extracts the EvidenceOS static site and removes superseded portfolio assets.
"""

from __future__ import annotations

import base64
import hashlib
import io
import shutil
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = ROOT / ".evidenceos-payload"

EXPECTED_SHA256 = {
    "00.txt": "9cd362541b3958cf74280fc0147494aad51ecc22b827c311db592a5f15e17cc7",
    "01.txt": "28a025af07b9712c6de42ece704397a0c69390209796d48b2484e1b956ffa173",
    "02.txt": "76fa576ec7e7ab91c58969a61dfc044ba05994a6046677d838dd443e3907764e",
    "03.txt": "b5f3af0e56dad5f888dc7c877831468a274042d72cc9555fe84696f0bfb0c4fe",
    "04.txt": "2f72d574a579b86ededb183f1e0a2d78e39d6bd62f7e86d4d43f4ebd8da0fa71",
    "05.txt": "13706d40d0c3168b427b0bbf0cf1168556fd493d11e748508b9e6ce7fbf7f1e3",
    "06.txt": "ed8b2ab43745bcaee91a0eab79a2526a4a62f9f49c09048e749dc311149da88e",
    "07.txt": "cda3ab72d1b2cb8b3f167fdc98ef300f724eb6f3f66a2cfd334234200bccae1e",
    "08.txt": "1aa1162586b79c38b337e548a9a4575f90c2a3fa50768491f44df6e80212c955",
    "09.txt": "72919d5fa549b770cecce4b829070fc43d5f8dba7eb8e82babd4aa1b0c802d0c",
}

REQUIRED_ARCHIVE_MEMBERS = {
    "README.md",
    "docs/EVIDENCE_OS_ARCHITECTURE.md",
    "docs/assets/evidence-os-banner.svg",
    "scripts/validate_portfolio.py",
    "site/404.html",
    "site/index.html",
    "site/site.webmanifest",
    "site/assets/evidence-os.css",
    "site/assets/evidence-os-data.js",
    "site/assets/evidence-os-globe.js",
    "site/assets/evidence-os.js",
    "site/assets/evidence-os-terminal.js",
    "site/assets/evidence-os-social.svg",
    "site/assets/favicon.svg",
}

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


def validate_chunks(chunks: list[Path]) -> None:
    if [path.name for path in chunks] != list(EXPECTED_SHA256):
        raise RuntimeError(f"Unexpected payload chunks: {[path.name for path in chunks]}")

    mismatches: list[str] = []
    for path in chunks:
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        expected = EXPECTED_SHA256[path.name]
        print(f"payload {path.name}: {actual}")
        if actual != expected:
            mismatches.append(f"{path.name}: expected {expected}, found {actual}")
    if mismatches:
        raise RuntimeError("Payload checksum mismatch:\n  " + "\n  ".join(mismatches))


def safe_extract(archive: tarfile.TarFile) -> None:
    root = ROOT.resolve()
    members = archive.getmembers()
    names = {member.name for member in members}
    missing = sorted(REQUIRED_ARCHIVE_MEMBERS - names)
    if missing:
        raise RuntimeError(f"Archive is missing required members: {missing}")

    for member in members:
        target = (ROOT / member.name).resolve()
        if target != root and root not in target.parents:
            raise ValueError(f"Archive path escapes repository: {member.name}")
        if member.issym() or member.islnk():
            raise ValueError(f"Archive links are not permitted: {member.name}")
    archive.extractall(ROOT)


def main() -> None:
    chunks = sorted(PAYLOAD.glob("*.txt"))
    validate_chunks(chunks)

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
