(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const progress = document.querySelector("[data-scroll-progress]");
  const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem("rb-theme", theme);
    themeToggle?.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  };

  themeToggle?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const closeNavigation = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("nav-open");
  };

  navToggle?.addEventListener("click", () => {
    if (!nav || !navToggle) return;
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("is-open", !isOpen);
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    body.classList.toggle("nav-open", !isOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeNavigation));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeNavigation();
  });

  const updateScrollState = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle("is-scrolled", y > 18);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  const revealItems = document.querySelectorAll("[data-reveal]");
  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
  });

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.11, rootMargin: "0px 0px -60px 0px" }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if ("IntersectionObserver" in window && observedSections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
      },
      { rootMargin: "-28% 0px -60% 0px", threshold: [0.01, 0.2, 0.45] }
    );
    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const tiltItems = document.querySelectorAll("[data-tilt]");
  if (!reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    tiltItems.forEach((item) => {
      const reset = () => {
        item.style.setProperty("--tilt-x", "0deg");
        item.style.setProperty("--tilt-y", "0deg");
        item.style.setProperty("--glow-x", "50%");
        item.style.setProperty("--glow-y", "50%");
      };

      item.addEventListener("pointermove", (event) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        item.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
        item.style.setProperty("--tilt-y", `${(x - 0.5) * 7}deg`);
        item.style.setProperty("--glow-x", `${x * 100}%`);
        item.style.setProperty("--glow-y", `${y * 100}%`);
      });
      item.addEventListener("pointerleave", reset);
      reset();
    });
  }

  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length && !reduceMotion.matches && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          const target = Number(element.dataset.counter || "0");
          const started = performance.now();
          const duration = 850;
          const update = (time) => {
            const progressValue = Math.min((time - started) / duration, 1);
            const eased = 1 - Math.pow(1 - progressValue, 3);
            element.textContent = String(Math.round(target * eased));
            if (progressValue < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          observer.unobserve(element);
        });
      },
      { threshold: 0.7 }
    );
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  const canvas = document.querySelector("[data-quantum-field]");
  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const pointer = { x: -9999, y: -9999, active: false };
    let particles = [];
    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const palette = () => {
      const dark = root.dataset.theme !== "light";
      return dark
        ? { line: "98, 242, 255", violet: "139, 92, 246", point: "210, 250, 255" }
        : { line: "8, 125, 159", violet: "109, 64, 196", point: "5, 50, 69" };
    };

    const makeParticles = () => {
      const count = Math.max(24, Math.min(62, Math.round(width / 24)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: 0.8 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.72 ? "violet" : "line"
      }));
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };

    const draw = (time = 0) => {
      if (!ctx) return;
      const colors = palette();
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 170 && distance > 0) {
            const force = (170 - distance) / 1700;
            p.x += (dx / distance) * force;
            p.y += (dy / distance) * force;
          }
        }

        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const distance = Math.hypot(p.x - q.x, p.y - q.y);
          if (distance > 128) continue;
          const alpha = (1 - distance / 128) * 0.18;
          ctx.strokeStyle = `rgba(${colors.line}, ${alpha})`;
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }

        const pulse = 0.72 + Math.sin(time * 0.0012 + p.phase) * 0.28;
        const rgb = p.color === "violet" ? colors.violet : colors.point;
        ctx.fillStyle = `rgba(${rgb}, ${0.28 + pulse * 0.42})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });
    canvas.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    if (!reduceMotion.matches) frameId = requestAnimationFrame(draw);
    else draw(0);

    reduceMotion.addEventListener?.("change", (event) => {
      cancelAnimationFrame(frameId);
      if (!event.matches) frameId = requestAnimationFrame(draw);
      else draw(0);
    });
  }

  // Live repo freshness: one public GitHub API call, verified in the visitor's
  // browser. Everything stays hidden unless real data arrives — no fabricated
  // freshness, ever.
  const freshCards = [...document.querySelectorAll("[data-repo]")];
  if (freshCards.length && typeof fetch === "function") {
    const CACHE_KEY = "rb-repo-pulse-v1";
    const CACHE_TTL = 60 * 60 * 1000;

    const describeAge = (iso) => {
      const then = new Date(iso).getTime();
      if (!Number.isFinite(then)) return null;
      const days = Math.floor((Date.now() - then) / 86400000);
      if (days <= 0) return "today";
      if (days === 1) return "yesterday";
      if (days < 14) return `${days} days ago`;
      if (days < 60) return `${Math.round(days / 7)} weeks ago`;
      if (days < 365) return `${Math.round(days / 30)} months ago`;
      return `${Math.round(days / 365)} yr ago`;
    };

    const applyFreshness = (repos) => {
      const pushedByName = new Map();
      repos.forEach((repo) => {
        if (repo?.full_name && repo?.pushed_at) {
          pushedByName.set(repo.full_name.toLowerCase(), repo.pushed_at);
        }
      });

      let newest = null;
      freshCards.forEach((card) => {
        const pushed = pushedByName.get((card.dataset.repo || "").toLowerCase());
        if (!pushed) return;
        if (!newest || pushed > newest) newest = pushed;
        const age = describeAge(pushed);
        const chip = card.querySelector("[data-fresh]");
        if (age && chip) {
          chip.textContent = `UPDATED ${age.toUpperCase()}`;
          chip.title = `Last public commit: ${new Date(pushed).toLocaleDateString()}`;
          chip.hidden = false;
        }
      });

      const liveMetric = document.querySelector("[data-live-pulse]");
      const liveValue = document.querySelector("[data-live-value]");
      const liveNote = document.querySelector("[data-live-note]");
      const newestAge = newest && describeAge(newest);
      if (liveMetric && liveValue && newestAge) {
        liveValue.textContent = newestAge;
        liveMetric.hidden = false;
        if (liveNote) liveNote.hidden = false;
      }
    };

    const loadRepoPulse = async () => {
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        if (cached && Date.now() - cached.at < CACHE_TTL && Array.isArray(cached.repos)) {
          applyFreshness(cached.repos);
          return;
        }
      } catch {
        /* cache unreadable — fall through to fetch */
      }

      try {
        const response = await fetch(
          "https://api.github.com/users/raybeecham/repos?per_page=100&sort=pushed",
          { headers: { Accept: "application/vnd.github+json" } }
        );
        if (!response.ok) return;
        const repos = (await response.json()).map((repo) => ({
          full_name: repo.full_name,
          pushed_at: repo.pushed_at
        }));
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
        } catch {
          /* storage full or blocked — freshness still applies this visit */
        }
        applyFreshness(repos);
      } catch {
        /* offline or rate-limited — chips simply stay hidden */
      }
    };

    loadRepoPulse();
  }

  // TDAF interactive walkthrough: deterministic sample scenarios traced through
  // Observe → Structure → Evaluate → Record → Decide.
  const tdafRoot = document.querySelector("[data-tdaf-demo]");
  if (tdafRoot) {
    const trace = tdafRoot.querySelector("[data-tdaf-trace]");
    const record = tdafRoot.querySelector("[data-tdaf-record]");
    const recordBody = tdafRoot.querySelector("[data-tdaf-record-body]");
    const replayButton = tdafRoot.querySelector("[data-tdaf-replay]");
    const scenarioButtons = [...tdafRoot.querySelectorAll("[data-scenario]")];

    const STAGE_META = [
      { index: "01", name: "Observe", state: "INPUT" },
      { index: "02", name: "Structure", state: "MODEL" },
      { index: "03", name: "Evaluate", state: "ANALYZE" },
      { index: "04", name: "Record", state: "TRACE" },
      { index: "05", name: "Decide", state: "HUMAN" }
    ];

    const SCENARIOS = {
      grid: {
        stages: [
          [
            { tag: "ADMITTED", tone: "good", text: "Peer-reviewed QUBO formulations for unit commitment and restoration sequencing" },
            { tag: "ADMITTED", tone: "good", text: "Internal classical MILP solver benchmark on real feeder data" },
            { tag: "QUARANTINED", tone: "warn", text: "Vendor case study with no shared baseline, data, or error bars" }
          ],
          [
            { tag: "MISSION", tone: "info", text: "Reduce restoration time after severe storm events" },
            { tag: "CONSTRAINT", tone: "info", text: "Schedules must be operator-explainable within a 15-minute planning window" },
            { tag: "UNKNOWN", tone: "warn", text: "Hardware embedding overhead at production problem sizes" }
          ],
          [
            { tag: "PASS", tone: "good", text: "R-01 · Problem maps cleanly to QUBO / Hamiltonian form" },
            { tag: "PASS", tone: "good", text: "R-02 · Credible classical baseline exists and is measured" },
            { tag: "INSUFFICIENT", tone: "warn", text: "R-03 · No advantage evidence at required scale" },
            { tag: "PASS", tone: "good", text: "R-04 · A pilot can fail safely, offline, without mission impact" }
          ],
          [
            { tag: "RESULT", tone: "warn", text: "CONDITIONAL — a controlled pilot is justified; scaling is not" },
            { tag: "PRESERVED", tone: "info", text: "Rule outcomes, quarantined sources, and the open unknown all stay in the record" }
          ],
          [
            { tag: "HUMAN", tone: "good", text: "The record recommends. The grid-operations owner decides — and stays accountable." }
          ]
        ],
        record: {
          scenario: "grid-resilience-scheduling",
          result: "CONDITIONAL — controlled pilot justified",
          basis: ["R-01 PASS", "R-02 PASS", "R-03 INSUFFICIENT", "R-04 PASS"],
          evidence: { admitted: 2, quarantined: 1 },
          required_before_scale: "Advantage vs. MILP baseline on shared partitions",
          authority: "Retained by the mission owner"
        }
      },
      pqc: {
        stages: [
          [
            { tag: "ADMITTED", tone: "good", text: "NIST FIPS 203 — ML-KEM is a finalized federal standard" },
            { tag: "ADMITTED", tone: "good", text: "Browser and CDN negotiation telemetry for hybrid X25519MLKEM768" },
            { tag: "QUARANTINED", tone: "warn", text: "Vendor \"quantum-safe\" whitepaper with no observable evidence" }
          ],
          [
            { tag: "MISSION", tone: "info", text: "Protect long-lived public traffic from harvest-now-decrypt-later capture" },
            { tag: "CONSTRAINT", tone: "info", text: "Zero client breakage; rollback path required at every phase" },
            { tag: "UNKNOWN", tone: "warn", text: "Legacy middlebox behavior on larger hybrid handshakes" }
          ],
          [
            { tag: "PASS", tone: "good", text: "R-01 · Primitive is standardized, not experimental" },
            { tag: "PASS", tone: "good", text: "R-02 · Interoperability is observable in real negotiation data" },
            { tag: "PASS", tone: "good", text: "R-03 · Phased rollout contains failure and preserves rollback" },
            { tag: "PASS", tone: "good", text: "R-04 · HNDL exposure of long-lived data justifies acting now" }
          ],
          [
            { tag: "RESULT", tone: "good", text: "PROCEED — phased hybrid rollout with negotiation telemetry at each step" },
            { tag: "PRESERVED", tone: "info", text: "The middlebox unknown becomes a monitored risk, not a forgotten one" }
          ],
          [
            { tag: "HUMAN", tone: "good", text: "The record recommends. The security owner schedules the rollout — and stays accountable." }
          ]
        ],
        record: {
          scenario: "hybrid-mlkem-tls-rollout",
          result: "PROCEED — phased rollout with telemetry",
          basis: ["R-01 PASS", "R-02 PASS", "R-03 PASS", "R-04 PASS"],
          evidence: { admitted: 2, quarantined: 1 },
          monitored_risk: "Legacy middlebox behavior on hybrid handshakes",
          authority: "Retained by the security owner"
        }
      },
      fraud: {
        stages: [
          [
            { tag: "ADMITTED", tone: "good", text: "Quantum-kernel results on small, balanced research datasets" },
            { tag: "ADMITTED", tone: "good", text: "Internal gradient-boosting baseline: strong PR-AUC on the live distribution" },
            { tag: "NOT FOUND", tone: "bad", text: "Advantage evidence on imbalanced, production-scale data" }
          ],
          [
            { tag: "MISSION", tone: "info", text: "Cut fraud loss without raising customer false positives" },
            { tag: "CONSTRAINT", tone: "info", text: "Millisecond scoring latency at production transaction volume" },
            { tag: "UNKNOWN", tone: "warn", text: "Quantum feature-map behavior under extreme class imbalance" }
          ],
          [
            { tag: "PASS", tone: "good", text: "R-01 · Problem is a plausible kernel-method fit in principle" },
            { tag: "PASS", tone: "good", text: "R-02 · Classical baseline is credible and currently winning" },
            { tag: "FAIL", tone: "bad", text: "R-03 · No advantage evidence at production scale or imbalance" },
            { tag: "FAIL", tone: "bad", text: "R-04 · Hardware cannot meet the latency constraint today" }
          ],
          [
            { tag: "RESULT", tone: "bad", text: "DEFER — keep the classical champion; revisit on explicit evidence triggers" },
            { tag: "PRESERVED", tone: "info", text: "Re-evaluation triggers are recorded, so \"no\" is a checkpoint, not a verdict" }
          ],
          [
            { tag: "HUMAN", tone: "good", text: "The record recommends. The fraud-platform owner decides — and stays accountable." }
          ]
        ],
        record: {
          scenario: "quantum-ml-fraud-detection",
          result: "DEFER — classical champion retained",
          basis: ["R-01 PASS", "R-02 PASS", "R-03 FAIL", "R-04 FAIL"],
          evidence: { admitted: 2, missing: 1 },
          reevaluate_when: "Advantage shown at production imbalance, or latency-capable hardware ships",
          authority: "Retained by the fraud-platform owner"
        }
      }
    };

    let activeScenario = "grid";
    const instantRender = () => reduceMotion.matches;

    const renderScenario = (key) => {
      const scenario = SCENARIOS[key];
      if (!scenario || !trace || !record || !recordBody) return;

      trace.innerHTML = "";
      record.hidden = true;

      const stepDelay = instantRender() ? 0 : 260;
      scenario.stages.forEach((items, stageIndex) => {
        const meta = STAGE_META[stageIndex];
        const step = document.createElement("article");
        step.className = "tdaf-step";
        step.style.setProperty("--tdaf-delay", `${stageIndex * stepDelay}ms`);

        const list = items
          .map(
            (item) =>
              `<li><i class="tdaf-tag tdaf-tag-${item.tone}">${item.tag}</i><span>${item.text}</span></li>`
          )
          .join("");

        step.innerHTML = `
          <span class="tdaf-step-index">${meta.index}</span>
          <div class="tdaf-step-body">
            <div class="tdaf-step-head"><h3>${meta.name}</h3><strong>${meta.state}</strong></div>
            <ul>${list}</ul>
          </div>`;
        trace.appendChild(step);
      });

      recordBody.textContent = JSON.stringify(scenario.record, null, 2);
      const revealRecord = () => {
        record.hidden = false;
      };
      if (instantRender()) revealRecord();
      else window.setTimeout(revealRecord, scenario.stages.length * stepDelay + 160);
    };

    scenarioButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeScenario = button.dataset.scenario || "grid";
        scenarioButtons.forEach((other) =>
          other.setAttribute("aria-selected", String(other === button))
        );
        renderScenario(activeScenario);
      });
    });

    replayButton?.addEventListener("click", () => renderScenario(activeScenario));

    if ("IntersectionObserver" in window) {
      const startObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            renderScenario(activeScenario);
            observer.disconnect();
          });
        },
        { threshold: 0.18 }
      );
      startObserver.observe(tdafRoot);
    } else {
      renderScenario(activeScenario);
    }
  }
})();
