(() => {
  "use strict";

  const data = window.EvidenceOSData;
  const refinement = window.EvidenceOSRefinementData;
  const canvas = document.querySelector("[data-research-globe]");
  const inspector = document.querySelector("[data-earth-inspector]");
  const filterHost = document.querySelector("[data-globe-filters]");
  if (!data || !(canvas instanceof HTMLCanvasElement) || !inspector || !filterHost) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const categoryMeta = refinement?.categoryMeta || {
    all: { label: "All", short: "Full network", color: "#62f2ff", description: "All public nodes in the selected mission lens." },
    standards: { label: "Standards", short: "Standards", color: "#62f2ff", description: "Standards and protocol communities." },
    government: { label: "Public sector", short: "Public sector", color: "#5f9dff", description: "Multi-agency public programs." },
    security: { label: "Security", short: "Security", color: "#ff6b83", description: "Security and migration communities." },
    research: { label: "Research", short: "Research", color: "#9f7cff", description: "Research institutions." },
    vendor: { label: "Industry", short: "Industry", color: "#b8f45d", description: "Technology providers." }
  };
  const categories = ["all", "standards", "government", "security", "research", "vendor"];
  const categoryColors = Object.fromEntries(categories.filter((category) => category !== "all").map((category) => [category, categoryMeta[category]?.color || "#62f2ff"]));

  const state = {
    rotationY: -0.35,
    rotationX: -0.14,
    targetRotationY: null,
    targetRotationX: null,
    zoom: 1,
    dragging: false,
    pointerX: 0,
    pointerY: 0,
    pointerStartX: 0,
    pointerStartY: 0,
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
  const currentMission = () => data.missions[window.EvidenceOS?.getState().mission || "research"] || data.missions.research;
  const colorFor = (category) => categoryColors[category] || getComputedStyle(document.documentElement).getPropertyValue("--mission").trim() || "#62f2ff";

  const globePanel = canvas.closest(".globe-panel");
  const overview = document.createElement("div");
  overview.className = "network-overview";
  overview.dataset.networkOverview = "";
  const directory = document.createElement("div");
  directory.className = "network-directory";
  directory.dataset.networkDirectory = "";

  if (globePanel) {
    const toolbar = qs(".globe-toolbar", globePanel);
    if (toolbar) toolbar.after(overview);
    const instructions = qs(".globe-instructions", globePanel);
    if (instructions) instructions.before(directory);
    else canvas.after(directory);
  }

  canvas.tabIndex = 0;

  const visibleMarkers = (category = state.activeCategory) => data.earthMarkers.filter((marker) => {
    const categoryMatch = category === "all" || marker.category === category;
    const missionMatch = state.missionFilters.has(marker.category);
    return categoryMatch && missionMatch;
  });

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
    const latitude = lat * Math.PI / 180;
    const longitude = lon * Math.PI / 180;
    return {
      x: Math.cos(latitude) * Math.cos(longitude),
      y: Math.sin(latitude),
      z: -Math.cos(latitude) * Math.sin(longitude)
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
        const point = project(rotated, radius, centerX, centerY);
        if (!started) {
          ctx.moveTo(point.x, point.y);
          started = true;
        } else {
          ctx.lineTo(point.x, point.y);
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
        const point = project(rotated, radius, centerX, centerY);
        if (!started) {
          ctx.moveTo(point.x, point.y);
          started = true;
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.strokeStyle = palette.grid;
      ctx.stroke();
    }
    ctx.restore();
  };

  const projectedMarkers = (radius, centerX, centerY) => visibleMarkers().map((marker) => {
    const rotated = rotatePoint(latLonToXYZ(marker.lat, marker.lon));
    const point = project(rotated, radius, centerX, centerY);
    return { marker, rotated, ...point };
  }).filter((point) => point.rotated.z >= -0.08).sort((a, b) => a.depth - b.depth);

  const drawNetworkLinks = (points) => {
    if (points.length < 2) return;
    const selected = points.find((point) => point.marker.id === state.selected);
    const pairs = [];

    if (selected) {
      points.filter((point) => point !== selected).slice(-7).forEach((point) => pairs.push([selected, point, true]));
    } else {
      const byCategory = new Map();
      points.forEach((point) => {
        const group = byCategory.get(point.marker.category) || [];
        group.push(point);
        byCategory.set(point.marker.category, group);
      });
      byCategory.forEach((group) => {
        const sorted = [...group].sort((a, b) => a.x - b.x);
        for (let index = 0; index < sorted.length - 1; index += 1) pairs.push([sorted[index], sorted[index + 1], false]);
      });
    }

    pairs.forEach(([a, b, emphasized]) => {
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (!emphasized && distance > Math.min(state.width * 0.48, 330)) return;
      const color = colorFor(emphasized ? a.marker.category : b.marker.category);
      const middleX = (a.x + b.x) / 2;
      const middleY = (a.y + b.y) / 2 - Math.min(36, distance * 0.12);
      ctx.strokeStyle = color;
      ctx.globalAlpha = emphasized ? 0.32 : 0.15;
      ctx.lineWidth = emphasized ? 1.2 : 0.75;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(middleX, middleY, b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  };

  const drawMarker = (point, time, palette) => {
    const marker = point.marker;
    const perspective = 0.72 + Math.max(0, point.rotated.z) * 0.55;
    const size = 4.8 * perspective;
    const color = colorFor(marker.category);
    const selected = marker.id === state.selected;
    const pulse = 1 + Math.sin(time * 0.0024 + marker.lon) * 0.12;

    ctx.strokeStyle = color;
    ctx.globalAlpha = selected ? 0.45 : 0.18 + Math.max(0, point.rotated.z) * 0.22;
    ctx.beginPath();
    ctx.arc(point.x, point.y, (selected ? 16 : 11) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = selected ? 22 : 11;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size * pulse + (selected ? 1.8 : 0), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (selected || point.rotated.z > 0.58) {
      ctx.fillStyle = palette.text;
      ctx.font = `${selected ? 700 : 600} ${selected ? 12 : 10}px ui-monospace, monospace`;
      ctx.fillText(marker.name, point.x + 10, point.y - 9);
    }
  };

  const updateTargetRotation = () => {
    if (state.dragging || state.targetRotationY === null || state.targetRotationX === null) return;
    const deltaY = Math.atan2(Math.sin(state.targetRotationY - state.rotationY), Math.cos(state.targetRotationY - state.rotationY));
    const deltaX = state.targetRotationX - state.rotationX;
    const factor = reduceMotion.matches ? 1 : 0.085;
    state.rotationY += deltaY * factor;
    state.rotationX += deltaX * factor;
    if (Math.abs(deltaY) < 0.001 && Math.abs(deltaX) < 0.001) {
      state.rotationY = state.targetRotationY;
      state.rotationX = state.targetRotationX;
      state.targetRotationY = null;
      state.targetRotationX = null;
    }
  };

  const draw = (time = 0) => {
    const dark = document.documentElement.dataset.theme !== "light";
    const missionStyle = getComputedStyle(document.documentElement).getPropertyValue("--mission").trim() || "#62f2ff";
    const palette = dark ? {
      fill: "rgba(7, 15, 31, 0.88)",
      rim: "rgba(98, 242, 255, 0.34)",
      grid: "rgba(112, 169, 202, 0.14)",
      text: "#eaf8ff",
      muted: "#91a0bd"
    } : {
      fill: "rgba(236, 244, 250, 0.94)",
      rim: "rgba(8, 125, 159, 0.30)",
      grid: "rgba(31, 93, 130, 0.13)",
      text: "#10243b",
      muted: "#60728b"
    };

    updateTargetRotation();
    ctx.clearRect(0, 0, state.width, state.height);
    const radius = Math.min(state.width * 0.35, state.height * 0.41) * state.zoom;
    const centerX = state.width * 0.5;
    const centerY = state.height * 0.49;

    const gradient = ctx.createRadialGradient(centerX - radius * 0.28, centerY - radius * 0.32, radius * 0.08, centerX, centerY, radius);
    gradient.addColorStop(0, dark ? "rgba(38, 81, 108, 0.72)" : "rgba(193, 226, 240, 0.96)");
    gradient.addColorStop(0.58, palette.fill);
    gradient.addColorStop(1, dark ? "rgba(2, 5, 13, 0.97)" : "rgba(222, 235, 244, 0.99)");
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
    const points = projectedMarkers(radius, centerX, centerY);
    drawNetworkLinks(points);
    points.forEach((point) => drawMarker(point, time, palette));

    state.points = points.map((point) => ({ marker: point.marker, x: point.x, y: point.y, radius: 17 + (point.marker.id === state.selected ? 6 : 0), depth: point.depth }));

    const activeMeta = categoryMeta[state.activeCategory] || categoryMeta.all;
    ctx.fillStyle = palette.muted;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`${activeMeta.label.toUpperCase()} // ${visibleMarkers().length} PUBLIC NODES // ILLUSTRATIVE NETWORK`, 18, state.height - 18);

    if (!state.dragging && state.targetRotationY === null && !reduceMotion.matches) {
      const delta = state.lastTime ? Math.min(time - state.lastTime, 32) : 16;
      state.rotationY += delta * 0.000028;
    }
    state.lastTime = time;
    state.frame = requestAnimationFrame(draw);
  };

  const missionNetworkNote = () => refinement?.missionNetworkNotes?.[currentMission().id] || "The selected mission changes the category lens without changing the underlying public nodes.";

  const renderOverview = () => {
    const markers = visibleMarkers();
    const meta = categoryMeta[state.activeCategory] || categoryMeta.all;
    overview.textContent = "";

    const visible = document.createElement("div");
    const visibleLabel = document.createElement("span");
    visibleLabel.textContent = "Visible nodes";
    const visibleValue = document.createElement("strong");
    visibleValue.textContent = String(markers.length).padStart(2, "0");
    visible.append(visibleLabel, visibleValue);

    const lens = document.createElement("div");
    const lensLabel = document.createElement("span");
    lensLabel.textContent = "Mission lens";
    const lensValue = document.createElement("strong");
    lensValue.textContent = currentMission().short;
    lens.append(lensLabel, lensValue);

    const context = document.createElement("div");
    const contextLabel = document.createElement("span");
    contextLabel.textContent = `${meta.label} view`;
    const contextValue = document.createElement("strong");
    contextValue.textContent = meta.short;
    const contextDescription = document.createElement("p");
    contextDescription.textContent = meta.description;
    context.append(contextLabel, contextValue, contextDescription);

    overview.append(visible, lens, context);
  };

  const buildDirectory = () => {
    const markers = visibleMarkers();
    directory.textContent = "";
    const head = document.createElement("div");
    head.className = "network-directory-head";
    const label = document.createElement("span");
    label.className = "micro-label";
    label.textContent = "VISIBLE NODE DIRECTORY";
    const count = document.createElement("strong");
    count.textContent = `${markers.length} PUBLIC SOURCES`;
    head.append(label, count);

    const list = document.createElement("div");
    list.className = "network-directory-list";
    markers.forEach((marker) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "network-node-button";
      button.classList.toggle("is-selected", marker.id === state.selected);
      button.style.setProperty("--node-color", colorFor(marker.category));
      button.setAttribute("aria-pressed", String(marker.id === state.selected));
      const dot = document.createElement("i");
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = marker.name;
      const meta = document.createElement("small");
      meta.textContent = `${categoryMeta[marker.category]?.label || marker.category} // ${marker.location}`;
      copy.append(name, meta);
      button.append(dot, copy);
      button.addEventListener("click", () => focusMarker(marker));
      list.append(button);
    });

    directory.append(head, list);
  };

  const createMetaRows = (marker) => {
    const meta = document.createElement("div");
    meta.className = "earth-meta";
    [
      ["LOCATION", marker.location],
      ["CATEGORY", categoryMeta[marker.category]?.label || marker.category],
      ["MISSION LENS", currentMission().short],
      ["NETWORK ROLE", categoryMeta[marker.category]?.short || marker.category]
    ].forEach(([key, value]) => {
      const row = document.createElement("div");
      const label = document.createElement("span");
      label.textContent = key;
      const content = document.createElement("strong");
      content.textContent = value;
      row.append(label, content);
      meta.append(row);
    });
    return meta;
  };

  const renderCategoryInspector = () => {
    const markers = visibleMarkers();
    const meta = categoryMeta[state.activeCategory] || categoryMeta.all;
    inspector.textContent = "";

    const signal = document.createElement("span");
    signal.className = "earth-signal";
    signal.style.color = meta.color;
    signal.style.borderColor = meta.color;

    const summary = document.createElement("div");
    summary.className = "earth-category-summary";
    const label = document.createElement("p");
    label.className = "micro-label";
    label.textContent = `NETWORK LENS // ${meta.label.toUpperCase()}`;
    const heading = document.createElement("h3");
    heading.textContent = meta.short;
    const description = document.createElement("p");
    description.textContent = meta.description;

    const stats = document.createElement("div");
    stats.className = "earth-category-stats";
    [["VISIBLE NODES", markers.length], ["MISSION", currentMission().code]].forEach(([key, value]) => {
      const cell = document.createElement("div");
      const statLabel = document.createElement("span");
      statLabel.textContent = key;
      const statValue = document.createElement("strong");
      statValue.textContent = String(value);
      cell.append(statLabel, statValue);
      stats.append(cell);
    });
    summary.append(label, heading, description, stats);

    const boundary = document.createElement("p");
    boundary.className = "earth-boundary-note";
    boundary.textContent = `${missionNetworkNote()} This network is curated from public information, is non-exhaustive, and does not represent client, facility, personnel, or operational tracking.`;

    inspector.append(signal, summary, boundary);
  };

  const renderMarkerInspector = (marker) => {
    inspector.textContent = "";
    const color = colorFor(marker.category);
    const signal = document.createElement("span");
    signal.className = "earth-signal";
    signal.style.color = color;
    signal.style.borderColor = color;
    const label = document.createElement("p");
    label.className = "micro-label";
    label.textContent = `PUBLIC NODE // ${(categoryMeta[marker.category]?.label || marker.category).toUpperCase()}`;
    const heading = document.createElement("h3");
    heading.className = "earth-node-title";
    heading.textContent = marker.name;
    const summary = document.createElement("p");
    summary.className = "earth-node-summary";
    summary.textContent = marker.relevance;
    const meta = createMetaRows(marker);

    const related = document.createElement("div");
    related.className = "earth-related";
    const relatedLabel = document.createElement("span");
    relatedLabel.textContent = "RELATED PUBLIC NODES";
    related.append(relatedLabel);
    visibleMarkers()
      .filter((candidate) => candidate.id !== marker.id && candidate.category === marker.category)
      .slice(0, 4)
      .forEach((candidate) => {
        const button = document.createElement("button");
        button.type = "button";
        button.style.setProperty("--node-color", colorFor(candidate.category));
        button.textContent = candidate.name;
        button.addEventListener("click", () => focusMarker(candidate));
        related.append(button);
      });

    const link = document.createElement("a");
    link.href = marker.link;
    link.textContent = "Open public source ↗";

    const boundary = document.createElement("p");
    boundary.className = "earth-boundary-note";
    boundary.textContent = "Public relevance only. Presence in the network does not imply endorsement, partnership, client status, facility knowledge, or comparative ranking.";

    inspector.append(signal, label, heading, summary, meta);
    if (related.children.length > 1) inspector.append(related);
    inspector.append(link, boundary);
  };

  const updateSelectionState = () => {
    directory.querySelectorAll(".network-node-button").forEach((button) => {
      const markerName = button.querySelector("strong")?.textContent;
      const marker = data.earthMarkers.find((item) => item.name === markerName);
      const selected = marker?.id === state.selected;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  const selectMarker = (marker) => {
    state.selected = marker.id;
    renderMarkerInspector(marker);
    updateSelectionState();
  };

  const focusMarker = (marker) => {
    const longitude = marker.lon * Math.PI / 180;
    const latitude = marker.lat * Math.PI / 180;
    state.targetRotationY = longitude + Math.PI / 2;
    state.targetRotationX = Math.max(-1.05, Math.min(1.05, latitude));
    selectMarker(marker);
    canvas.focus({ preventScroll: true });
  };

  const categoryCounts = () => Object.fromEntries(categories.map((category) => [category, visibleMarkers(category).length]));

  const buildFilters = () => {
    const counts = categoryCounts();
    filterHost.textContent = "";
    categories.forEach((category) => {
      const meta = categoryMeta[category] || categoryMeta.all;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.category = category;
      button.style.setProperty("--category-color", meta.color);
      button.classList.toggle("is-active", category === state.activeCategory);
      button.disabled = category !== "all" && counts[category] === 0;
      button.title = meta.description;
      const dot = document.createElement("i");
      const label = document.createElement("span");
      label.textContent = meta.label.toUpperCase();
      const count = document.createElement("strong");
      count.textContent = String(counts[category]);
      button.append(dot, label, count);
      button.addEventListener("click", () => {
        state.activeCategory = category;
        state.selected = null;
        buildFilters();
        renderOverview();
        buildDirectory();
        const markers = visibleMarkers();
        if (category !== "all" && markers.length) focusMarker(markers[0]);
        else renderCategoryInspector();
      });
      filterHost.append(button);
    });
  };

  const resetNetworkLens = () => {
    state.activeCategory = "all";
    state.selected = null;
    state.targetRotationY = null;
    state.targetRotationX = null;
    buildFilters();
    renderOverview();
    buildDirectory();
    renderCategoryInspector();
  };

  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.targetRotationY = null;
    state.targetRotationX = null;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.pointerStartX = event.clientX;
    state.pointerStartY = event.clientY;
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
    if (Math.hypot(event.clientX - state.pointerStartX, event.clientY - state.pointerStartY) > 6) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = state.points
      .filter((point) => Math.hypot(point.x - x, point.y - y) <= point.radius)
      .sort((a, b) => b.depth - a.depth)[0];
    if (hit) focusMarker(hit.marker);
  });

  canvas.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 0.16 : 0.08;
    if (event.key === "ArrowLeft") state.rotationY -= step;
    else if (event.key === "ArrowRight") state.rotationY += step;
    else if (event.key === "ArrowUp") state.rotationX = Math.max(-1.05, state.rotationX - step);
    else if (event.key === "ArrowDown") state.rotationX = Math.min(1.05, state.rotationX + step);
    else if (event.key === "+" || event.key === "=") state.zoom = Math.min(1.28, state.zoom + 0.06);
    else if (event.key === "-" || event.key === "_") state.zoom = Math.max(0.72, state.zoom - 0.06);
    else return;
    event.preventDefault();
    state.targetRotationY = null;
    state.targetRotationX = null;
  });

  document.addEventListener("evidenceos:missionchange", (event) => {
    const mission = event.detail?.mission;
    if (!mission) return;
    state.missionFilters = new Set(mission.mapFilter);
    resetNetworkLens();
  });

  window.addEventListener("resize", resize);
  reduceMotion.addEventListener?.("change", () => {
    cancelAnimationFrame(state.frame);
    state.frame = requestAnimationFrame(draw);
  });

  buildFilters();
  renderOverview();
  buildDirectory();
  renderCategoryInspector();
  resize();
  state.frame = requestAnimationFrame(draw);
})();
