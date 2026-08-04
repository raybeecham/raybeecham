(() => {
  "use strict";

  const data = window.EvidenceOSData;
  const refinement = window.EvidenceOSRefinementData;
  if (!data || !refinement) return;

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const SVG_NS = "http://www.w3.org/2000/svg";

  const humanizeToken = (value) => String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  const selectedScenario = () => {
    const selected = qs("[data-scenario-tabs] [aria-selected='true']");
    return data.decisionScenarios[selected?.dataset.scenario || "pqc"] || data.decisionScenarios.pqc;
  };

  const svgFrame = (title, description, body) => `
    <title>${title}</title>
    <desc>${description}</desc>
    <defs>
      <linearGradient id="beamGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="transparent"></stop>
        <stop offset=".5" stop-color="var(--architecture-accent, var(--mission))"></stop>
        <stop offset="1" stop-color="transparent"></stop>
      </linearGradient>
      <radialGradient id="nodeGlow">
        <stop offset="0" stop-color="#fff"></stop>
        <stop offset=".32" stop-color="var(--architecture-accent, var(--mission))"></stop>
        <stop offset="1" stop-color="transparent"></stop>
      </radialGradient>
      <filter id="softGlow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
        <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
      </filter>
    </defs>
    ${body}`;

  const superconductingSvg = () => {
    const qubits = [
      [142, 120], [280, 120], [418, 120],
      [142, 220], [280, 220], [418, 220],
      [142, 320], [280, 320], [418, 320]
    ];
    const horizontal = [[142,120,280,120],[280,120,418,120],[142,220,280,220],[280,220,418,220],[142,320,280,320],[280,320,418,320]];
    const vertical = [[142,120,142,220],[142,220,142,320],[280,120,280,220],[280,220,280,320],[418,120,418,220],[418,220,418,320]];
    const couplers = [...horizontal, ...vertical].map(([x1,y1,x2,y2]) => `<path class="schematic-line muted" d="M${x1} ${y1} L${x2} ${y2}"></path>`).join("");
    const nodes = qubits.map(([x,y], index) => `
      <g transform="translate(${x} ${y})" class="${index === 4 ? "schematic-pulse" : ""}">
        <rect class="schematic-node" x="-34" y="-11" width="68" height="22" rx="11"></rect>
        <rect class="schematic-node" x="-11" y="-34" width="22" height="68" rx="11"></rect>
        <circle class="schematic-core" r="4"></circle>
      </g>`).join("");
    return svgFrame(
      "Superconducting lattice representative schematic",
      "A microfabricated cryogenic chip with nine superconducting qubits, nearest-neighbor couplers, and microwave readout traces.",
      `<rect class="schematic-surface" x="58" y="54" width="444" height="324" rx="30"></rect>
       <path class="schematic-line muted" d="M76 82 H484 M76 350 H484"></path>
       ${couplers}${nodes}
       <path class="schematic-line" d="M76 104 C92 104 92 120 108 120 M452 320 C468 320 468 342 486 342"></path>
       <path class="schematic-line muted" d="M90 92 C112 74 128 74 150 92 M410 348 C432 366 448 366 470 348"></path>
       <text class="schematic-label" x="72" y="32">CRYOGENIC CHIP PACKAGE</text>
       <text class="schematic-label muted" x="92" y="410">microwave control and readout lines</text>
       <path class="schematic-line" d="M465 85 L433 108"></path><text class="schematic-label" x="405" y="75">qubit pads</text>
       <path class="schematic-line" d="M520 205 L438 220"></path><text class="schematic-label" x="440" y="195">local coupler</text>`
    );
  };

  const resonatorSvg = () => {
    const positions = [[118,120],[118,300],[280,84],[280,336],[442,120],[442,300]];
    const nodes = positions.map(([x,y], index) => `
      <g transform="translate(${x} ${y})" class="${index === 2 ? "schematic-pulse" : ""}">
        <rect class="schematic-node" x="-28" y="-9" width="56" height="18" rx="9"></rect>
        <rect class="schematic-node" x="-9" y="-28" width="18" height="56" rx="9"></rect>
        <circle class="schematic-core" r="3.5"></circle>
      </g>`).join("");
    const links = positions.map(([x,y]) => `<path class="schematic-line muted" d="M${x} ${y} Q280 210 280 210"></path>`).join("");
    return svgFrame(
      "Resonator-bus superconducting representative schematic",
      "Six superconducting qubits connected through a shared central microwave resonator bus.",
      `<rect class="schematic-surface" x="52" y="48" width="456" height="332" rx="30"></rect>
       ${links}
       <path class="schematic-line" d="M190 210 C205 150 230 270 245 210 C260 150 285 270 300 210 C315 150 340 270 355 210 C370 150 395 270 410 210"></path>
       <ellipse class="schematic-line muted" cx="280" cy="210" rx="132" ry="72"></ellipse>
       ${nodes}
       <circle class="schematic-core schematic-pulse" cx="280" cy="210" r="7"></circle>
       <text class="schematic-label" x="183" y="35">SHARED MICROWAVE RESONATOR BUS</text>
       <path class="schematic-line" d="M280 178 L280 118"></path><text class="schematic-label" x="294" y="142">bus mode</text>
       <path class="schematic-line" d="M82 340 L109 310"></path><text class="schematic-label muted" x="62" y="360">bus-coupled qubit</text>
       <text class="schematic-label muted" x="352" y="402">hub-and-spoke interaction path</text>`
    );
  };

  const trappedIonSvg = () => {
    const ions = [190,220,250,280,310,340,370].map((x, index) => `
      <g class="${index === 3 ? "schematic-pulse" : ""}">
        <circle cx="${x}" cy="177" r="17" fill="url(#nodeGlow)" opacity=".42"></circle>
        <circle class="schematic-core" cx="${x}" cy="177" r="5"></circle>
      </g>`).join("");
    const electrodes = Array.from({ length: 9 }, (_, index) => {
      const x = 82 + index * 50;
      return `<path class="schematic-node" d="M${x} 270 H${x + 36} L${x + 29} 322 H${x + 7} Z"></path>`;
    }).join("");
    return svgFrame(
      "Trapped-ion representative schematic",
      "A chain of laser-cooled ions suspended above segmented electromagnetic trap electrodes with laser control beams.",
      `<rect class="schematic-surface" x="48" y="46" width="464" height="332" rx="34"></rect>
       <path class="schematic-line muted" d="M74 250 H486"></path>
       ${electrodes}${ions}
       <path class="schematic-beam" d="M50 94 L510 206 L510 235 L50 123 Z"></path>
       <path class="schematic-beam" d="M92 375 L420 55 L443 73 L115 393 Z" opacity=".28"></path>
       <path class="schematic-line" d="M154 177 H406"></path>
       <text class="schematic-label" x="178" y="132">LASER-COOLED ION CHAIN</text>
       <path class="schematic-line" d="M386 105 L350 160"></path><text class="schematic-label muted" x="390" y="100">addressed laser</text>
       <text class="schematic-label" x="168" y="354">SEGMENTED TRAP ELECTRODES</text>
       <text class="schematic-label muted" x="66" y="32">ULTRA-HIGH-VACUUM CHAMBER</text>`
    );
  };

  const neutralAtomSvg = () => {
    const atoms = [];
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const x = 120 + column * 64 + (row % 2 ? 16 : 0);
        const y = 92 + row * 62;
        const active = (row === 2 && column === 2) || (row === 2 && column === 3);
        atoms.push(`<g class="${active ? "schematic-pulse" : ""}">
          <circle cx="${x}" cy="${y}" r="13" fill="url(#nodeGlow)" opacity=".34"></circle>
          <circle class="schematic-core" cx="${x}" cy="${y}" r="4.5"></circle>
          <path class="schematic-line muted" d="M${x} 55 V${y - 13}"></path>
        </g>`);
      }
    }
    return svgFrame(
      "Neutral-atom array representative schematic",
      "A reconfigurable two-dimensional array of neutral atoms held in optical tweezers, with a highlighted Rydberg interaction region.",
      `<rect class="schematic-surface" x="54" y="42" width="452" height="344" rx="32"></rect>
       ${atoms.join("")}
       <circle class="schematic-line" cx="312" cy="216" r="58" stroke-dasharray="7 7"></circle>
       <path class="schematic-line" d="M312 216 L376 216"></path>
       <text class="schematic-label" x="192" y="29">OPTICAL-TWEEZER ATOM ARRAY</text>
       <text class="schematic-label" x="356" y="172">Rydberg interaction</text>
       <path class="schematic-line" d="M432 166 L365 195"></path>
       <text class="schematic-label muted" x="84" y="410">array geometry can be rearranged before execution</text>`
    );
  };

  const photonicSvg = () => {
    const paths = [112,170,228,286].map((y, index) => `
      <path class="schematic-line ${index > 1 ? "muted" : ""}" d="M72 ${y} H190 Q215 ${y} 232 ${y + (index % 2 ? -28 : 28)} T292 ${y} H482"></path>`).join("");
    return svgFrame(
      "Photonic quantum circuit representative schematic",
      "Integrated optical waveguides connecting photon sources, interferometers, phase shifters, and detectors.",
      `<rect class="schematic-surface" x="46" y="48" width="468" height="326" rx="30"></rect>
       ${paths}
       <g><circle class="schematic-node" cx="80" cy="112" r="12"></circle><circle class="schematic-node" cx="80" cy="170" r="12"></circle><circle class="schematic-node" cx="80" cy="228" r="12"></circle><circle class="schematic-node" cx="80" cy="286" r="12"></circle></g>
       <g transform="translate(230 150) rotate(45)"><rect class="schematic-node" x="-12" y="-12" width="24" height="24"></rect></g>
       <g transform="translate(230 248) rotate(45)"><rect class="schematic-node" x="-12" y="-12" width="24" height="24"></rect></g>
       <g><circle class="schematic-line" cx="340" cy="112" r="17"></circle><circle class="schematic-line" cx="340" cy="228" r="17"></circle></g>
       <g><path class="schematic-node" d="M462 96 h32 v32 h-32 z"></path><path class="schematic-node" d="M462 154 h32 v32 h-32 z"></path><path class="schematic-node" d="M462 212 h32 v32 h-32 z"></path><path class="schematic-node" d="M462 270 h32 v32 h-32 z"></path></g>
       <circle class="schematic-core schematic-travel" cx="154" cy="112" r="5"></circle>
       <circle class="schematic-core schematic-travel" cx="278" cy="170" r="5" style="animation-delay:-1.6s"></circle>
       <text class="schematic-label" x="58" y="31">INTEGRATED PHOTONIC CIRCUIT</text>
       <text class="schematic-label muted" x="58" y="345">sources</text><text class="schematic-label muted" x="198" y="345">beam splitters</text><text class="schematic-label muted" x="312" y="345">phase control</text><text class="schematic-label muted" x="450" y="345">detectors</text>`
    );
  };

  const annealingSvg = () => {
    const nodes = [];
    const links = [];
    const columns = [118, 205, 292, 379, 466];
    const rows = [105, 180, 255, 330];
    rows.forEach((y, row) => columns.forEach((x, column) => {
      if (column < columns.length - 1) links.push(`<path class="schematic-line muted" d="M${x} ${y} L${columns[column + 1]} ${y}"></path>`);
      if (row < rows.length - 1) links.push(`<path class="schematic-line muted" d="M${x} ${y} L${x} ${rows[row + 1]}"></path>`);
      const chain = (row === 1 && column >= 1 && column <= 3) || (column === 3 && row === 2);
      nodes.push(`<g class="${chain ? "schematic-pulse" : ""}"><circle class="schematic-node" cx="${x}" cy="${y}" r="14"></circle><circle class="schematic-core" cx="${x}" cy="${y}" r="3.5"></circle></g>`);
    }));
    return svgFrame(
      "Quantum annealing representative schematic",
      "A sparse programmable Ising graph with a highlighted minor-embedding chain representing one logical variable.",
      `<rect class="schematic-surface" x="52" y="44" width="456" height="344" rx="30"></rect>
       ${links.join("")}
       <path class="schematic-line" d="M205 180 H379 V255" stroke-width="6" opacity=".28"></path>
       ${nodes.join("")}
       <text class="schematic-label" x="166" y="28">PROGRAMMABLE ISING / QUBO GRAPH</text>
       <path class="schematic-line" d="M378 151 L332 178"></path><text class="schematic-label" x="365" y="141">logical chain</text>
       <text class="schematic-label muted" x="72" y="414">problem variables are embedded into the available physical coupler graph</text>`
    );
  };

  const architectureTemplate = (architectureId) => {
    const templates = {
      superconducting: superconductingSvg,
      resonator: resonatorSvg,
      "trapped-ion": trappedIonSvg,
      "neutral-atom": neutralAtomSvg,
      photonic: photonicSvg,
      annealing: annealingSvg
    };
    return (templates[architectureId] || superconductingSvg)();
  };

  const initArchitectureVisuals = () => {
    const shell = qs("[data-quantum-explorer]");
    const stage = qs(".chip-stage", shell || document);
    const tabs = qs("[data-architecture-tabs]", shell || document);
    if (!shell || !stage || !tabs || stage.querySelector("[data-architecture-visual]")) return;

    stage.classList.add("is-refined");
    const caption = qs(".chip-caption", stage);
    const visual = document.createElement("div");
    visual.className = "architecture-visual-shell";
    visual.dataset.architectureVisual = "";

    const head = document.createElement("div");
    head.className = "architecture-visual-head";
    const headLabel = document.createElement("span");
    headLabel.textContent = "REPRESENTATIVE PHYSICAL SCHEMATIC";
    const scale = document.createElement("strong");
    scale.textContent = "NOT TO SCALE // VENDOR NEUTRAL";
    head.append(headLabel, scale);

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "architecture-schematic");
    svg.setAttribute("viewBox", "0 0 560 440");
    svg.setAttribute("role", "img");

    const meta = document.createElement("div");
    meta.className = "architecture-visual-meta";
    meta.innerHTML = `
      <div><span>What you are seeing</span><p data-visual-description></p></div>
      <div><span>Physical form</span><strong data-visual-medium></strong></div>
      <div><span>Environment</span><strong data-visual-environment></strong></div>
      <div><span>Information carrier</span><strong data-visual-carrier></strong></div>
      <div><span>Typical control</span><strong data-visual-control></strong></div>`;

    visual.append(head, svg, meta);
    stage.insertBefore(visual, caption || null);

    const readout = qs(".architecture-readout", shell);
    const meters = qs("[data-architecture-meters]", shell);
    if (readout && meters && !qs(".architecture-qualitative-note", readout)) {
      const note = document.createElement("p");
      note.className = "architecture-qualitative-note";
      note.innerHTML = "<strong>QUALITATIVE PROFILE</strong><span>The bars support architecture discussion. They are not benchmark scores, provider rankings, or current backend measurements.</span>";
      meters.before(note);
    }

    const render = (architectureId) => {
      const architecture = data.quantumArchitectures.find((item) => item.id === architectureId) || data.quantumArchitectures[0];
      const details = refinement.architectureVisuals[architecture.id];
      if (!details) return;
      visual.dataset.architecture = architecture.id;
      visual.style.setProperty("--architecture-accent", architecture.accent);
      svg.setAttribute("aria-label", `${architecture.label}: ${details.description}`);
      svg.innerHTML = architectureTemplate(architecture.id);
      qs("[data-visual-description]", meta).textContent = details.description;
      qs("[data-visual-medium]", meta).textContent = details.medium;
      qs("[data-visual-environment]", meta).textContent = details.environment;
      qs("[data-visual-carrier]", meta).textContent = details.carrier;
      qs("[data-visual-control]", meta).textContent = details.control;
      stage.setAttribute("aria-label", `Representative physical schematic for ${architecture.label}. ${details.description}`);
      qsa("[data-architecture]", tabs).forEach((button) => {
        const buttonDetails = refinement.architectureVisuals[button.dataset.architecture];
        if (buttonDetails) button.title = `${buttonDetails.medium}. ${buttonDetails.description}`;
      });
    };

    const renderSelected = () => {
      const selected = qs("[data-architecture][aria-selected='true']", tabs);
      render(selected?.dataset.architecture || "superconducting");
    };

    tabs.addEventListener("click", () => window.setTimeout(renderSelected, 0));
    const observer = new MutationObserver(renderSelected);
    observer.observe(tabs, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    renderSelected();
  };

  const createTextBlock = (label, text, wide = false) => {
    const block = document.createElement("div");
    block.className = `record-human-block${wide ? " is-wide" : ""}`;
    const heading = document.createElement("span");
    heading.textContent = label;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    block.append(heading, paragraph);
    return block;
  };

  const recordTokens = (label, values) => {
    const block = document.createElement("div");
    block.className = "record-human-block is-wide";
    const heading = document.createElement("span");
    heading.textContent = label;
    const list = document.createElement("ul");
    list.className = "record-token-list";
    (values.length ? values : ["None recorded"]).forEach((value) => {
      const item = document.createElement("li");
      item.textContent = humanizeToken(value);
      list.append(item);
    });
    block.append(heading, list);
    return block;
  };

  const evidenceCounts = (scenario) => {
    const counts = { admitted: 0, quarantined: 0, unresolved: 0 };
    scenario.evidence.forEach(([tag]) => {
      if (tag === "ADMITTED") counts.admitted += 1;
      else if (tag === "QUARANTINED") counts.quarantined += 1;
      else counts.unresolved += 1;
    });
    return counts;
  };

  const unresolvedDescriptions = (scenario, record) => {
    if (Array.isArray(record.unknowns)) return record.unknowns;
    const unresolved = scenario.evidence
      .filter(([tag]) => !["ADMITTED", "QUARANTINED"].includes(tag))
      .map(([, description]) => description);
    if (Array.isArray(record.reevaluate_when)) unresolved.push(...record.reevaluate_when);
    return [...new Set(unresolved)];
  };

  const controlsFromRecord = (record) => record.controls || record.required_controls || record.reevaluate_when || [];

  const initHumanDecisionRecord = () => {
    const panel = qs(".replay-record");
    const pre = qs("[data-replay-record]", panel || document);
    if (!panel || !pre || qs("[data-human-record]", panel)) return;

    const human = document.createElement("section");
    human.className = "record-human is-waiting";
    human.dataset.humanRecord = "";
    human.setAttribute("aria-live", "polite");

    const disclosure = document.createElement("details");
    disclosure.className = "record-json-disclosure";
    disclosure.open = true;
    const disclosureSummary = document.createElement("summary");
    disclosureSummary.textContent = "Inspect canonical decision-record JSON";
    const toolbar = document.createElement("div");
    toolbar.className = "record-json-toolbar";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "record-copy-button";
    copyButton.textContent = "Copy JSON";
    toolbar.append(copyButton);
    disclosure.append(disclosureSummary, toolbar, pre);

    const boundary = qs(".record-boundary", panel);
    panel.insertBefore(human, boundary || null);
    panel.insertBefore(disclosure, boundary || null);

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent || "");
        copyButton.textContent = "Copied";
      } catch {
        copyButton.textContent = "Copy unavailable";
      }
      window.setTimeout(() => { copyButton.textContent = "Copy JSON"; }, 1400);
    });

    const renderWaiting = (message = "Select Play to execute the decision.") => {
      human.className = "record-human is-waiting";
      human.textContent = "";
      const glyph = document.createElement("span");
      glyph.className = "record-human-glyph";
      glyph.textContent = "⌁";
      const label = document.createElement("span");
      label.className = "record-human-label";
      label.textContent = "HUMAN-READABLE DECISION BRIEF";
      const text = document.createElement("p");
      text.textContent = message;
      human.append(glyph, label, text);
    };

    const renderExecuting = (text) => {
      const stage = /stage:\s*([^\n]+)/i.exec(text)?.[1] || "processing";
      renderWaiting(`${humanizeToken(stage)} stage is executing. The recommendation remains withheld until the complete record is produced.`);
    };

    const renderComplete = (record) => {
      const scenario = selectedScenario();
      const presentation = refinement.decisionPresentation[scenario.id];
      const counts = evidenceCounts(scenario);
      const unknowns = unresolvedDescriptions(scenario, record);
      const controls = controlsFromRecord(record);

      human.className = "record-human";
      human.textContent = "";

      const result = document.createElement("div");
      result.className = "record-human-result";
      const label = document.createElement("span");
      label.className = "record-human-label";
      label.textContent = "DERIVED DECISION BRIEF";
      const recommendation = document.createElement("strong");
      recommendation.textContent = presentation?.recommendation || humanizeToken(record.disposition || scenario.result);
      const context = document.createElement("p");
      context.textContent = scenario.context;
      result.append(label, recommendation, context);

      const stats = document.createElement("div");
      stats.className = "record-evidence-stats";
      [["Admitted", counts.admitted, "good"], ["Quarantined", counts.quarantined, "warn"], ["Unresolved", counts.unresolved, counts.unresolved ? "bad" : "good"]].forEach(([name, count, tone]) => {
        const stat = document.createElement("div");
        stat.className = `record-evidence-stat ${tone}`;
        const statLabel = document.createElement("span");
        statLabel.textContent = name;
        const value = document.createElement("strong");
        value.textContent = String(count);
        stat.append(statLabel, value);
        stats.append(stat);
      });

      const grid = document.createElement("div");
      grid.className = "record-human-grid";
      grid.append(
        createTextBlock("Why this result", presentation?.rationale || "The deterministic rule conditions produced the recorded disposition."),
        createTextBlock("Next action", presentation?.nextAction || "Route the record to the accountable owner for disposition."),
        recordTokens("Required controls or triggers", controls),
        recordTokens("Unknowns preserved", unknowns),
        createTextBlock("Authority boundary", presentation?.authority || humanizeToken(record.authority), true)
      );

      const note = document.createElement("p");
      note.className = "record-derived-note";
      note.textContent = "This brief is a presentation derived from the canonical JSON record below. It does not create a second decision or replace the accountable owner.";

      human.append(result, stats, grid, note);
    };

    const renderFromPre = () => {
      const text = (pre.textContent || "").trim();
      if (!text || text.startsWith("Select Play")) {
        renderWaiting();
        return;
      }
      if (text.startsWith("stage:")) {
        renderExecuting(text);
        return;
      }
      try {
        renderComplete(JSON.parse(text));
      } catch {
        renderWaiting("The decision trace is preparing the canonical record.");
      }
    };

    const observer = new MutationObserver(renderFromPre);
    observer.observe(pre, { childList: true, characterData: true, subtree: true });
    qs("[data-scenario-tabs]")?.addEventListener("click", () => window.setTimeout(renderFromPre, 0));
    renderFromPre();
  };

  initArchitectureVisuals();
  initHumanDecisionRecord();
})();
