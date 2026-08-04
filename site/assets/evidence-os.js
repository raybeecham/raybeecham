(() => {
  "use strict";

  const data = window.EvidenceOSData;
  if (!data) return;

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const missionIds = Object.keys(data.missions).sort((a, b) => data.missions[a].order - data.missions[b].order);
  const state = {
    mission: localStorage.getItem("evidenceos-mission") || "research",
    selectedSystem: null,
    replayScenario: "pqc",
    replayTimer: null,
    replayIndex: -1,
    replayPaused: false,
    architecture: "superconducting",
    timeline: data.timeline[0]?.id || null
  };

  if (!data.missions[state.mission]) state.mission = "research";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const colorByAccent = {
    cyan: "#62f2ff",
    violet: "#9f7cff",
    lime: "#b8f45d",
    amber: "#ffbe68",
    orange: "#ff8a5c",
    red: "#ff6b83",
    blue: "#5f9dff"
  };

  const relativeTime = (iso) => {
    const then = Date.parse(iso);
    if (!Number.isFinite(then)) return null;
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days}d ago`;
    if (days < 60) return `${Math.round(days / 7)}w ago`;
    if (days < 365) return `${Math.round(days / 30)}mo ago`;
    return `${Math.round(days / 365)}y ago`;
  };

  const safeLink = (href, label) => {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.textContent = label;
    return anchor;
  };

  const renderMissionButton = (mission, compact = false) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mission-option";
    button.dataset.mission = mission.id;
    button.setAttribute("aria-pressed", String(mission.id === state.mission));

    const index = document.createElement("span");
    index.textContent = String(mission.order).padStart(2, "0");

    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = mission.label;
    const sub = document.createElement("small");
    sub.textContent = compact ? mission.question : mission.objective;
    copy.append(name, sub);

    const code = document.createElement("em");
    code.textContent = mission.code;

    button.append(index, copy, code);
    button.addEventListener("click", () => {
      selectMission(mission.id, true);
      closeMissionDrawer();
    });
    return button;
  };

  const renderMissionSelectors = () => {
    const hero = qs("[data-mission-options]");
    const drawer = qs("[data-drawer-missions]");
    if (hero) {
      hero.textContent = "";
      missionIds.forEach((id) => hero.append(renderMissionButton(data.missions[id])));
    }
    if (drawer) {
      drawer.textContent = "";
      missionIds.forEach((id) => drawer.append(renderMissionButton(data.missions[id], true)));
    }
  };

  const updateMissionButtons = () => {
    qsa("[data-mission]").forEach((button) => {
      const active = button.dataset.mission === state.mission;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const selectMission = (missionId, announce = false) => {
    const mission = data.missions[missionId];
    if (!mission) return;
    state.mission = missionId;
    localStorage.setItem("evidenceos-mission", missionId);
    root.dataset.mission = missionId;
    root.style.setProperty("--mission", mission.accent);
    root.style.setProperty("--mission-secondary", mission.secondary);

    qsa("[data-current-mission]").forEach((el) => { el.textContent = mission.short; });
    qsa("[data-mission-code]").forEach((el) => { el.textContent = mission.code; });
    qsa("[data-mission-objective]").forEach((el) => { el.textContent = mission.objective; });
    qsa("[data-mission-question]").forEach((el) => { el.textContent = mission.question; });
    qsa("[data-graph-mission]").forEach((el) => { el.textContent = mission.short; });
    qsa("[data-situation-objective]").forEach((el) => { el.textContent = mission.objective; });
    qsa("[data-situation-risk]").forEach((el) => { el.textContent = mission.risk; });

    updateMissionButtons();
    updateGraphMission();
    renderControlMatrix();
    renderSignalFeed();
    renderLabGrid();
    document.dispatchEvent(new CustomEvent("evidenceos:missionchange", { detail: { mission } }));

    if (announce) {
      const live = qs("[data-live-state]");
      if (live) live.textContent = `${mission.code} LOADED`;
    }
  };

  const openMissionDrawer = () => {
    const drawer = qs("[data-mission-drawer]");
    const backdrop = qs("[data-drawer-backdrop]");
    if (!drawer || !backdrop) return;
    drawer.hidden = false;
    backdrop.hidden = false;
    body.classList.add("drawer-open");
    qsa("[data-open-missions]").forEach((button) => button.setAttribute("aria-expanded", "true"));
    qs("button", drawer)?.focus();
  };

  const closeMissionDrawer = () => {
    const drawer = qs("[data-mission-drawer]");
    const backdrop = qs("[data-drawer-backdrop]");
    if (!drawer || !backdrop) return;
    drawer.hidden = true;
    backdrop.hidden = true;
    body.classList.remove("drawer-open");
    qsa("[data-open-missions]").forEach((button) => button.setAttribute("aria-expanded", "false"));
  };

  const initBoot = () => {
    const screen = qs("[data-boot-screen]");
    if (!screen) return;
    const rows = qsa("[data-boot-log] p", screen);
    const progress = qs("[data-boot-progress]", screen);
    const status = qs("[data-boot-status]", screen);
    const skip = qs("[data-skip-boot]", screen);
    const visited = sessionStorage.getItem("evidenceos-booted") === "1";
    const interval = reduceMotion.matches ? 10 : visited ? 110 : 330;
    let step = 0;
    let timer = 0;

    const complete = () => {
      window.clearInterval(timer);
      rows.forEach((row) => row.classList.add("is-done"));
      if (progress) progress.style.transform = "scaleX(1)";
      if (status) status.textContent = "READY";
      sessionStorage.setItem("evidenceos-booted", "1");
      window.setTimeout(() => screen.classList.add("is-complete"), reduceMotion.matches ? 0 : 180);
    };

    const tick = () => {
      rows.forEach((row, index) => {
        row.classList.toggle("is-active", index === step);
        row.classList.toggle("is-done", index < step);
      });
      if (progress) progress.style.transform = `scaleX(${Math.min((step + 1) / rows.length, 1)})`;
      if (status) status.textContent = step < rows.length - 1 ? `LOADING ${String(step + 1).padStart(2, "0")}` : "OPENING";
      step += 1;
      if (step >= rows.length) complete();
    };

    skip?.addEventListener("click", complete);
    timer = window.setInterval(tick, interval);
    tick();
  };

  const initHeader = () => {
    const header = qs("[data-header]");
    const progress = qs("[data-page-progress]");
    const nav = qs("[data-nav]");
    const navToggle = qs("[data-nav-toggle]");
    const themeToggle = qs("[data-theme-toggle]");
    const navLinks = qsa(".os-nav a[href^='#']");
    const sections = navLinks.map((link) => qs(link.getAttribute("href"))).filter(Boolean);

    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header?.classList.toggle("is-scrolled", window.scrollY > 18);
      if (progress) progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    themeToggle?.addEventListener("click", () => {
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = theme;
      localStorage.setItem("rb-theme", theme);
    });

    navToggle?.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      nav?.classList.toggle("is-open", !open);
      navToggle.setAttribute("aria-expanded", String(!open));
      body.classList.toggle("nav-open", !open);
    });
    navLinks.forEach((link) => link.addEventListener("click", () => {
      nav?.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
      body.classList.remove("nav-open");
    }));

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
      }, { rootMargin: "-25% 0px -62% 0px", threshold: [0.01, 0.2, 0.45] });
      sections.forEach((section) => observer.observe(section));
    }
  };

  const initReveal = () => {
    const items = qsa("[data-reveal]");
    items.forEach((item, index) => item.style.setProperty("--delay", `${Math.min(index % 4, 3) * 65}ms`));
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, current) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        current.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    items.forEach((item) => observer.observe(item));
  };

  const initHeroField = () => {
    const canvas = qs("[data-hero-field]");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let frame = 0;
    const pointer = { x: -9999, y: -9999, active: false };

    const palette = () => root.dataset.theme === "light" ? ["8,125,159", "109,69,194"] : ["98,242,255", "159,124,255"];
    const resetParticles = () => {
      const count = Math.max(24, Math.min(50, Math.round(width / 30)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 0.7 + Math.random() * 1.5,
        color: Math.random() > 0.76 ? 1 : 0,
        phase: Math.random() * Math.PI * 2
      }));
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resetParticles();
    };
    const draw = (time = 0) => {
      const colors = palette();
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 150 && distance > 0) {
            particle.x += (dx / distance) * 0.08;
            particle.y += (dy / distance) * 0.08;
          }
        }

        for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
          const other = particles[otherIndex];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance > 120) continue;
          ctx.strokeStyle = `rgba(${colors[0]}, ${(1 - distance / 120) * 0.14})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }

        const pulse = 0.7 + Math.sin(time * 0.001 + particle.phase) * 0.3;
        ctx.fillStyle = `rgba(${colors[particle.color]}, ${0.3 + pulse * 0.42})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });
    canvas.addEventListener("pointerleave", () => { pointer.active = false; });
    if (!reduceMotion.matches) frame = requestAnimationFrame(draw);
    else draw(0);
    reduceMotion.addEventListener?.("change", (event) => {
      cancelAnimationFrame(frame);
      if (!event.matches) frame = requestAnimationFrame(draw);
      else draw(0);
    });
  };

  const graphCoordinates = (position) => ({ x: 65 + position.x * 8.7, y: 45 + position.y * 5.65 });

  const renderGraph = () => {
    const edgeLayer = qs("[data-graph-edges]");
    const nodeLayer = qs("[data-graph-nodes]");
    if (!edgeLayer || !nodeLayer) return;
    edgeLayer.textContent = "";
    nodeLayer.textContent = "";

    const systemsById = new Map(data.systems.map((system) => [system.id, system]));
    data.edges.forEach(([fromId, toId, label]) => {
      const from = systemsById.get(fromId);
      const to = systemsById.get(toId);
      if (!from || !to) return;
      const a = graphCoordinates(from.position);
      const b = graphCoordinates(to.position);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const bend = Math.abs(a.x - b.x) > 230 ? 55 : 20;
      path.setAttribute("d", `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2 - bend} ${b.x},${(a.y + b.y) / 2 + bend} ${b.x},${b.y}`);
      path.setAttribute("class", "graph-edge");
      path.dataset.from = fromId;
      path.dataset.to = toId;
      path.dataset.label = label;
      edgeLayer.append(path);
    });

    data.systems.forEach((system) => {
      const point = graphCoordinates(system.position);
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "graph-node");
      group.setAttribute("transform", `translate(${point.x} ${point.y})`);
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", `${system.name}, ${system.status}`);
      group.dataset.system = system.id;
      group.dataset.status = system.status;
      group.style.setProperty("--node-color", colorByAccent[system.accent] || "#62f2ff");

      const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      core.setAttribute("class", "node-core");
      core.setAttribute("r", system.id === "tdaf" ? "43" : "36");
      const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      ring.setAttribute("class", "node-ring");
      ring.setAttribute("r", system.id === "tdaf" ? "34" : "29");
      const status = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      status.setAttribute("class", "node-status");
      status.setAttribute("cx", system.id === "tdaf" ? "26" : "23");
      status.setAttribute("cy", system.id === "tdaf" ? "-26" : "-22");
      status.setAttribute("r", "4");
      const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("y", "3");
      title.textContent = system.short.length > 18 ? system.short.slice(0, 18) : system.short;
      const type = document.createElementNS("http://www.w3.org/2000/svg", "text");
      type.setAttribute("class", "node-type");
      type.setAttribute("y", "17");
      type.textContent = system.type.toUpperCase();
      group.append(core, ring, status, title, type);
      group.addEventListener("click", () => selectSystem(system.id));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectSystem(system.id);
        }
      });
      nodeLayer.append(group);
    });
    updateGraphMission();
  };

  const updateGraphMission = () => {
    const mission = data.missions[state.mission];
    const relevant = new Set(mission.systems);
    qsa(".graph-node").forEach((node) => {
      const id = node.dataset.system;
      node.classList.toggle("is-active", relevant.has(id));
      node.classList.toggle("is-muted", !relevant.has(id));
      node.classList.toggle("is-selected", id === state.selectedSystem);
    });
    qsa(".graph-edge").forEach((edge) => {
      const active = relevant.has(edge.dataset.from) && relevant.has(edge.dataset.to);
      edge.classList.toggle("is-active", active);
      edge.classList.toggle("is-muted", !active);
    });
    if (!state.selectedSystem || !relevant.has(state.selectedSystem)) {
      state.selectedSystem = mission.primary[0];
      renderSystemInspector(state.selectedSystem);
    }
  };

  const selectSystem = (systemId) => {
    state.selectedSystem = systemId;
    qsa(".graph-node").forEach((node) => node.classList.toggle("is-selected", node.dataset.system === systemId));
    renderSystemInspector(systemId);
  };

  const renderSystemInspector = (systemId) => {
    const inspector = qs("[data-system-inspector]");
    const system = data.systems.find((item) => item.id === systemId);
    if (!inspector || !system) return;
    inspector.textContent = "";

    const status = document.createElement("div");
    status.className = "inspector-status";
    const dot = document.createElement("i");
    const statusText = document.createElement("span");
    statusText.textContent = `${system.status.toUpperCase()} // ${system.type.toUpperCase()}`;
    status.append(dot, statusText);

    const heading = document.createElement("h3");
    heading.textContent = system.name;
    const summary = document.createElement("p");
    summary.textContent = system.summary;

    const capabilities = document.createElement("ul");
    capabilities.className = "inspector-capabilities";
    system.capabilities.forEach((capability) => {
      const item = document.createElement("li");
      item.textContent = capability;
      capabilities.append(item);
    });

    const boundary = document.createElement("div");
    boundary.className = "inspector-boundary";
    const boundaryLabel = document.createElement("span");
    boundaryLabel.textContent = "EVIDENCE BOUNDARY";
    const boundaryText = document.createElement("p");
    boundaryText.textContent = system.boundary;
    boundary.append(boundaryLabel, boundaryText);

    const links = document.createElement("div");
    links.className = "inspector-links";
    if (system.liveUrl) links.append(safeLink(system.liveUrl, system.liveUrl.startsWith("#") ? "Open module →" : "Open live system ↗"));
    if (system.repoUrl) links.append(safeLink(system.repoUrl, "Inspect repository ↗"));
    if (!system.liveUrl && !system.repoUrl) {
      const privateLabel = document.createElement("p");
      privateLabel.textContent = "Public description only. Repository access is intentionally not exposed.";
      links.append(privateLabel);
    }

    inspector.append(status, heading, summary, capabilities, boundary, links);
  };

  const renderControlMatrix = () => {
    const matrix = qs("[data-control-matrix]");
    if (!matrix) return;
    matrix.textContent = "";
    data.missions[state.mission].situation.forEach(([label, value]) => {
      const cell = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label.toUpperCase();
      const strong = document.createElement("strong");
      strong.textContent = value;
      cell.append(key, strong);
      matrix.append(cell);
    });
  };

  const renderSignalFeed = () => {
    const feed = qs("[data-signal-feed]");
    if (!feed) return;
    feed.textContent = "";
    const mission = data.missions[state.mission];
    const ordered = [...data.researchFeed];
    if (state.mission === "pqc") ordered.unshift({ type: "MISSION", tone: "lime", text: "PQC migration begins with discovery and ownership, not algorithm replacement alone." });
    if (state.mission === "quantum") ordered.unshift({ type: "MISSION", tone: "violet", text: "A controlled experiment is the strongest positive result available before advantage is demonstrated." });
    if (state.mission === "secure") ordered.unshift({ type: "MISSION", tone: "red", text: "Unknown cryptography is unmanaged risk. Discovery quality sets the migration ceiling." });
    if (state.mission === "lab") ordered.unshift({ type: "MODE", tone: "amber", text: "Open-lab mode exposes every public and bounded research system in the environment." });

    ordered.slice(0, 6).forEach((signal) => {
      const item = document.createElement("li");
      const type = document.createElement("strong");
      type.textContent = signal.type;
      type.style.setProperty("--signal-color", colorByAccent[signal.tone] || mission.accent);
      type.style.color = colorByAccent[signal.tone] || mission.accent;
      const text = document.createElement("span");
      text.textContent = signal.text;
      item.append(type, text);
      feed.append(item);
    });
  };

  const initPublicEvidence = () => {
    const CACHE_KEY = "evidenceos-repos-v2";
    const CACHE_TTL = 60 * 60 * 1000;
    const liveState = qs("[data-live-state]");

    const apply = (repos) => {
      const byName = new Map(repos.map((repo) => [repo.full_name.toLowerCase(), repo]));
      qsa("[data-repo]").forEach((element) => {
        const repo = byName.get((element.dataset.repo || "").toLowerCase());
        if (!repo?.pushed_at) {
          element.textContent = "source link";
          return;
        }
        const age = relativeTime(repo.pushed_at);
        element.textContent = age || "source link";
        element.classList.toggle("is-fresh", Date.now() - Date.parse(repo.pushed_at) < 14 * 86400000);
        element.title = `Last public push: ${new Date(repo.pushed_at).toLocaleString()}`;
      });
      const cutoff = Date.now() - 180 * 86400000;
      const active = repos.filter((repo) => !repo.archived && !repo.fork && repo.pushed_at && Date.parse(repo.pushed_at) >= cutoff).length;
      const activeEl = qs("[data-active-repos]");
      if (activeEl) activeEl.textContent = String(active);
      if (liveState) liveState.textContent = "VERIFIED";
    };

    const failClosed = () => {
      qsa("[data-repo]").forEach((element) => { element.textContent = "open source"; });
      const activeEl = qs("[data-active-repos]");
      if (activeEl) activeEl.textContent = "GitHub";
      if (liveState) liveState.textContent = "SOURCE LINKS";
    };

    const load = async () => {
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        if (cached && Date.now() - cached.at < CACHE_TTL && Array.isArray(cached.repos)) {
          apply(cached.repos);
          return;
        }
      } catch {
        // Ignore cache errors and continue to the public source.
      }
      try {
        const response = await fetch("https://api.github.com/users/raybeecham/repos?per_page=100&sort=pushed", { headers: { Accept: "application/vnd.github+json" } });
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        const repos = (await response.json()).map((repo) => ({ full_name: repo.full_name, pushed_at: repo.pushed_at, archived: repo.archived, fork: repo.fork }));
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
        apply(repos);
      } catch {
        failClosed();
      }
    };
    load();
  };

  const buildReplay = () => {
    const shell = qs("[data-decision-replay]");
    if (!shell) return;
    const tabs = qs("[data-scenario-tabs]", shell);
    const start = qs("[data-replay-start]", shell);
    const pause = qs("[data-replay-pause]", shell);
    const reset = qs("[data-replay-reset]", shell);
    if (!tabs) return;
    tabs.textContent = "";
    Object.values(data.decisionScenarios).forEach((scenario) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(scenario.id === state.replayScenario));
      button.dataset.scenario = scenario.id;
      button.textContent = scenario.label;
      button.addEventListener("click", () => setReplayScenario(scenario.id));
      tabs.append(button);
    });
    start?.addEventListener("click", startReplay);
    pause?.addEventListener("click", pauseReplay);
    reset?.addEventListener("click", resetReplay);
    setReplayScenario(state.replayScenario);
  };

  const setReplayScenario = (scenarioId) => {
    if (!data.decisionScenarios[scenarioId]) return;
    resetReplay(false);
    state.replayScenario = scenarioId;
    qsa("[data-scenario]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.scenario === scenarioId)));
    const scenario = data.decisionScenarios[scenarioId];
    const context = qs("[data-replay-context]");
    const result = qs("[data-replay-result]");
    const record = qs("[data-replay-record]");
    const trace = qs("[data-replay-trace]");
    if (context) context.textContent = scenario.context;
    if (result) result.textContent = "WAITING";
    if (record) record.textContent = "Select Play to execute the decision.";
    if (trace) {
      trace.textContent = "";
      scenario.stages.forEach(([label, text], index) => {
        const step = document.createElement("article");
        step.className = "replay-step";
        step.dataset.step = String(index);
        const number = document.createElement("span");
        number.className = "replay-step-index";
        number.textContent = String(index + 1).padStart(2, "0");
        const copy = document.createElement("div");
        const heading = document.createElement("h3");
        heading.textContent = label;
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        copy.append(heading, paragraph);
        if (index === 0) {
          const evidence = document.createElement("div");
          evidence.className = "replay-evidence";
          scenario.evidence.forEach(([tag, description, tone]) => {
            const chip = document.createElement("span");
            chip.className = `replay-tag ${tone}`;
            chip.title = description;
            chip.textContent = tag;
            evidence.append(chip);
          });
          copy.append(evidence);
        }
        step.append(number, copy);
        trace.append(step);
      });
    }
  };

  const advanceReplay = () => {
    const scenario = data.decisionScenarios[state.replayScenario];
    const steps = qsa(".replay-step");
    if (!scenario || !steps.length) return;
    state.replayIndex += 1;
    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === state.replayIndex);
      step.classList.toggle("is-complete", index < state.replayIndex);
    });
    if (state.replayIndex >= steps.length) {
      window.clearInterval(state.replayTimer);
      state.replayTimer = null;
      const result = qs("[data-replay-result]");
      const record = qs("[data-replay-record]");
      if (result) result.textContent = scenario.result;
      if (record) record.textContent = JSON.stringify(scenario.record, null, 2);
      steps.forEach((step) => step.classList.add("is-complete"));
      return;
    }
    const record = qs("[data-replay-record]");
    if (record) record.textContent = `stage: ${scenario.stages[state.replayIndex][0].toLowerCase()}\nstatus: executing\nscenario: ${scenario.id}`;
  };

  const startReplay = () => {
    if (state.replayPaused && state.replayIndex >= 0) {
      state.replayPaused = false;
      state.replayTimer = window.setInterval(advanceReplay, reduceMotion.matches ? 80 : 900);
      return;
    }
    resetReplay(false);
    advanceReplay();
    state.replayTimer = window.setInterval(advanceReplay, reduceMotion.matches ? 80 : 900);
  };

  const pauseReplay = () => {
    if (state.replayTimer) window.clearInterval(state.replayTimer);
    state.replayTimer = null;
    state.replayPaused = true;
  };

  const resetReplay = (rerender = true) => {
    if (state.replayTimer) window.clearInterval(state.replayTimer);
    state.replayTimer = null;
    state.replayIndex = -1;
    state.replayPaused = false;
    if (rerender) setReplayScenario(state.replayScenario);
  };

  const buildQuantumExplorer = () => {
    const shell = qs("[data-quantum-explorer]");
    const tabs = qs("[data-architecture-tabs]", shell || document);
    if (!shell || !tabs) return;
    tabs.textContent = "";
    data.quantumArchitectures.forEach((architecture) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(architecture.id === state.architecture));
      button.dataset.architecture = architecture.id;
      button.textContent = architecture.label;
      button.addEventListener("click", () => selectArchitecture(architecture.id));
      tabs.append(button);
    });
    selectArchitecture(state.architecture);
  };

  const selectArchitecture = (architectureId) => {
    const architecture = data.quantumArchitectures.find((item) => item.id === architectureId);
    const shell = qs("[data-quantum-explorer]");
    if (!architecture || !shell) return;
    state.architecture = architectureId;
    shell.style.setProperty("--architecture-accent", architecture.accent);
    qsa("[data-architecture]", shell).forEach((button) => button.setAttribute("aria-selected", String(button.dataset.architecture === architectureId)));
    const set = (selector, value) => { const element = qs(selector, shell); if (element) element.textContent = value; };
    set("[data-architecture-family]", architecture.family.toUpperCase());
    set("[data-architecture-name]", architecture.label);
    set("[data-architecture-id]", architecture.id.toUpperCase());
    set("[data-architecture-native]", architecture.native);
    set("[data-architecture-connectivity]", architecture.connectivity);
    set("[data-architecture-strength]", architecture.strength);
    set("[data-architecture-constraint]", architecture.constraint);
    set("[data-architecture-ec]", architecture.errorCorrection);

    const meters = qs("[data-architecture-meters]", shell);
    if (meters) {
      meters.textContent = "";
      Object.entries(architecture.meters).forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "architecture-meter";
        const key = document.createElement("span");
        key.textContent = label.toUpperCase();
        const bar = document.createElement("i");
        bar.style.setProperty("--meter", `${value}%`);
        const score = document.createElement("strong");
        score.textContent = String(value);
        row.append(key, bar, score);
        meters.append(row);
      });
    }
    const workloads = qs("[data-architecture-workloads]", shell);
    if (workloads) {
      workloads.textContent = "";
      architecture.workloads.forEach((item) => { const li = document.createElement("li"); li.textContent = item; workloads.append(li); });
    }
    const questions = qs("[data-architecture-questions]", shell);
    if (questions) {
      questions.textContent = "";
      architecture.questions.forEach((item) => { const li = document.createElement("li"); li.textContent = item; questions.append(li); });
    }
  };

  const buildTimeline = () => {
    const rail = qs("[data-timeline-rail]");
    if (!rail) return;
    rail.textContent = "";
    data.timeline.forEach((milestone) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-item";
      button.dataset.timeline = milestone.id;
      button.style.setProperty("--timeline-color", colorByAccent[milestone.category === "security" ? "red" : milestone.category === "quantum" ? "violet" : milestone.category === "decision" ? "lime" : milestone.category === "future" ? "amber" : "cyan"]);
      const date = document.createElement("span");
      date.textContent = milestone.date;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = milestone.title;
      const summary = document.createElement("small");
      summary.textContent = milestone.summary;
      copy.append(title, summary);
      button.append(date, copy);
      button.addEventListener("click", () => selectTimeline(milestone.id));
      rail.append(button);
    });
    selectTimeline(state.timeline);
  };

  const selectTimeline = (timelineId) => {
    const milestone = data.timeline.find((item) => item.id === timelineId) || data.timeline[0];
    const inspector = qs("[data-timeline-inspector]");
    if (!milestone || !inspector) return;
    state.timeline = milestone.id;
    qsa("[data-timeline]").forEach((button) => button.classList.toggle("is-active", button.dataset.timeline === milestone.id));
    inspector.textContent = "";
    const date = document.createElement("span");
    date.className = "timeline-date";
    date.textContent = milestone.date;
    const heading = document.createElement("h3");
    heading.textContent = milestone.title;
    const summary = document.createElement("p");
    summary.textContent = milestone.summary;
    const evidence = document.createElement("ul");
    evidence.className = "timeline-evidence";
    milestone.evidence.forEach((item) => { const li = document.createElement("li"); li.textContent = item; evidence.append(li); });
    const link = safeLink(milestone.link, milestone.link.startsWith("#") ? "Open related module →" : "Open public evidence ↗");
    inspector.append(date, heading, summary, evidence, link);
  };

  const renderLabGrid = () => {
    const grid = qs("[data-lab-grid]");
    if (!grid) return;
    const mission = data.missions[state.mission];
    const relevant = new Set(mission.systems);
    grid.textContent = "";
    data.systems.forEach((system) => {
      const card = document.createElement("article");
      card.className = "lab-card";
      card.classList.toggle("is-mission", relevant.has(system.id));
      card.style.setProperty("--card-color", colorByAccent[system.accent] || mission.accent);
      const header = document.createElement("header");
      const type = document.createElement("span");
      type.textContent = system.type.toUpperCase();
      const status = document.createElement("strong");
      status.textContent = system.status.toUpperCase();
      header.append(type, status);
      const heading = document.createElement("h3");
      heading.textContent = system.name;
      const summary = document.createElement("p");
      summary.textContent = system.summary;
      const footer = document.createElement("footer");
      if (system.liveUrl) footer.append(safeLink(system.liveUrl, system.liveUrl.startsWith("#") ? "Open module →" : "Live system ↗"));
      if (system.repoUrl) footer.append(safeLink(system.repoUrl, "Repository ↗"));
      if (!system.liveUrl && !system.repoUrl) {
        const boundary = document.createElement("span");
        boundary.className = "lab-private";
        boundary.textContent = "Public description only";
        footer.append(boundary);
      }
      card.append(header, heading, summary, footer);
      grid.append(card);
    });
  };

  const initGlobalActions = () => {
    qsa("[data-open-missions]").forEach((button) => button.addEventListener("click", openMissionDrawer));
    qs("[data-close-missions]")?.addEventListener("click", closeMissionDrawer);
    qs("[data-drawer-backdrop]")?.addEventListener("click", closeMissionDrawer);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body.classList.contains("drawer-open")) closeMissionDrawer();
    });
  };

  renderMissionSelectors();
  initBoot();
  initHeader();
  initReveal();
  initHeroField();
  initGlobalActions();
  renderGraph();
  renderControlMatrix();
  renderSignalFeed();
  initPublicEvidence();
  buildReplay();
  buildQuantumExplorer();
  buildTimeline();
  renderLabGrid();
  selectMission(state.mission, false);

  window.EvidenceOS = Object.freeze({
    selectMission,
    navigate: (target) => qs(target)?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" }),
    openSystem: selectSystem,
    getState: () => ({ ...state }),
    getData: () => data
  });
})();
