# Portfolio Maintenance Guide

This document defines the public portfolio's structure, quality controls, and release discipline.

## Purpose

The portfolio should communicate one coherent identity:

> Evidence-first engineering for quantum security, applied quantum systems, and emerging-technology decisions.

Visual impact supports that message. It should never obscure the evidence, project boundaries, or accountable-human decision model.

## File ownership

| Path | Responsibility |
|---|---|
| `site/index.html` | Semantic content and page structure only |
| `site/assets/styles.css` | Core layout, design tokens, and shared visual system |
| `site/assets/portfolio-components.css` | Live-evidence and TDAF component styles |
| `site/assets/site.js` | Navigation, theme, reveal, canvas, and restrained motion behavior |
| `site/assets/portfolio-data.js` | Public GitHub freshness data and fail-closed source links |
| `site/assets/tdaf-demo.js` | Deterministic public TDAF walkthrough |
| `scripts/validate_portfolio.py` | Dependency-free CI and local integrity checks |
| `.github/workflows/deploy-portfolio.yml` | Validation and GitHub Pages deployment |

Do not place production CSS or application logic directly inside `index.html`. The only permitted inline script is the small theme bootstrap used to avoid a color-theme flash during page load.

## Content hierarchy

The page should answer three questions quickly:

1. Who is Ray Beecham?
2. What is distinctive about the research practice?
3. Which systems should a visitor inspect first?

The primary path is:

1. Quantum Research Scout
2. Interactive TDAF walkthrough
3. PQC Readiness War Room

Other public projects remain available as supporting evidence, but should not compete equally with the primary path.

## Motion standard

Motion is progressive enhancement, not required content.

Retain:

- hero particle field;
- evidence-core orbit animation;
- restrained section reveals;
- one flagship radar animation;
- explicit support for `prefers-reduced-motion`.

Avoid:

- pointer tilt on every project card;
- multiple simultaneous high-speed loops;
- motion that changes content order or meaning;
- animation that prevents immediate keyboard or screen-reader access.

## Public evidence standard

Browser-fetched repository activity is labeled as live public evidence and must fail closed:

- no invented dates or repository counts;
- cached values expire automatically;
- unavailable data becomes a source link, not a stale assertion;
- archived and forked repositories are excluded from the active-repository count;
- activity claims remain subordinate to the underlying project evidence.

## Local validation

From the repository root:

```bash
python scripts/validate_portfolio.py
node --check site/assets/site.js
node --check site/assets/portfolio-data.js
node --check site/assets/tdaf-demo.js
```

The validator checks:

- HTML structure and duplicate IDs;
- internal anchors and local asset paths;
- image alternative-text presence;
- safe `target="_blank"` links;
- modular CSS and JavaScript boundaries;
- manifest JSON and SVG XML validity;
- lightweight HTML, CSS, and JavaScript size budgets;
- removal of temporary implementation notes and duplicate logic.

## Release checklist

Before tagging a portfolio release:

1. Run all local validation commands.
2. Review desktop, tablet, and mobile layouts.
3. Test dark mode, light mode, and reduced-motion mode.
4. Exercise the TDAF walkthrough using multiple evidence-admission combinations.
5. Verify live project links and repository links.
6. Confirm no private repository URL, employer-sensitive detail, credential, or client-specific claim is exposed.
7. Confirm the GitHub Pages deployment is green.
8. Create the release tag only after the deployed version is reviewed.

The first stable tag should be `v1.0.0` after this cleanup is merged and the deployed site is visually accepted.
