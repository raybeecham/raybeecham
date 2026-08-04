(() => {
  "use strict";

  const data = window.EvidenceOSData;
  const refinement = window.EvidenceOSRefinementData;
  if (!data || !refinement) return;

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const componentMap = Object.freeze({
    superconducting: [
      {
        label: "Qubit pads",
        x: 29,
        y: 34,
        role: "The cross-shaped capacitor structures and Josephson junctions form the superconducting qubits.",
        matters: "Their frequencies, coherence, calibration stability, and fabrication variation set the usable operating envelope."
      },
      {
        label: "Local couplers",
        x: 73,
        y: 50,
        role: "Couplers mediate two-qubit interactions between nearby qubits in the lattice.",
        matters: "Sparse locality makes placement and SWAP routing a first-order contributor to depth and accumulated error."
      },
      {
        label: "Control and readout",
        x: 34,
        y: 78,
        role: "Microwave and flux-control traces drive gates and carry measurement signals to the classical control stack.",
        matters: "Crosstalk, bandwidth, packaging, and calibration throughput become scaling constraints long before the chip is physically full."
      }
    ],
    resonator: [
      {
        label: "Shared resonator bus",
        x: 50,
        y: 48,
        role: "A common microwave resonator stores or transfers excitations used to mediate interactions across the device.",
        matters: "The bus can reduce long-range routing for hub-and-spoke workloads, but occupancy and bus-specific fidelity must be measured."
      },
      {
        label: "Bus-coupled qubits",
        x: 21,
        y: 31,
        role: "Superconducting qubits are arranged around and coupled into the shared resonator mode.",
        matters: "Useful connectivity depends on whether the compiler and control stack preserve the architecture's native interaction pattern."
      },
      {
        label: "MOVE pathway",
        x: 75,
        y: 66,
        role: "MOVE-style operations transfer quantum state between a qubit and the resonator bus.",
        matters: "Routing advantage only survives when state transfer, calibration, and added native operations beat the alternative SWAP network."
      }
    ],
    "trapped-ion": [
      {
        label: "Ion chain",
        x: 50,
        y: 34,
        role: "Laser-cooled atomic ions are suspended in a shared electromagnetic potential and act as exceptionally uniform qubits.",
        matters: "Collective motional modes support dense interactions, but chain growth changes mode structure, control complexity, and throughput."
      },
      {
        label: "Trap electrodes",
        x: 51,
        y: 73,
        role: "Segmented electrodes generate and shape the electric fields that confine, position, split, and transport ions.",
        matters: "Electrode geometry and control quality determine stability, shuttling performance, heating, and practical modularity."
      },
      {
        label: "Laser control",
        x: 77,
        y: 23,
        role: "Addressed optical beams prepare states, drive single- and two-qubit gates, and support measurement.",
        matters: "Optical alignment, addressing error, gate duration, and parallel beam control affect wall-clock performance and scaling."
      }
    ],
    "neutral-atom": [
      {
        label: "Optical-tweezer site",
        x: 27,
        y: 32,
        role: "A tightly focused laser trap holds one neutral atom at a programmable site in the array.",
        matters: "Loading probability, atom loss, rearrangement speed, and site-level control determine the usable array presented to a workload."
      },
      {
        label: "Rydberg interaction",
        x: 56,
        y: 49,
        role: "Selected atoms are excited into Rydberg states that create strong, distance-dependent interactions.",
        matters: "Interaction radius and geometry govern which problem graphs or gate patterns can be represented without additional motion or compilation."
      },
      {
        label: "Reconfigurable geometry",
        x: 76,
        y: 72,
        role: "Atoms can be rearranged into layouts chosen for the experiment rather than fixed permanently in a fabricated lattice.",
        matters: "Geometry flexibility is powerful, but transport, calibration, atom loss, and repeated-cycle reliability remain material."
      }
    ],
    photonic: [
      {
        label: "Photon sources",
        x: 15,
        y: 38,
        role: "Sources prepare single photons, squeezed states, or other optical resource states for the computation.",
        matters: "Brightness, indistinguishability, purity, synchronization, and source probability directly affect usable system rates."
      },
      {
        label: "Interferometer network",
        x: 48,
        y: 49,
        role: "Waveguides, beam splitters, and phase shifters transform optical modes and create interference patterns.",
        matters: "Loss, phase stability, fabrication variation, and feed-forward latency determine whether the intended transformation survives at scale."
      },
      {
        label: "Detectors",
        x: 84,
        y: 48,
        role: "Photon detectors convert final optical events into classical measurement outcomes.",
        matters: "Efficiency, dark counts, timing resolution, and detector multiplexing strongly influence the full resource model."
      }
    ],
    annealing: [
      {
        label: "Physical qubits",
        x: 25,
        y: 31,
        role: "Each programmable element represents a binary spin variable with a tunable local bias.",
        matters: "Physical count is not logical problem size. Topology and embedding determine how many variables the workload can actually use."
      },
      {
        label: "Programmable couplers",
        x: 48,
        y: 56,
        role: "Couplers encode pairwise interaction terms in the Ising or QUBO objective.",
        matters: "Connectivity, coefficient precision, calibration, and chain strength shape the implemented energy landscape."
      },
      {
        label: "Embedding chain",
        x: 68,
        y: 39,
        role: "Multiple physical qubits may be linked together to represent one logical variable missing from the native hardware graph.",
        matters: "Long chains consume capacity and create chain-break risk, so embedding quality must be reported alongside business metrics."
      }
    ]
  });

  const modeMeta = Object.freeze({
    physical: {
      label: "Physical",
      description: "Inspect the representative hardware components and the role each one plays in the architecture."
    },
    control: {
      label: "Control flow",
      description: "Follow the preparation, interaction, and measurement path used to turn physical hardware into an executable experiment."
    },
    constraints: {
      label: "Bottlenecks",
      description: "Expose the connectivity, implementation, and error-correction constraints that can invalidate a workload match."
    },
    fit: {
      label: "Mission fit",
      description: "Interrogate the workloads that tend to align with this architecture before a provider comparison begins."
    }
  });

  const selectedArchitecture = (shell) => {
    const selected = qs("[data-architecture][aria-selected='true']", shell);
    return data.quantumArchitectures.find((architecture) => architecture.id === selected?.dataset.architecture) || data.quantumArchitectures[0];
  };

  const setInspection = (card, eyebrow, heading, description) => {
    card.textContent = "";
    const label = document.createElement("span");
    label.textContent = eyebrow;
    const title = document.createElement("strong");
    title.textContent = heading;
    const copy = document.createElement("p");
    copy.textContent = description;
    card.append(label, title, copy);
  };

  const createHotspot = (component, index, card, layer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quantum-hotspot";
    button.style.left = `${component.x}%`;
    button.style.top = `${component.y}%`;
    button.dataset.label = component.label;
    button.setAttribute("aria-label", `Inspect ${component.label}`);
    button.textContent = String(index + 1).padStart(2, "0");
    button.addEventListener("click", () => {
      qsa(".quantum-hotspot", layer).forEach((item) => item.classList.toggle("is-active", item === button));
      setInspection(card, "PHYSICAL COMPONENT", component.label, `${component.role} Why it matters: ${component.matters}`);
    });
    return button;
  };

  const renderPhysicalMode = (architecture, layer, card) => {
    const components = componentMap[architecture.id] || [];
    components.forEach((component, index) => layer.append(createHotspot(component, index, card, layer)));
    const first = qs(".quantum-hotspot", layer);
    if (first && components[0]) {
      first.classList.add("is-active");
      setInspection(card, "PHYSICAL COMPONENT", components[0].label, `${components[0].role} Why it matters: ${components[0].matters}`);
    }
  };

  const renderControlMode = (architecture, layer, card) => {
    const visual = refinement.architectureVisuals[architecture.id];
    const flow = document.createElement("div");
    flow.className = "quantum-control-flow";
    const steps = document.createElement("div");
    steps.className = "quantum-control-steps";
    [
      ["01", "Prepare"],
      ["02", "Interact"],
      ["03", "Measure"]
    ].forEach(([number, label]) => {
      const step = document.createElement("div");
      const index = document.createElement("span");
      index.textContent = number;
      const name = document.createElement("strong");
      name.textContent = label;
      step.append(index, name);
      steps.append(step);
    });
    layer.append(flow, steps);
    setInspection(
      card,
      "CONTROL PATH",
      visual?.control || "Architecture control stack",
      `Native execution model: ${architecture.native} A useful benchmark must preserve the intended control path through compilation and submission.`
    );
  };

  const renderConstraintMode = (architecture, layer, card) => {
    const constraints = [
      ["Connectivity and routing", architecture.connectivity],
      ["Primary implementation constraint", architecture.constraint],
      ["Error-correction question", architecture.errorCorrection]
    ];
    const grid = document.createElement("div");
    grid.className = "quantum-constraint-grid";
    constraints.forEach(([label, description], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quantum-constraint-card";
      const number = document.createElement("span");
      number.textContent = `RISK ${String(index + 1).padStart(2, "0")}`;
      const heading = document.createElement("strong");
      heading.textContent = label;
      button.append(number, heading);
      button.addEventListener("click", () => {
        qsa(".quantum-constraint-card", grid).forEach((item) => item.classList.toggle("is-active", item === button));
        setInspection(card, "ARCHITECTURE BOTTLENECK", label, description);
      });
      grid.append(button);
    });
    layer.append(grid);
    const first = qs(".quantum-constraint-card", grid);
    first?.classList.add("is-active");
    setInspection(card, "ARCHITECTURE BOTTLENECK", constraints[0][0], constraints[0][1]);
  };

  const renderFitMode = (architecture, layer, card) => {
    const grid = document.createElement("div");
    grid.className = "quantum-workload-grid";
    architecture.workloads.forEach((workload, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quantum-workload-chip";
      const number = document.createElement("span");
      number.textContent = `FIT ${String(index + 1).padStart(2, "0")}`;
      const heading = document.createElement("strong");
      heading.textContent = workload;
      button.append(number, heading);
      button.addEventListener("click", () => {
        qsa(".quantum-workload-chip", grid).forEach((item) => item.classList.toggle("is-active", item === button));
        const mission = window.EvidenceOS?.getState?.().mission || "research";
        const missionName = data.missions[mission]?.short || mission;
        setInspection(
          card,
          `MISSION FIT // ${missionName.toUpperCase()}`,
          workload,
          `${architecture.strength} Treat this as an experiment hypothesis, not a provider recommendation. The workload still needs a credible classical baseline and explicit stop criteria.`
        );
      });
      grid.append(button);
    });
    layer.append(grid);
    const first = qs(".quantum-workload-chip", grid);
    first?.classList.add("is-active");
    if (architecture.workloads[0]) {
      setInspection(card, "MISSION-FIT HYPOTHESIS", architecture.workloads[0], `${architecture.strength} This is a candidate experiment lane, not an advantage claim.`);
    }
  };

  const createCompareCell = (className, heading, copy, meter, color) => {
    const cell = document.createElement("div");
    cell.className = className;
    if (heading) {
      const title = document.createElement("strong");
      title.textContent = heading;
      cell.append(title);
    }
    if (copy) {
      const paragraph = document.createElement("p");
      paragraph.textContent = copy;
      cell.append(paragraph);
    }
    if (Number.isFinite(meter)) {
      const row = document.createElement("div");
      row.className = "compare-meter";
      row.style.setProperty("--compare-color", color);
      const bar = document.createElement("i");
      bar.style.setProperty("--score", `${meter}%`);
      const score = document.createElement("span");
      score.textContent = String(meter);
      row.append(bar, score);
      cell.append(row);
    }
    return cell;
  };

  const renderComparePanel = (shell, panel, select) => {
    const current = selectedArchitecture(shell);
    let compared = data.quantumArchitectures.find((architecture) => architecture.id === select.value);
    if (!compared || compared.id === current.id) {
      compared = data.quantumArchitectures.find((architecture) => architecture.id !== current.id) || current;
      select.value = compared.id;
    }

    const grid = qs("[data-compare-grid]", panel);
    const title = qs("[data-compare-current]", panel);
    if (!grid) return;
    if (title) title.textContent = `${current.label} vs ${compared.label}`;
    panel.style.setProperty("--architecture-accent", current.accent);
    grid.textContent = "";

    const rows = [
      ["Architecture", current.label, compared.label],
      ["Physical form", refinement.architectureVisuals[current.id]?.medium, refinement.architectureVisuals[compared.id]?.medium],
      ["Operating environment", refinement.architectureVisuals[current.id]?.environment, refinement.architectureVisuals[compared.id]?.environment],
      ["Primary strength", current.strength, compared.strength],
      ["Primary constraint", current.constraint, compared.constraint],
      ["Connectivity", "Qualitative profile", "Qualitative profile", current.meters.connectivity, compared.meters.connectivity],
      ["Speed", "Qualitative profile", "Qualitative profile", current.meters.speed, compared.meters.speed],
      ["Coherence", "Qualitative profile", "Qualitative profile", current.meters.coherence, compared.meters.coherence],
      ["Maturity", "Qualitative profile", "Qualitative profile", current.meters.maturity, compared.meters.maturity],
      ["Routing fit", "Qualitative profile", "Qualitative profile", current.meters.routing, compared.meters.routing],
      ["Candidate experiments", current.workloads.slice(0, 2).join(" · "), compared.workloads.slice(0, 2).join(" · ")]
    ];

    rows.forEach(([label, left, right, leftMeter, rightMeter]) => {
      const labelCell = document.createElement("div");
      labelCell.className = "compare-label";
      labelCell.textContent = label;
      grid.append(
        labelCell,
        createCompareCell("compare-value", leftMeter === undefined ? left : current.label, leftMeter === undefined ? "" : left, leftMeter, current.accent),
        createCompareCell("compare-value", rightMeter === undefined ? right : compared.label, rightMeter === undefined ? "" : right, rightMeter, compared.accent)
      );
    });
  };

  const initQuantumExperience = () => {
    const shell = qs("[data-quantum-explorer]");
    const stage = qs(".chip-stage", shell || document);
    const visualShell = qs("[data-architecture-visual]", shell || document);
    const tabs = qs("[data-architecture-tabs]", shell || document);
    const readout = qs(".architecture-readout", shell || document);
    const labGrid = qs(".quantum-lab-grid", shell || document);
    if (!shell || !stage || !visualShell || !tabs || !readout || !labGrid || qs("[data-quantum-v2]", shell)) return;

    const state = { mode: "physical" };

    const toolbar = document.createElement("div");
    toolbar.className = "quantum-interaction-toolbar";
    toolbar.dataset.quantumV2 = "";
    const modes = document.createElement("div");
    modes.className = "quantum-view-modes";
    Object.entries(modeMeta).forEach(([id, meta]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.quantumMode = id;
      button.setAttribute("aria-pressed", String(id === state.mode));
      button.textContent = meta.label.toUpperCase();
      button.title = meta.description;
      modes.append(button);
    });
    const compareToggle = document.createElement("button");
    compareToggle.type = "button";
    compareToggle.className = "quantum-compare-toggle";
    compareToggle.setAttribute("aria-expanded", "false");
    compareToggle.textContent = "COMPARE ARCHITECTURES";
    toolbar.append(modes, compareToggle);
    stage.insertBefore(toolbar, visualShell);

    const modeLayer = document.createElement("div");
    modeLayer.className = "quantum-mode-layer";
    modeLayer.dataset.quantumModeLayer = "";
    visualShell.append(modeLayer);

    const inspection = document.createElement("section");
    inspection.className = "quantum-inspection-card";
    inspection.dataset.quantumInspection = "";
    const facts = qs(".architecture-facts", readout);
    readout.insertBefore(inspection, facts || null);

    const comparePanel = document.createElement("section");
    comparePanel.className = "quantum-compare-panel";
    comparePanel.hidden = true;
    comparePanel.dataset.quantumComparePanel = "";
    const compareHead = document.createElement("header");
    compareHead.className = "quantum-compare-head";
    const compareCopy = document.createElement("div");
    const compareLabel = document.createElement("span");
    compareLabel.className = "micro-label";
    compareLabel.textContent = "ARCHITECTURE COMPARISON";
    const compareTitle = document.createElement("strong");
    compareTitle.dataset.compareCurrent = "";
    compareCopy.append(compareLabel, compareTitle);
    const compareControls = document.createElement("div");
    compareControls.className = "quantum-compare-controls";
    const selectLabel = document.createElement("label");
    selectLabel.htmlFor = "quantum-compare-select";
    selectLabel.textContent = "Compare against";
    const select = document.createElement("select");
    select.id = "quantum-compare-select";
    data.quantumArchitectures.forEach((architecture) => {
      const option = document.createElement("option");
      option.value = architecture.id;
      option.textContent = architecture.label;
      select.append(option);
    });
    const close = document.createElement("button");
    close.type = "button";
    close.className = "quantum-compare-close";
    close.setAttribute("aria-label", "Close architecture comparison");
    close.textContent = "×";
    compareControls.append(selectLabel, select, close);
    compareHead.append(compareCopy, compareControls);
    const compareGrid = document.createElement("div");
    compareGrid.className = "quantum-compare-grid";
    compareGrid.dataset.compareGrid = "";
    comparePanel.append(compareHead, compareGrid);
    labGrid.after(comparePanel);

    const renderMode = () => {
      const architecture = selectedArchitecture(shell);
      shell.style.setProperty("--architecture-accent", architecture.accent);
      modeLayer.textContent = "";
      qsa("[data-quantum-mode]", toolbar).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.quantumMode === state.mode)));
      if (state.mode === "physical") renderPhysicalMode(architecture, modeLayer, inspection);
      else if (state.mode === "control") renderControlMode(architecture, modeLayer, inspection);
      else if (state.mode === "constraints") renderConstraintMode(architecture, modeLayer, inspection);
      else renderFitMode(architecture, modeLayer, inspection);
      if (!comparePanel.hidden) renderComparePanel(shell, comparePanel, select);
    };

    modes.addEventListener("click", (event) => {
      const button = event.target.closest("[data-quantum-mode]");
      if (!(button instanceof HTMLButtonElement)) return;
      state.mode = button.dataset.quantumMode;
      renderMode();
    });

    compareToggle.addEventListener("click", () => {
      comparePanel.hidden = !comparePanel.hidden;
      compareToggle.setAttribute("aria-expanded", String(!comparePanel.hidden));
      if (!comparePanel.hidden) renderComparePanel(shell, comparePanel, select);
    });
    close.addEventListener("click", () => {
      comparePanel.hidden = true;
      compareToggle.setAttribute("aria-expanded", "false");
      compareToggle.focus();
    });
    select.addEventListener("change", () => renderComparePanel(shell, comparePanel, select));

    const observer = new MutationObserver(renderMode);
    observer.observe(tabs, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    document.addEventListener("evidenceos:missionchange", () => {
      if (state.mode === "fit") renderMode();
    });
    renderMode();
  };

  const createPathCard = ({ index, title, description, href, color, terminal = false }) => {
    const element = terminal ? document.createElement("button") : document.createElement("a");
    if (element instanceof HTMLButtonElement) element.type = "button";
    else element.href = href;
    element.className = `next-path-card${terminal ? " is-terminal" : ""}`;
    element.style.setProperty("--path-color", color);
    const number = document.createElement("span");
    number.textContent = index;
    const copy = document.createElement("span");
    const heading = document.createElement("strong");
    heading.textContent = title;
    const text = document.createElement("small");
    text.textContent = description;
    copy.append(heading, text);
    const arrow = document.createElement("i");
    arrow.textContent = terminal ? ">_" : "↗";
    element.append(number, copy, arrow);
    if (terminal) {
      element.addEventListener("click", () => qs(".terminal-button")?.click());
    }
    return element;
  };

  const initFinalActionHub = () => {
    const profileActions = qs(".profile-actions");
    if (profileActions) {
      const strip = document.createElement("div");
      strip.className = "profile-method-strip";
      ["Public systems", "Bounded R&D", "Reproducible methods", "Human-governed decisions"].forEach((label) => {
        const chip = document.createElement("span");
        chip.textContent = label;
        strip.append(chip);
      });
      profileActions.replaceWith(strip);
    }

    const layout = qs(".contact-layout");
    if (!layout || layout.classList.contains("is-action-hub")) return;
    layout.classList.add("is-action-hub");
    layout.textContent = "";

    const intro = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Choose the next evidence path";
    const heading = document.createElement("h2");
    heading.textContent = "Do not exit with a résumé. Continue through the system.";
    const copy = document.createElement("p");
    copy.textContent = "Move directly into the decision logic, research network, architecture lab, public source code, terminal, or professional contact channel that best matches what you came to evaluate.";
    const boundary = document.createElement("p");
    boundary.className = "action-hub-boundary";
    boundary.textContent = "EvidenceOS is a public research interface. Project outputs remain research artifacts and decision support, not procurement, deployment, policy, clinical, or operational authorization.";
    intro.append(eyebrow, heading, copy, boundary);

    const grid = document.createElement("div");
    grid.className = "next-path-grid";
    [
      { index: "01", title: "Replay a decision", description: "Inspect evidence admission, rules, unknowns, and the accountable authority boundary.", href: "#decision-replay", color: "#b8f45d" },
      { index: "02", title: "Traverse the research network", description: "Change the mission lens and inspect public standards, programs, research, security, and industry nodes.", href: "#research-earth", color: "#62f2ff" },
      { index: "03", title: "Interrogate an architecture", description: "Switch physical, control, bottleneck, mission-fit, and comparison views in the quantum lab.", href: "#quantum-explorer", color: "#9f7cff" },
      { index: "04", title: "Inspect the source", description: "Open the public repositories and evaluate the implementation evidence directly.", href: "https://github.com/raybeecham", color: "#5f9dff" },
      { index: "05", title: "Open the command interface", description: "Route missions and modules through the keyboard-first EvidenceOS terminal.", color: "#ffbe68", terminal: true },
      { index: "06", title: "Connect professionally", description: "Continue the conversation through the single professional contact channel.", href: "https://linkedin.com/in/RaymondBeecham", color: "#ff8a5c" }
    ].forEach((path) => grid.append(createPathCard(path)));

    layout.append(intro, grid);
  };

  initQuantumExperience();
  initFinalActionHub();
})();
