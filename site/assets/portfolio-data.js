(() => {
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
