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

  const tiltItems = document.querySelectorAll(".constellation-shell[data-tilt], .program-card[data-tilt]");
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
      const count = Math.max(20, Math.min(44, Math.round(width / 30)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
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
})();
