#!/usr/bin/env python3
"""One-time structural refactor for the public portfolio.

This script moves temporary inline component code into maintainable assets,
removes duplicate implementations, tightens the visual hierarchy, and updates
the deployment validation workflow. It is removed by the one-time cleanup
workflow after a successful run.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
INDEX = SITE / "index.html"
CORE_CSS = SITE / "assets" / "styles.css"
CORE_JS = SITE / "assets" / "site.js"
COMPONENT_CSS = SITE / "assets" / "portfolio-components.css"
DATA_JS = SITE / "assets" / "portfolio-data.js"
TDAF_JS = SITE / "assets" / "tdaf-demo.js"
DEPLOY_WORKFLOW = ROOT / ".github" / "workflows" / "deploy-portfolio.yml"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def project_opening(
    html: str,
    class_token: str,
    repo: str,
    extra_class: str,
) -> str:
    pattern = re.compile(rf'<article class="([^"]*\b{re.escape(class_token)}\b[^"]*)"([^>]*)>')

    def replace(match: re.Match[str]) -> str:
        classes = match.group(1).split()
        if extra_class and extra_class not in classes:
            classes.append(extra_class)
        attrs = match.group(2)
        attrs = re.sub(r"\sdata-tilt(?=\s|$)", "", attrs)
        if "data-repo=" not in attrs:
            attrs += f' data-repo="{repo}"'
        return f'<article class="{" ".join(classes)}"{attrs}>'

    updated, count = pattern.subn(replace, html, count=1)
    require(count == 1, f"project card not found: {class_token}")
    return updated


def clean_initial_comment(text: str) -> str:
    return re.sub(r"^/\*.*?\*/\s*", "", text.strip(), count=1, flags=re.DOTALL).strip()


def build_data_script() -> str:
    return r'''(() => {
  "use strict";

  const cards = [...document.querySelectorAll("[data-repo]")];
  const evidenceStrip = document.getElementById("evStrip");
  if ((!cards.length && !evidenceStrip) || typeof fetch !== "function") return;

  const CACHE_KEY = "rb-public-repo-evidence-v2";
  const CACHE_TTL = 60 * 60 * 1000;
  const ACTIVE_WINDOW = 180 * 24 * 60 * 60 * 1000;
  const REPOS_ENDPOINT = "https://api.github.com/users/raybeecham/repos?per_page=100&sort=pushed";

  const describeAge = (iso) => {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return null;
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 14) return `${days} days ago`;
    if (days < 60) return `${Math.round(days / 7)} weeks ago`;
    if (days < 365) return `${Math.round(days / 30)} months ago`;
    return `${Math.round(days / 365)} yr ago`;
  };

  const isFresh = (iso) => {
    const then = new Date(iso).getTime();
    return Number.isFinite(then) && Date.now() - then < 8 * 24 * 60 * 60 * 1000;
  };

  const repoLink = (fullName, suffix = "") => `https://github.com/${fullName}${suffix}`;

  const setEvidenceValue = (id, text, href, fresh = false) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.replaceChildren();
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    element.appendChild(link);
    element.classList.toggle("ev-fresh", fresh);
  };

  const ensureFreshChip = (card) => {
    let chip = card.querySelector("[data-fresh]");
    if (chip) return chip;
    const topLine = card.querySelector(".project-topline");
    if (!topLine) return null;
    chip = document.createElement("span");
    chip.className = "fresh-chip";
    chip.dataset.fresh = "";
    chip.hidden = true;
    topLine.appendChild(chip);
    return chip;
  };

  const apply = (repos) => {
    const map = new Map(
      repos
        .filter((repo) => repo?.full_name)
        .map((repo) => [repo.full_name.toLowerCase(), repo])
    );

    cards.forEach((card) => {
      const repo = map.get((card.dataset.repo || "").toLowerCase());
      if (!repo?.pushed_at) return;
      const age = describeAge(repo.pushed_at);
      const chip = ensureFreshChip(card);
      if (!age || !chip) return;
      chip.textContent = `UPDATED ${age.toUpperCase()}`;
      chip.title = `Last public push: ${new Date(repo.pushed_at).toLocaleDateString()}`;
      chip.hidden = false;
    });

    const scout = map.get("raybeecham/quantum-research-scout");
    const warRoom = map.get("raybeecham/pqc-readiness-war-room");
    if (scout?.pushed_at) {
      setEvidenceValue(
        "evScout",
        describeAge(scout.pushed_at) || "view source",
        repoLink(scout.full_name, "/commits"),
        isFresh(scout.pushed_at)
      );
    }
    if (warRoom?.pushed_at) {
      setEvidenceValue(
        "evWarRoom",
        describeAge(warRoom.pushed_at) || "view source",
        repoLink(warRoom.full_name, "/commits"),
        isFresh(warRoom.pushed_at)
      );
    }

    const activeCount = repos.filter((repo) => {
      const pushed = new Date(repo?.pushed_at || "").getTime();
      return !repo?.archived && !repo?.fork && Number.isFinite(pushed) && Date.now() - pushed <= ACTIVE_WINDOW;
    }).length;
    setEvidenceValue("evRepos", String(activeCount), "https://github.com/raybeecham?tab=repositories");

    const newest = repos
      .map((repo) => repo?.pushed_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    const liveMetric = document.querySelector("[data-live-pulse]");
    const liveValue = document.querySelector("[data-live-value]");
    const liveNote = document.querySelector("[data-live-note]");
    if (newest && liveMetric && liveValue) {
      liveValue.textContent = describeAge(newest) || "recently";
      liveMetric.hidden = false;
      if (liveNote) liveNote.hidden = false;
    }

    const note = document.getElementById("evNote");
    if (note) note.textContent = "source: GitHub public API · cached 1 hour";
  };

  const failClosed = () => {
    setEvidenceValue(
      "evScout",
      "view source",
      "https://github.com/raybeecham/quantum-research-scout"
    );
    setEvidenceValue(
      "evWarRoom",
      "view source",
      "https://github.com/raybeecham/pqc-readiness-war-room"
    );
    setEvidenceValue("evRepos", "view source", "https://github.com/raybeecham?tab=repositories");
    const note = document.getElementById("evNote");
    if (note) note.textContent = "live check unavailable · source links retained";
  };

  const load = async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.at < CACHE_TTL && Array.isArray(cached.repos)) {
        apply(cached.repos);
        return;
      }
    } catch {
      // Storage can be unavailable without affecting the portfolio.
    }

    try {
      const response = await fetch(REPOS_ENDPOINT, {
        headers: { Accept: "application/vnd.github+json" }
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      const repos = (await response.json()).map((repo) => ({
        full_name: repo.full_name,
        pushed_at: repo.pushed_at,
        archived: repo.archived,
        fork: repo.fork
      }));
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
      } catch {
        // Freshness still applies for the current visit.
      }
      apply(repos);
    } catch {
      failClosed();
    }
  };

  load();
})();
'''


def refactor_index() -> str:
    html = INDEX.read_text(encoding="utf-8")

    style_matches = list(re.finditer(r"\n\s*<style>\s*(.*?)\s*</style>", html, flags=re.DOTALL | re.IGNORECASE))
    require(len(style_matches) == 1, f"expected one temporary style block, found {len(style_matches)}")
    component_css = clean_initial_comment(style_matches[0].group(1))
    component_css += r'''

/* ---------- Cleanup refinements ---------- */
.identity-line {
  margin: -10px 0 18px;
  color: var(--muted-strong);
  font-size: 0.92rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.priority-note {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: -30px 0 34px;
  padding: 10px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted-strong);
  background: var(--surface-soft);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.035em;
}

.priority-note::before {
  content: "START HERE";
  color: var(--cyan);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.fresh-chip {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding: 5px 8px;
  border: 1px solid rgba(98, 242, 255, 0.22);
  border-radius: 999px;
  color: var(--cyan);
  background: rgba(98, 242, 255, 0.045);
  font-family: var(--font-mono);
  font-size: 0.49rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.fresh-chip[hidden] {
  display: none;
}

.project-priority {
  border-color: color-mix(in srgb, var(--project-accent) 34%, var(--line));
}

.project-secondary {
  min-height: 440px;
}

@media (max-width: 680px) {
  .identity-line {
    font-size: 0.82rem;
  }

  .priority-note {
    align-items: flex-start;
    border-radius: 14px;
    line-height: 1.5;
  }

  .project-secondary {
    min-height: auto;
  }
}
'''
    COMPONENT_CSS.write_text(
        "/* Portfolio component styles: live public evidence and TDAF walkthrough. */\n\n"
        + component_css.strip()
        + "\n",
        encoding="utf-8",
    )

    html = html[: style_matches[0].start()] + "\n" + html[style_matches[0].end() :]
    html = html.replace(
        '<link rel="stylesheet" href="assets/styles.css">',
        '<link rel="stylesheet" href="assets/styles.css">\n  <link rel="stylesheet" href="assets/portfolio-components.css">',
        1,
    )

    inline_scripts = list(
        re.finditer(r"\n\s*<script(?![^>]*\bsrc=)[^>]*>\s*(.*?)\s*</script>", html, flags=re.DOTALL | re.IGNORECASE)
    )
    upgrade_script = next(
        (match for match in inline_scripts if "Interactive TDAF Walkthrough" in match.group(1)),
        None,
    )
    require(upgrade_script is not None, "temporary TDAF script block not found")
    upgrade_content = upgrade_script.group(1)
    tdaf_marker = "/* ---------- Interactive TDAF Walkthrough ---------- */"
    require(tdaf_marker in upgrade_content, "TDAF script marker not found")
    tdaf_content = upgrade_content[upgrade_content.index(tdaf_marker) :]
    tdaf_content = clean_initial_comment(tdaf_content)
    TDAF_JS.write_text(
        "/* Deterministic public TDAF walkthrough. */\n\n" + tdaf_content.strip() + "\n",
        encoding="utf-8",
    )
    DATA_JS.write_text(build_data_script(), encoding="utf-8")
    html = html[: upgrade_script.start()] + "\n" + html[upgrade_script.end() :]

    html = html.replace(
        '<script src="assets/site.js" defer></script>',
        '<script src="assets/site.js" defer></script>\n'
        '  <script src="assets/portfolio-data.js" defer></script>\n'
        '  <script src="assets/tdaf-demo.js" defer></script>',
        1,
    )

    status_pattern = re.compile(r'(<div class="system-status">.*?</div>)', flags=re.DOTALL)
    html, count = status_pattern.subn(
        r'\1\n\n          <p class="identity-line">Quantum security engineer · U.S. Navy veteran · emerging-technology researcher</p>',
        html,
        count=1,
    )
    require(count == 1, "hero system-status block not found")

    html = html.replace(
        'Verified in your browser, not asserted by the author',
        'Live public evidence',
        1,
    )
    html = html.replace(
        '<span class="ev-key">Public repositories</span>',
        '<span class="ev-key">Active public repositories (180d)</span>',
        1,
    )
    html = html.replace(
        '<span class="ev-label"><span class="ev-pulse" aria-hidden="true"></span>Live public evidence</span>',
        '<span class="ev-label" title="Repository activity is fetched from GitHub in the visitor browser and fails closed to source links."><span class="ev-pulse" aria-hidden="true"></span>Live public evidence</span>',
        1,
    )

    project_section_start = html.index('<section class="section section-projects" id="projects">')
    project_bento = html.index('<div class="project-bento">', project_section_start)
    html = (
        html[:project_bento]
        + '<p class="priority-note">Quantum Research Scout · interactive TDAF walkthrough · PQC Readiness War Room</p>\n\n        '
        + html[project_bento:]
    )

    project_cards = (
        ("project-flagship", "raybeecham/quantum-research-scout", "project-priority"),
        ("project-orange", "raybeecham/pqc-readiness-war-room", "project-priority"),
        ("project-violet", "raybeecham/quantum-oncology-benchmark", "project-priority"),
        ("project-lime", "raybeecham/crypto-inventory-demo", "project-secondary"),
        ("project-wide", "raybeecham/claude-certified-associate-foundations", "project-secondary"),
        ("project-blue", "raybeecham/modern-practical-pki", "project-secondary"),
        ("project-amber", "raybeecham/Chrono", "project-secondary"),
    )
    for class_token, repo, extra_class in project_cards:
        html = project_opening(html, class_token, repo, extra_class)

    INDEX.write_text(html, encoding="utf-8")
    return html


def refactor_core_assets() -> None:
    js = CORE_JS.read_text(encoding="utf-8")
    marker = "  // Live repo freshness:"
    require(marker in js, "duplicate live-data marker not found in site.js")
    require(js.rstrip().endswith("})();"), "site.js does not end with the expected IIFE closure")
    js = js[: js.index(marker)].rstrip() + "\n})();\n"
    js = js.replace(
        'const tiltItems = document.querySelectorAll("[data-tilt]");',
        'const tiltItems = document.querySelectorAll(".constellation-shell[data-tilt], .program-card[data-tilt]");',
        1,
    )
    js = js.replace(
        "const count = Math.max(24, Math.min(62, Math.round(width / 24)));",
        "const count = Math.max(20, Math.min(44, Math.round(width / 30)));",
        1,
    )
    js = js.replace(
        "vx: (Math.random() - 0.5) * 0.22,",
        "vx: (Math.random() - 0.5) * 0.14,",
        1,
    )
    js = js.replace(
        "vy: (Math.random() - 0.5) * 0.22,",
        "vy: (Math.random() - 0.5) * 0.14,",
        1,
    )
    CORE_JS.write_text(js, encoding="utf-8")

    css = CORE_CSS.read_text(encoding="utf-8")
    css = css.replace("animation: railMove 35s linear infinite;", "animation: railMove 48s linear infinite;", 1)
    css = css.replace("animation: radarSweep 6s linear infinite;", "animation: radarSweep 9s linear infinite;", 1)
    css = css.replace("animation: cellFloat 7s ease-in-out infinite;", "animation: cellFloat 10s ease-in-out infinite;", 1)
    CORE_CSS.write_text(css, encoding="utf-8")


def update_workflow() -> None:
    workflow = DEPLOY_WORKFLOW.read_text(encoding="utf-8")
    workflow = workflow.replace(
        '      - ".github/workflows/deploy-portfolio.yml"\n  pull_request:',
        '      - ".github/workflows/deploy-portfolio.yml"\n      - "scripts/validate_portfolio.py"\n  pull_request:',
        1,
    )
    workflow = workflow.replace(
        '      - ".github/workflows/deploy-portfolio.yml"\n  workflow_dispatch:',
        '      - ".github/workflows/deploy-portfolio.yml"\n      - "scripts/validate_portfolio.py"\n  workflow_dispatch:',
        1,
    )
    workflow = workflow.replace(
        "  validate:\n    runs-on: ubuntu-latest",
        "  validate:\n    runs-on: ubuntu-latest\n    timeout-minutes: 10",
        1,
    )
    workflow = workflow.replace(
        "  deploy:\n    if: github.event_name != 'pull_request'\n    needs: validate\n    runs-on: ubuntu-latest",
        "  deploy:\n    if: github.event_name != 'pull_request'\n    needs: validate\n    runs-on: ubuntu-latest\n    timeout-minutes: 10",
        1,
    )

    old_validation = '''      - name: Validate static site
        shell: bash
        run: |
          set -euo pipefail
          test -s site/index.html
          test -s site/assets/styles.css
          test -s site/assets/site.js
          node --check site/assets/site.js
          python -m json.tool site/site.webmanifest >/dev/null
          python - <<'PY'
          from html.parser import HTMLParser
          from pathlib import Path

          for file_name in ("site/index.html", "site/404.html"):
              parser = HTMLParser()
              parser.feed(Path(file_name).read_text(encoding="utf-8"))
              parser.close()
              print(f"parsed {file_name}")
          PY
'''
    new_validation = '''      - name: Validate portfolio structure and assets
        shell: bash
        run: |
          set -euo pipefail
          python -m py_compile scripts/validate_portfolio.py
          python scripts/validate_portfolio.py
          find site/assets -type f -name '*.js' -print0 | xargs -0 -n1 node --check
'''
    require(old_validation in workflow, "existing workflow validation block changed unexpectedly")
    workflow = workflow.replace(old_validation, new_validation, 1)
    DEPLOY_WORKFLOW.write_text(workflow, encoding="utf-8")


def main() -> None:
    refactor_index()
    refactor_core_assets()
    update_workflow()
    print("Portfolio refactor applied")


if __name__ == "__main__":
    main()
