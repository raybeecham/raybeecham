#!/usr/bin/env python3
"""Apply the EvidenceOS visual, privacy, and decision-record refinement pass."""

from __future__ import annotations

import re
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


def refine_index() -> None:
    path = "site/index.html"
    content = read(path)

    content = replace_once(
        content,
        '  <link rel="stylesheet" href="assets/evidence-os.css">\n',
        '  <link rel="stylesheet" href="assets/evidence-os.css">\n'
        '  <link rel="stylesheet" href="assets/evidence-os-refinements.css">\n',
        "refinement stylesheet",
    )
    content = replace_once(
        content,
        '<a href="#research-earth">Earth</a>',
        '<a href="#research-earth">Network</a>',
        "network navigation label",
    )
    content = replace_once(
        content,
        '<span>LIVE RESEARCH EARTH</span>',
        '<span>RESEARCH NETWORK</span>',
        "hero network module label",
    )
    content = replace_once(
        content,
        '<p>Evidence enters, admission boundaries fire, deterministic rules evaluate, a record is produced, and human authority remains visible at the end of the chain.</p>',
        '<p>Evidence enters, admission boundaries fire, deterministic rules evaluate, and two synchronized outputs appear: a human-readable decision brief and the canonical JSON decision record. Human authority remains visible at the end of the chain.</p>',
        "decision replay explanation",
    )
    content = replace_once(
        content,
        '<div><p class="eyebrow">Live research earth</p><h2>A global map of standards, government, research, and quantum industry signals.</h2></div>\n'
        '          <p>Rotate the globe and inspect public organizations relevant to the selected mission. This is an illustrative research network, not a live operational or geopolitical tracking system.</p>',
        '<div><p class="eyebrow">Research network</p><h2>A living map of the public quantum and security ecosystem.</h2></div>\n'
        '          <p>Change the network lens, inspect the visible-node directory, rotate to a source, and follow how standards, multi-agency public programs, security communities, research institutions, and technology providers relate to the selected mission. The network is illustrative, curated, and non-operational.</p>',
        "research network heading",
    )
    content = replace_once(
        content,
        '<div class="chip-stage" aria-hidden="true">',
        '<div class="chip-stage" role="img" aria-live="polite" aria-label="Representative physical schematic of the selected quantum computing architecture">',
        "quantum schematic accessibility",
    )
    content = replace_once(
        content,
        '  <script src="assets/evidence-os-data.js" defer></script>\n'
        '  <script src="assets/evidence-os-globe.js" defer></script>\n'
        '  <script src="assets/evidence-os-terminal.js" defer></script>\n'
        '  <script src="assets/evidence-os.js" defer></script>',
        '  <script src="assets/evidence-os-data.js" defer></script>\n'
        '  <script src="assets/evidence-os-public-data.js" defer></script>\n'
        '  <script src="assets/evidence-os-globe.js" defer></script>\n'
        '  <script src="assets/evidence-os-terminal.js" defer></script>\n'
        '  <script src="assets/evidence-os.js" defer></script>\n'
        '  <script src="assets/evidence-os-refinements.js" defer></script>',
        "refinement script order",
    )

    write(path, content)


