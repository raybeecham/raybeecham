(() => {
  "use strict";

  const data = window.EvidenceOSData;
  if (!data) return;

  const categoryMeta = Object.freeze({
    all: {
      label: "All",
      short: "Full network",
      color: "#62f2ff",
      description: "The complete public research network across standards, public-sector programs, security communities, research institutions, and technology providers."
    },
    standards: {
      label: "Standards",
      short: "Standards and protocols",
      color: "#62f2ff",
      description: "Public standards bodies and protocol communities that turn cryptographic and quantum research into interoperable technical direction."
    },
    government: {
      label: "Public sector",
      short: "Multi-agency programs",
      color: "#5f9dff",
      description: "Multi-agency and multi-country public programs supporting standards, cybersecurity, science, infrastructure, and advanced research."
    },
    security: {
      label: "Security",
      short: "Security ecosystem",
      color: "#ff6b83",
      description: "Open-source and commercial security organizations focused on cryptographic management, quantum-safe implementation, and migration operations."
    },
    research: {
      label: "Research",
      short: "Research institutions",
      color: "#9f7cff",
      description: "Public research institutions advancing hardware, software, photonics, cryptography, benchmarking, and foundational quantum science."
    },
    vendor: {
      label: "Industry",
      short: "Technology providers",
      color: "#b8f45d",
      description: "Quantum technology providers representing different hardware families, system architectures, software stacks, and commercialization paths."
    }
  });

  const architectureVisuals = Object.freeze({
    superconducting: {
      medium: "Cryogenic microfabricated circuit",
      environment: "Dilution refrigerator",
      carrier: "Josephson-junction qubits",
      control: "Microwave pulses and flux bias",
      description: "A patterned chip containing metallic capacitor pads, Josephson junctions, microwave control lines, readout resonators, and local couplers arranged as a sparse lattice.",
      callouts: ["Qubit capacitor pads", "Nearest-neighbor couplers", "Readout and control traces"]
    },
    resonator: {
      medium: "Cryogenic qubits around a shared bus",
      environment: "Dilution refrigerator",
      carrier: "Superconducting qubits plus resonator mode",
      control: "Microwave pulses and MOVE operations",
      description: "A superconducting chip where several qubits couple to a shared resonator bus. The bus acts as a reusable interaction channel for hub-and-spoke or longer-range communication patterns.",
      callouts: ["Shared resonator bus", "Bus-coupled qubits", "Reduced long-range routing"]
    },
    "trapped-ion": {
      medium: "Ion chain inside an electromagnetic trap",
      environment: "Ultra-high vacuum",
      carrier: "Laser-cooled atomic ions",
      control: "Addressed laser beams and trap electrodes",
      description: "A line or small crystal of charged atoms suspended above segmented electrodes. Laser pulses prepare, entangle, and measure ions without a solid-state chip carrying the qubits.",
      callouts: ["Trapped ion chain", "Segmented electrodes", "Laser control paths"]
    },
    "neutral-atom": {
      medium: "Reconfigurable optical-tweezer array",
      environment: "Ultra-high vacuum and laser cooling",
      carrier: "Neutral atoms in optical traps",
      control: "Optical tweezers and Rydberg excitation",
      description: "Individual neutral atoms are held in programmable optical traps. Array geometry can be rearranged, while Rydberg excitation creates strong interactions between selected nearby atoms.",
      callouts: ["Optical-tweezer sites", "Rydberg interaction radius", "Reconfigurable geometry"]
    },
    photonic: {
      medium: "Integrated optical circuit",
      environment: "Optical bench or photonic package",
      carrier: "Photons and optical modes",
      control: "Sources, interferometers, phase shifters, and detectors",
      description: "Photons travel through waveguides and interferometers. Beam splitters, phase shifters, squeezing, measurement, and feed-forward implement the exposed photonic execution model.",
      callouts: ["Photon source", "Interferometer network", "Single-photon detectors"]
    },
    annealing: {
      medium: "Programmable Ising interaction network",
      environment: "Cryogenic processor and classical control",
      carrier: "Flux qubits representing binary variables",
      control: "Annealing schedule, biases, and couplers",
      description: "Binary variables are mapped onto a sparse hardware graph of programmable qubits and couplers. Logical variables may require chains of physical qubits when the problem graph does not match the processor topology.",
      callouts: ["Physical qubit graph", "Programmable couplers", "Minor-embedding chains"]
    }
  });

  const decisionPresentation = Object.freeze({
    pqc: {
      recommendation: "Proceed with a controlled, phased hybrid ML-KEM rollout.",
      rationale: "Finalized standards and measured laboratory evidence support a bounded migration path. The unresolved middlebox dependency prevents an uncontrolled enterprise-wide cutover.",
      nextAction: "Authorize a limited pilot with negotiation telemetry, rollback, and a named security owner before expanding scope.",
      authority: "The accountable security owner approves, rejects, or modifies the rollout. EvidenceOS does not authorize deployment."
    },
    grid: {
      recommendation: "Authorize a bounded offline experiment, not production deployment.",
      rationale: "The mission problem maps to a relevant optimization form, a credible classical baseline exists, and the experiment can fail safely. Operational-scale advantage remains unproven.",
      nextAction: "Run the same synthetic instances through the quantum and classical paths with shared metrics, resource accounting, and explicit stop criteria.",
      authority: "The mission owner may authorize the experiment. Provider selection and operational use remain outside this result."
    },
    qml: {
      recommendation: "Defer the quantum model and retain the classical champion.",
      rationale: "The current evidence does not establish advantage under production imbalance or latency constraints. Replacing the classical model would add risk without a supported mission benefit.",
      nextAction: "Reassess only when operational-scale advantage and latency-capable execution are demonstrated under shared evaluation conditions.",
      authority: "The fraud-platform owner retains the production decision and the associated operational risk."
    }
  });

  const missionNetworkNotes = Object.freeze({
    research: "Prioritizes standards, public research programs, research institutions, and technology-development signals.",
    secure: "Prioritizes standards, public cybersecurity direction, and implementable security ecosystems.",
    pqc: "Prioritizes standards, public migration direction, security implementation, and provider readiness evidence.",
    quantum: "Prioritizes research institutions, public research programs, and architecture-diverse technology providers.",
    lab: "Shows every public node in the curated network without implying operational monitoring."
  });

  // Runtime defense: a public portfolio must not expose a single client-specific
  // organization marker. The source data is also validated and sanitized in CI.
  const excludedIds = new Set(["doe", "nist", "nsa", "darpa"]);
  for (let index = data.earthMarkers.length - 1; index >= 0; index -= 1) {
    if (excludedIds.has(data.earthMarkers[index].id)) data.earthMarkers.splice(index, 1);
  }

  window.EvidenceOSRefinementData = Object.freeze({
    categoryMeta,
    architectureVisuals,
    decisionPresentation,
    missionNetworkNotes
  });
})();
