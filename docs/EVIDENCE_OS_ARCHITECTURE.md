# EvidenceOS Architecture

EvidenceOS is the public, interactive research environment behind Ray Beecham's GitHub portfolio.

It is intentionally built as a dependency-free static application. The product experience is immersive, but the implementation remains inspectable, portable, privacy-conscious, and suitable for GitHub Pages.

## Product thesis

A conventional portfolio answers:

> What has this person built?

EvidenceOS answers:

> What is it like to reason inside this research environment?

The interface organizes public and bounded research around mission context, evidence flow, explicit unknowns, deterministic decision support, and retained human authority.

## Experience modules

| Module | Purpose |
|---|---|
| Mission Router | Changes the operating context across enterprise security, PQC migration, quantum evaluation, research intelligence, and open-lab exploration |
| Mission Control | Shows how public systems, private R&D, laboratories, benchmarks, and decision methods connect |
| Cyber Situation Room | Combines mission brief, public repository evidence, research signals, controls, and decision-engine health |
| Decision Replay | Executes bounded technology decisions through Observe, Admit, Evaluate, Record, and Decide stages |
| Research Network | Presents an illustrative global network of public standards, government, research, security, and vendor organizations |
| Quantum Computer Explorer | Compares generic architecture families through workload fit, native operations, routing, constraints, and error-correction questions |
| Research Timeline | Shows how individual tools evolved into an evidence-first operating method |
| Command Terminal | Provides keyboard-first navigation, mission routing, system discovery, and deliberate easter eggs |

## File ownership

| Path | Responsibility |
|---|---|
| `site/index.html` | Semantic application shell and public content |
| `site/assets/evidence-os.css` | Design system, layouts, responsive behavior, and reduced-motion rules |
| `site/assets/evidence-os-data.js` | Mission, system graph, decision scenario, globe, architecture, and timeline data |
| `site/assets/evidence-os.js` | Core application state, mission routing, graph, situation room, replay, explorer, timeline, and public GitHub evidence |
| `site/assets/evidence-os-globe.js` | Dependency-free rotating research globe |
| `site/assets/evidence-os-terminal.js` | Keyboard terminal and command routing |
| `scripts/validate_portfolio.py` | Deterministic structure, accessibility, asset, contract, and size-budget validation |
| `.github/workflows/deploy-portfolio.yml` | Pull-request validation and GitHub Pages deployment |

## Mission-state contract

Mission selection changes presentation and prioritization, not underlying facts.

Each mission defines:

- operating objective;
- primary question;
- material risk;
- relevant system set;
- primary evidence path;
- situation-room controls;
- research-earth categories;
- terminal shortcut.

The mission state is stored locally in the visitor browser. No analytics or server-side profile is created.

## Public evidence behavior

EvidenceOS uses a single public GitHub API request to show repository freshness and the count of active public repositories.

Controls:

- no token or credential;
- one-hour session cache;
- archived repositories excluded;
- forks excluded;
- activity window limited to 180 days;
- request failure becomes source links, not fabricated status;
- repository activity never substitutes for project evidence.

## Research-earth boundary

The globe contains public organizations and broad public relevance descriptions. It is:

- illustrative;
- manually curated;
- non-operational;
- non-exhaustive;
- not a geopolitical, facility, personnel, or intelligence-tracking system.

## Quantum explorer boundary

The architecture explorer compares generic technology families qualitatively. It does not rank providers or claim current hardware superiority.

A serious comparison still requires:

- backend snapshot;
- workload definition;
- compiled circuit or embedded problem;
- execution mode;
- cost and queue context;
- error provenance;
- shared success metrics;
- credible classical baseline.

## Terminal safety

Terminal input is inserted with `textContent`, never interpreted as HTML or code. Commands only:

- navigate the static site;
- select a mission;
- list systems;
- open explicit public links;
- return predetermined explanatory text.

The terminal cannot execute shell commands, access local files, call private APIs, or escalate privileges.

## Accessibility and motion

The application supports:

- one semantic primary heading;
- keyboard-accessible navigation and SVG graph nodes;
- explicit button types;
- skip navigation;
- dialog semantics for the terminal;
- descriptive canvas labels and text alternatives nearby;
- high-contrast dark and light themes;
- `prefers-reduced-motion` across boot, particles, orbits, rail, chip, and reveals;
- usable content when dynamic effects are unavailable.

## Refinement contracts

### Research Network

The Research Network is a curated public-source map. Public-sector nodes must represent multi-agency or multi-country programs rather than a single client-specific organization. Presence in the network does not imply a client relationship, endorsement, partnership, facility knowledge, personnel tracking, or operational monitoring.

### Architecture schematics

The Quantum Computer Explorer uses original, representative physical schematics to explain what each generic architecture family looks like. Schematics are vendor-neutral, not to scale, and do not depict a specific provider backend. Qualitative profile bars support discussion and are not benchmark scores or rankings.

### Decision-record presentation

The JSON Decision Record remains canonical. The human-readable decision brief is rendered from the same scenario and record so a non-specialist can understand the recommendation, rationale, next action, controls, unknowns, and accountable authority boundary. The brief does not create a second decision entity.

## Local validation

```bash
python scripts/validate_portfolio.py
find site/assets -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

The validator checks:

- HTML parseability;
- one primary heading;
- duplicate IDs;
- internal anchors and `aria-controls` targets;
- local asset references;
- image alternative text;
- safe blank-target links;
- inline style and script boundaries;
- required EvidenceOS modules;
- mission and product contracts;
- GitHub API deduplication;
- manifest and SVG validity;
- CSS brace balance;
- HTML, CSS, and JavaScript size budgets.

## Release standard

A future stable release should be tagged only after:

1. CI passes on the merged commit.
2. GitHub Pages deployment is green.
3. Desktop, tablet, and mobile layouts are reviewed.
4. Dark, light, and reduced-motion modes are tested.
5. Each mission changes the expected graph and situation view.
6. All decision scenarios replay to deterministic records.
7. Globe markers and public links are reviewed for public-safe accuracy.
8. Terminal navigation and input handling are tested.
9. No private repository, client identifier, credential, or internal evidence is exposed.