def refine_public_network_data() -> None:
    path = "site/assets/evidence-os-data.js"
    content = read(path)

    public_nodes = '''
    {
      id: "us-federal-quantum-network",
      name: "U.S. Federal Quantum & Cybersecurity Programs",
      location: "United States",
      lat: 38.9072,
      lon: -77.0369,
      category: "government",
      relevance: "Multi-agency public activity spanning quantum information science, cryptographic standards, cybersecurity, workforce development, national laboratories, and advanced research.",
      link: "https://www.quantum.gov/"
    },
    {
      id: "european-quantum-programs",
      name: "European Public Quantum Programs",
      location: "European Union",
      lat: 50.8503,
      lon: 4.3517,
      category: "government",
      relevance: "Multi-country public research and innovation programs spanning quantum computing, simulation, communication, sensing, and ecosystem development.",
      link: "https://qt.eu/"
    },
    {
      id: "uk-quantum-programme",
      name: "UK National Quantum Technologies Programme",
      location: "United Kingdom",
      lat: 51.5074,
      lon: -0.1278,
      category: "government",
      relevance: "A cross-government and research program connecting national strategy, research hubs, skills, infrastructure, and quantum-technology transition.",
      link: "https://www.gov.uk/government/publications/national-quantum-strategy"
    },
    {
      id: "ietf-pquip",
      name: "IETF Post-Quantum Use in Protocols",
      location: "Global standards community",
      lat: 18.0,
      lon: -28.0,
      category: "standards",
      relevance: "Open Internet standards work examining post-quantum transition, protocol integration, operational considerations, and implementation guidance.",
      link: "https://datatracker.ietf.org/wg/pquip/about/"
    },
    {
      id: "etsi-qsc",
      name: "ETSI Quantum-Safe Cryptography",
      location: "Sophia Antipolis, France",
      lat: 43.6156,
      lon: 7.055,
      category: "standards",
      relevance: "Public standards and technical work addressing quantum-safe cryptography, migration, interoperability, and deployment considerations.",
      link: "https://www.etsi.org/technologies/quantum-safe-cryptography"
    },
    {
      id: "open-quantum-safe",
      name: "Open Quantum Safe",
      location: "Global open-source community",
      lat: 43.4723,
      lon: -80.5449,
      category: "security",
      relevance: "Open-source post-quantum cryptographic implementations and integrations used for research, interoperability testing, and migration experimentation.",
      link: "https://openquantumsafe.org/"
    },
    {
      id: "qutech",
      name: "QuTech",
      location: "Delft, Netherlands",
      lat: 52.0116,
      lon: 4.3571,
      category: "research",
      relevance: "Public quantum research spanning computing, networking, hardware, software, and foundational system engineering.",
      link: "https://qutech.nl/"
    },
'''

    pattern = re.compile(
        r'\n    \{\n      id: "nist",.*?\n    \},\n    \{\n      id: "iqm",',
        re.DOTALL,
    )
    replacement = "\n" + public_nodes + '    {\n      id: "iqm",'
    content, count = pattern.subn(replacement, content, count=1)
    if count != 1:
        raise RuntimeError(f"public network aggregation: expected one source block, found {count}")

    forbidden = ("U.S. Department of Energy", "energy.gov/science/quantum", 'id: "doe"')
    for token in forbidden:
        if token in content:
            raise RuntimeError(f"client-specific public identifier remains in network data: {token}")

    write(path, content)


def remove_runtime_client_block() -> None:
    path = "site/assets/evidence-os-public-data.js"
    content = read(path)
    pattern = re.compile(
        r'\n  // Runtime defense:.*?\n  for \(let index = data\.earthMarkers\.length - 1; index >= 0; index -= 1\) \{\n'
        r'    if \(excludedIds\.has\(data\.earthMarkers\[index\]\.id\)\) data\.earthMarkers\.splice\(index, 1\);\n'
        r'  \}\n',
        re.DOTALL,
    )
    content, count = pattern.subn("\n", content, count=1)
    if count != 1:
        raise RuntimeError(f"runtime identifier block: expected one match, found {count}")
    write(path, content)


def refine_architecture_documentation() -> None:
    path = "docs/EVIDENCE_OS_ARCHITECTURE.md"
    content = read(path).replace("Research Earth", "Research Network")
    marker = "## Local validation\n"
    addition = '''## Refinement contracts

### Research Network

The Research Network is a curated public-source map. Public-sector nodes must represent multi-agency or multi-country programs rather than a single client-specific organization. Presence in the network does not imply a client relationship, endorsement, partnership, facility knowledge, personnel tracking, or operational monitoring.

### Architecture schematics

The Quantum Computer Explorer uses original, representative physical schematics to explain what each generic architecture family looks like. Schematics are vendor-neutral, not to scale, and do not depict a specific provider backend. Qualitative profile bars support discussion and are not benchmark scores or rankings.

### Decision-record presentation

The JSON Decision Record remains canonical. The human-readable decision brief is rendered from the same scenario and record so a non-specialist can understand the recommendation, rationale, next action, controls, unknowns, and accountable authority boundary. The brief does not create a second decision entity.

'''
    if "## Refinement contracts" not in content:
        content = replace_once(content, marker, addition + marker, "architecture refinement documentation")
    write(path, content)


