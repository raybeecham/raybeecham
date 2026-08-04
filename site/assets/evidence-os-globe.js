(() => {
  "use strict";

  const data = window.EvidenceOSData;
  const canvas = document.querySelector("[data-research-globe]");
  const inspector = document.querySelector("[data-earth-inspector]");
  const filterHost = document.querySelector("[data-globe-filters]");
  if (!data || !(canvas instanceof HTMLCanvasElement) || !inspector || !filterHost) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const categories = ["all", "standards", "government", "security", "research", "vendor"];
  const categoryColors = {
    standards: "#62f2ff",
    government: "#5f9dff",
    security: "#ff6b83",
    research: "#9f7cff",
    vendor: "#b8f45d"
  };

  const state = {
    rotationY: -0.35,
    rotationX: -0.14,
    zoom: 1,
    dragging: false,
    pointerX: 0,
    pointerY: 0,
    activeCategory: "all",
    missionFilters: new Set(data.missions.research.mapFilter),
    points: [],
    selected: null,
    width: 0,
    height: 0,
    dpr: 1,
    frame: 0,
    lastTime: 0
  };

  const qs = (selector, scope = document) => scope.querySelector(selector);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    draw(performance.now());
  };

  const latLonToXYZ = (lat, lon) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return {
      x: -Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta)
    };
  };

  const rotatePoint = (point) => {
    const cosY = Math.cos(state.rotationY);
    const sinY = Math.sin(state.rotationY);
    const xY = point.x * cosY - point.z * sinY;
    const zY = point.x * sinY + point.z * cosY;
    const cosX = Math.cos(state.rotationX);
    const sinX = Math.sin(state.rotationX);
    return {
      x: xY,
      y: point.y * cosX - zY * sinX,
      z: point.y * sinX + zY * cosX
    };
  };

  const visibleMarkers = () => data.earthMarkers.filter((marker) => {
    const categoryMatch = state.activeCategory === "all" || marker.category === state.activeCategory;
    const missionMatch = state.missionFilters.has(marker.category);
    return categoryMatch && missionMatch;
  });

  const project = (point, radius, centerX, centerY) => ({
    x: centerX + point.x * radius,
    y: centerY - point.y * radius,
    depth: point.z
  });

  const drawSphereGrid = (radius, centerX, centerY, palette) => {
    ctx.save();
    ctx.lineWidth = 0.75;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 4) {
        const rotated = rotatePoint(latLonToXYZ(lat, lon));
        if (rotated.z < -0.14) {
          started = false;
          continue;
        }
        const p = project(rotated, radius, centerX, centerY);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = palette.grid;
      ctx.stroke();
    }
    for (let lon = -150; lon <= 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -88; lat <= 88; lat += 3) {
        const rotated = rotatePoint(latLonToXYZ(lat, lon));
        if (rotated.z < -0.14) {
          started = false;
          continue;
        }
        const p = project(rotated, radius, centerX, centerY);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = palette.grid;
      ctx.stroke();
    }
    ctx.restore();
  };

  const draw = (time = 0) => {
    const dark = document.documentElement.dataset.theme !== "light";
    const missionStyle = getComputedStyle(document.documentElement).getPropertyValue("--mission").trim() || "#62f2ff";
    const palette = dark ? {
      fill: "rgba(7, 15, 31, 0.85)",
      rim: "rgba(98, 242, 255, 0.32)",
      grid: "rgba(112, 169, 202, 0.14)",
      text: "#eaf8ff",
      muted: "#91a0bd"
    } : {
      fill: "rgba(236, 244, 250, 0.92)",
      rim: "rgba(8, 125, 159, 0.30)",
      grid: "rgba(31, 93, 130, 0.13)",
      text: "#10243b",
      muted: "#60728b"
    };
    ctx.clearRect(0, 0, state.width, state.height);
    const radius = Math.min(state.width * 0.36, state.height * 0.42) * state.zoom;
    const centerX = state.width * 0.5;
    const centerY = state.height * 0.5;

    const gradient = ctx.createRadialGradient(centerX - radius * 0.28, centerY - radius * 0.32, radius * 0.08, centerX, centerY, radius);
    gradient.addColorStop(0, dark ? "rgba(38, 81, 108, 0.68)" : "rgba(193, 226, 240, 0.94)");
    gradient.addColorStop(0.58, palette.fill);
    gradient.addColorStop(1, dark ? "rgba(2, 5, 13, 0.96)" : "rgba(222, 235, 244, 0.98)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = missionStyle;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    drawSphereGrid(radius, centerX, centerY, palette);

    state.points = [];
    visibleMarkers().forEach((marker) => {
      const rotated = rotatePoint(latLonToXYZ(marker.lat, marker.lon));
      if (rotated.z < -0.08) return;
      const p = project(rotated, radius, centerX, centerY);
      const perspective = 0.72 + Math.max(0, rotated.z) * 0.55;
      const size = 4.5 * perspective;
      const color = categoryColors[marker.category] || missionStyle;
      const selected = marker.id === state.selected;
      const pulse = 1 + Math.sin(time * 0.003 + marker.lon) * 0.12;

      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.24 + rotated.z * 0.4;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = selected ? 20 : 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * pulse + (selected ? 2 : 0), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (selected || rotated.z > 0.56) {
        ctx.fillStyle = palette.text;
        ctx.font = `${selected ? 700 : 600} ${selected ? 12 : 10}px ui-monospace, monospace`;
        ctx.fillText(marker.name, p.x + 9, p.y - 8);
      }
      state.points.push({ marker, x: p.x, y: p.y, radius: 14 + (selected ? 6 : 0), depth: rotated.z });
    });

    ctx.fillStyle = palette.muted;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("ILLUSTRATIVE PUBLIC RESEARCH NETWORK", 18, state.height - 18);

    if (!state.dragging && !reduceMotion.matches) {
      const delta = state.lastTime ? Math.min(time - state.lastTime, 32) : 16;
      state.rotationY += delta * 0.000035;
    }
    state.lastTime = time;
    state.frame = requestAnimationFrame(draw);
  };

  const selectMarker = (marker) => {
    state.selected = marker.id;
    inspector.textContent = "";
    const signal = document.createElement("span");
    signal.className = "earth-signal";
    signal.style.borderColor = categoryColors[marker.category] || "var(--mission)";
    const label = document.createElement("p");
    label.className = "micro-label";
    label.textContent = `EARTH NODE // ${marker.category.toUpperCase()}`;
    const heading = document.createElement("h3");
    heading.textContent = marker.name;
    const summary = document.createElement("p");
    summary.textContent = marker.relevance;
    const meta = document.createElement("div");
    meta.className = "earth-meta";
    [["LOCATION", marker.location], ["CATEGORY", marker.category], ["MISSION", data.missions[window.EvidenceOS?.getState().mission || "research"].short]].forEach(([key, value]) => {
      const row = document.createElement("div");
      const k = document.createElement("span");
      k.textContent = key;
      const v = document.createElement("strong");
      v.textContent = value;
      row.append(k, v);
      meta.append(row);
    });
    const link = document.createElement("a");
    link.href = marker.link;
    link.textContent = "Open public source ↗";
    inspector.append(signal, label, heading, summary, meta, link);
  };

  const buildFilters = () => {
    filterHost.textContent = "";
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = category.toUpperCase();
      button.dataset.category = category;
      button.classList.toggle("is-active", category === state.activeCategory);
      button.addEventListener("click", () => {
        state.activeCategory = category;
        [...filterHost.children].forEach((child) => child.classList.toggle("is-active", child.dataset.category === category));
        state.selected = null;
      });
      filterHost.append(button);
    });
  };

  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging) return;
    const dx = event.clientX - state.pointerX;
    const dy = event.clientY - state.pointerY;
    state.rotationY += dx * 0.005;
    state.rotationX = Math.max(-1.05, Math.min(1.05, state.rotationX + dy * 0.004));
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
  });
  const stopDrag = (event) => {
    state.dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    state.zoom = Math.max(0.72, Math.min(1.28, state.zoom - event.deltaY * 0.0007));
  }, { passive: false });
  canvas.addEventListener("click", (event) => {
    if (Math.abs(event.movementX) > 3 || Math.abs(event.movementY) > 3) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = state.points
      .filter((point) => Math.hypot(point.x - x, point.y - y) <= point.radius)
      .sort((a, b) => b.depth - a.depth)[0];
    if (hit) selectMarker(hit.marker);
  });

  document.addEventListener("evidenceos:missionchange", (event) => {
    const mission = event.detail?.mission;
    if (!mission) return;
    state.missionFilters = new Set(mission.mapFilter);
    state.activeCategory = "all";
    [...filterHost.children].forEach((child) => child.classList.toggle("is-active", child.dataset.category === "all"));
    state.selected = null;
  });

  window.addEventListener("resize", resize);
  reduceMotion.addEventListener?.("change", () => {
    cancelAnimationFrame(state.frame);
    state.frame = requestAnimationFrame(draw);
  });
  buildFilters();
  resize();
  state.frame = requestAnimationFrame(draw);
})();