def refine_validator() -> None:
    path = "scripts/validate_portfolio.py"
    content = read(path)

    old_assets = '''REQUIRED_ASSETS = (
    SITE / "assets" / "evidence-os.css",
    SITE / "assets" / "evidence-os-data.js",
    SITE / "assets" / "evidence-os.js",
    SITE / "assets" / "evidence-os-globe.js",
    SITE / "assets" / "evidence-os-terminal.js",
    SITE / "assets" / "favicon.svg",
    SITE / "assets" / "evidence-os-social.svg",
)'''
    new_assets = '''REQUIRED_ASSETS = (
    SITE / "assets" / "evidence-os.css",
    SITE / "assets" / "evidence-os-refinements.css",
    SITE / "assets" / "evidence-os-data.js",
    SITE / "assets" / "evidence-os-public-data.js",
    SITE / "assets" / "evidence-os.js",
    SITE / "assets" / "evidence-os-refinements.js",
    SITE / "assets" / "evidence-os-globe.js",
    SITE / "assets" / "evidence-os-terminal.js",
    SITE / "assets" / "favicon.svg",
    SITE / "assets" / "evidence-os-social.svg",
)'''
    content = replace_once(content, old_assets, new_assets, "required refinement assets")
    content = replace_once(content, '        "RESEARCH EARTH",', '        "RESEARCH NETWORK",', "network contract term")

    old_contract_header = '''    index_text = INDEX.read_text(encoding="utf-8")
    js_text = "\\n".join(path.read_text(encoding="utf-8") for path in SITE.rglob("*.js"))
    data_text = (SITE / "assets" / "evidence-os-data.js").read_text(encoding="utf-8")
'''
    new_contract_header = '''    index_text = INDEX.read_text(encoding="utf-8")
    js_text = "\\n".join(path.read_text(encoding="utf-8") for path in SITE.rglob("*.js"))
    data_text = (SITE / "assets" / "evidence-os-data.js").read_text(encoding="utf-8")
    public_paths = [
        ROOT / "README.md",
        INDEX,
        data_text and SITE / "assets" / "evidence-os-data.js",
        ROOT / "docs" / "EVIDENCE_OS_ARCHITECTURE.md",
    ]
    public_text = "\\n".join(
        path.read_text(encoding="utf-8")
        for path in public_paths
        if isinstance(path, Path) and path.is_file()
    )
    forbidden_public_identifiers = (
        "U.S. Department of Energy",
        "energy.gov/science/quantum",
        'id: "doe"',
    )
    for token in forbidden_public_identifiers:
        if token in public_text:
            errors.append(f"public portfolio contains client-specific identifier: {token}")
    if re.search(r"\\bDOE\\b", public_text):
        errors.append("public portfolio contains client-specific DOE acronym")
'''
    content = replace_once(content, old_contract_header, new_contract_header, "public identifier validation")

    old_budgets = '''    budgets = {
        INDEX: 70_000,
        SITE / "assets" / "evidence-os.css": 90_000,
        SITE / "assets" / "evidence-os-data.js": 60_000,
        SITE / "assets" / "evidence-os.js": 70_000,
        SITE / "assets" / "evidence-os-globe.js": 30_000,
        SITE / "assets" / "evidence-os-terminal.js": 30_000,
    }'''
    new_budgets = '''    budgets = {
        INDEX: 80_000,
        SITE / "assets" / "evidence-os.css": 95_000,
        SITE / "assets" / "evidence-os-refinements.css": 85_000,
        SITE / "assets" / "evidence-os-data.js": 75_000,
        SITE / "assets" / "evidence-os-public-data.js": 35_000,
        SITE / "assets" / "evidence-os.js": 80_000,
        SITE / "assets" / "evidence-os-refinements.js": 90_000,
        SITE / "assets" / "evidence-os-globe.js": 60_000,
        SITE / "assets" / "evidence-os-terminal.js": 35_000,
    }'''
    content = replace_once(content, old_budgets, new_budgets, "refinement size budgets")
    content = replace_once(
        content,
        '    if total_js > 180_000:\n        errors.append(f"JavaScript total exceeds 180,000-byte budget ({total_js:,})")',
        '    if total_js > 320_000:\n        errors.append(f"JavaScript total exceeds 320,000-byte budget ({total_js:,})")',
        "total JavaScript budget",
    )

    write(path, content)


def main() -> None:
    refine_index()
    refine_public_network_data()
    remove_runtime_client_block()
    refine_architecture_documentation()
    refine_validator()
    print("EvidenceOS refinement pass applied")


if __name__ == "__main__":
    main()
