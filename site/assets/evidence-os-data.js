(() => {
  "use strict";

  const systems = [
    {
      id: "research-scout",
      name: "Quantum Research Scout",
      short: "Research Scout",
      type: "intelligence",
      status: "live",
      public: true,
      repo: "raybeecham/quantum-research-scout",
      liveUrl: "https://raybeecham.github.io/quantum-research-scout/",
      repoUrl: "https://github.com/raybeecham/quantum-research-scout",
      position: { x: 50, y: 12 },
      summary: "Evidence-first intelligence for quantum technology, PQC, federal missions, procurement, patents, organizations, and strategic forecasts.",
      boundary: "Public-source intelligence and decision support. It does not authorize pursuit, procurement, or policy action.",
      capabilities: ["Evidence admission", "Temporal intelligence", "Forecast calibration", "Procurement and patent signals"],
      missions: ["research", "quantum", "pqc", "lab"],
      accent: "cyan"
    },
    {
      id: "tdaf",
      name: "Technology Decision Assurance Framework",
      short: "TDAF",
      type: "decision",
      status: "research",
      public: false,
      repo: null,
      liveUrl: "#decision-replay",
      repoUrl: null,
      position: { x: 50, y: 42 },
      summary: "A mission-first, deterministic framework for deciding whether an emerging technology should be considered before provider selection begins.",
      boundary: "A decision result supports accountable review. It is not procurement authorization, production approval, or delegated authority.",
      capabilities: ["Evidence governance", "Deterministic rulebooks", "Decision records", "Human disposition boundary"],
      missions: ["secure", "pqc", "quantum", "research", "lab"],
      accent: "violet"
    },
    {
      id: "war-room",
      name: "PQC Readiness War Room",
      short: "PQC War Room",
      type: "security",
      status: "live",
      public: true,
      repo: "raybeecham/pqc-readiness-war-room",
      liveUrl: "https://pqc-readiness-war-room.raybeecham2009.workers.dev/",
      repoUrl: "https://github.com/raybeecham/pqc-readiness-war-room",
      position: { x: 20, y: 67 },
      summary: "Explains observable TLS modernization and HTTPS posture while keeping unverified PQC claims explicitly unknown.",
      boundary: "Public edge and target observations cannot prove complete cryptographic inventory, enterprise crypto-agility, or ML-KEM support.",
      capabilities: ["TLS modernization", "HTTP/3 visibility", "Evidence ledger", "Readiness unknowns"],
      missions: ["secure", "pqc", "lab"],
      accent: "orange"
    },
    {
      id: "crypto-inventory",
      name: "Crypto Inventory Demo",
      short: "Crypto Inventory",
      type: "discovery",
      status: "public",
      public: true,
      repo: "raybeecham/crypto-inventory-demo",
      liveUrl: null,
      repoUrl: "https://github.com/raybeecham/crypto-inventory-demo",
      position: { x: 9, y: 42 },
      summary: "CodeQL-driven cryptographic discovery across source code, TLS configuration, and runtime observations.",
      boundary: "A demonstration inventory is not complete enterprise coverage and must be reconciled with operational ownership and vendor evidence.",
      capabilities: ["CodeQL discovery", "CBOM output", "Runtime TLS evidence", "CI risk gates"],
      missions: ["secure", "pqc", "lab"],
      accent: "lime"
    },
    {
      id: "attack-defense",
      name: "Quantum Attack and Defense Lab",
      short: "Attack / Defense Lab",
      type: "defensive-lab",
      status: "private",
      public: false,
      repo: null,
      liveUrl: null,
      repoUrl: null,
      position: { x: 30, y: 90 },
      summary: "Authorized classical and hybrid TLS experiments with observed negotiation, timing, HNDL scoring, and migration outputs.",
      boundary: "Local, allowlisted, defensive research only. It is not a scanner and does not target third-party systems.",
      capabilities: ["Hybrid TLS measurement", "HNDL assessment", "Migration planning", "Fail-closed observations"],
      missions: ["secure", "pqc", "lab"],
      accent: "red"
    },
    {
      id: "qcef",
      name: "Quantum Computer Evaluation Framework",
      short: "QCEF / Workload Advisor",
      type: "evaluation",
      status: "development",
      public: false,
      repo: null,
      liveUrl: "#quantum-explorer",
      repoUrl: null,
      position: { x: 79, y: 43 },
      summary: "A vendor-neutral workload and architecture evaluation method for determining whether a controlled quantum experiment is justified.",
      boundary: "Suitability precedes provider comparison. The framework does not predict quantum advantage or approve acquisition.",
      capabilities: ["Workload characterization", "Architecture fit", "Resource questions", "Experiment design"],
      missions: ["quantum", "research", "lab"],
      accent: "blue"
    },
    {
      id: "iqm-benchmarks",
      name: "Quantum Hardware Architecture Assessment",
      short: "Hardware Benchmarks",
      type: "benchmark",
      status: "private",
      public: false,
      repo: null,
      liveUrl: "#quantum-explorer",
      repoUrl: null,
      position: { x: 91, y: 66 },
      summary: "Hardware-aware assessment of topology, routing, error provenance, fault-tolerance readiness, and cryptographic resource projections.",
      boundary: "Published device characteristics and bounded experiments do not establish production-scale advantage or fault tolerance.",
      capabilities: ["Circuit benchmarking", "Routing analysis", "Error provenance", "Readiness projections"],
      missions: ["quantum", "research", "lab"],
      accent: "cyan"
    },
    {
      id: "oncology",
      name: "Quantum Oncology Benchmark",
      short: "Oncology Benchmark",
      type: "benchmark",
      status: "public",
      public: true,
      repo: "raybeecham/quantum-oncology-benchmark",
      liveUrl: null,
      repoUrl: "https://github.com/raybeecham/quantum-oncology-benchmark",
      position: { x: 72, y: 90 },
      summary: "Reproducible comparison of strong classical baselines and quantum-kernel methods on oncology research tasks.",
      boundary: "Research use only. It is not a medical device and does not claim quantum advantage or clinical utility.",
      capabilities: ["Leakage-resistant evaluation", "Shared partitions", "Statistical controls", "Resource accounting"],
      missions: ["quantum", "research", "lab"],
      accent: "violet"
    },
    {
      id: "ai-handbook",
      name: "AI Systems Engineering Handbook",
      short: "AI Systems Handbook",
      type: "engineering",
      status: "public",
      public: true,
      repo: "raybeecham/claude-certified-associate-foundations",
      liveUrl: null,
      repoUrl: "https://github.com/raybeecham/claude-certified-associate-foundations",
      position: { x: 50, y: 76 },
      summary: "A scenario-driven study system and vendor-neutral method for secure, evaluated, and human-governed AI workflows.",
      boundary: "The handbook supports workflow design and study. It does not replace organizational policy, legal review, or accountable approval.",
      capabilities: ["Workflow design", "Output evaluation", "Governance", "Human review"],
      missions: ["research", "lab"],
      accent: "amber"
    },
    {
      id: "pki-lab",
      name: "Modern Practical PKI",
      short: "PKI Lab",
      type: "learning-lab",
      status: "public",
      public: true,
      repo: "raybeecham/modern-practical-pki",
      liveUrl: null,
      repoUrl: "https://github.com/raybeecham/modern-practical-pki",
      position: { x: 6, y: 78 },
      summary: "A Docker-based OpenSSL lab progressing from encodings and keys into certificate authorities, revocation, TLS, and hardware-backed trust concepts.",
      boundary: "Educational lab material is not production PKI configuration or operational key-management guidance.",
      capabilities: ["OpenSSL", "Certificate lifecycle", "CA hierarchy", "Revocation and TLS"],
      missions: ["secure", "pqc", "lab"],
      accent: "blue"
    },
    {
      id: "chrono",
      name: "Chrono",
      short: "Chrono",
      type: "experience",
      status: "public",
      public: true,
      repo: "raybeecham/Chrono",
      liveUrl: null,
      repoUrl: "https://github.com/raybeecham/Chrono",
      position: { x: 94, y: 88 },
      summary: "An AI-powered historical simulation with period-aware dialogue and structured temporal-contamination detection.",
      boundary: "An interactive reconstruction, not a substitute for primary historical sources.",
      capabilities: ["Structured outputs", "Interactive AI", "Historical simulation", "Deterministic fallback"],
      missions: ["lab"],
      accent: "amber"
    }
  ];

  const edges = [
    ["research-scout", "tdaf", "evidence feeds decision assurance"],
    ["tdaf", "war-room", "governed readiness decision"],
    ["crypto-inventory", "war-room", "discovery evidence"],
    ["crypto-inventory", "tdaf", "inventory informs mission case"],
    ["war-room", "attack-defense", "unknowns become lab tests"],
    ["attack-defense", "tdaf", "measured evidence"],
    ["tdaf", "qcef", "technology suitability"],
    ["qcef", "iqm-benchmarks", "architecture comparison"],
    ["qcef", "oncology", "workload experiment"],
    ["research-scout", "qcef", "research and market signals"],
    ["research-scout", "ai-handbook", "evidence workflow"],
    ["ai-handbook", "tdaf", "governed automation"],
    ["pki-lab", "crypto-inventory", "cryptographic foundations"],
    ["chrono", "ai-handbook", "structured AI experience"]
  ];

  const missions = {
    research: {
      id: "research",
      order: 1,
      label: "Investigate Emerging Research",
      short: "Research Intelligence",
      code: "INTEL-01",
      accent: "#62f2ff",
      secondary: "#8b5cf6",
      objective: "Turn fragmented quantum, PQC, government, patent, and market signals into a traceable intelligence picture.",
      question: "What changed, why does it matter, and what deserves attention next?",
      risk: "Noise, stale evidence, unsupported inference, and missed strategic signals.",
      systems: ["research-scout", "tdaf", "qcef", "ai-handbook", "oncology"],
      primary: ["research-scout", "tdaf", "qcef"],
      situation: [
        ["Signal intake", "Papers · standards · government · procurement"],
        ["Trust boundary", "Admission · quarantine · provenance"],
        ["Decision output", "Signals · forecasts · next actions"],
        ["Human authority", "Analyst review retained"]
      ],
      terminalHint: "research",
      mapFilter: ["standards", "government", "vendor", "research"]
    },
    secure: {
      id: "secure",
      order: 2,
      label: "Secure an Enterprise",
      short: "Enterprise Security",
      code: "SECURE-02",
      accent: "#ff6b83",
      secondary: "#62f2ff",
      objective: "Expose cryptographic dependencies, modern transport visibility gaps, and migration risks before they become mission failures.",
      question: "Where is cryptography used, what can we observe, and which gaps create material risk?",
      risk: "Unknown assets, unowned certificates, blind transport paths, and long-lived data exposure.",
      systems: ["crypto-inventory", "war-room", "attack-defense", "pki-lab", "tdaf"],
      primary: ["crypto-inventory", "war-room", "tdaf"],
      situation: [
        ["Discovery", "Code · config · certificates · runtime"],
        ["Transport", "TLS 1.3 · QUIC · HTTP/3 visibility"],
        ["Threat", "HNDL · agility · ownership gaps"],
        ["Decision", "Prioritized remediation record"]
      ],
      terminalHint: "secure",
      mapFilter: ["standards", "government", "security"]
    },
    pqc: {
      id: "pqc",
      order: 3,
      label: "Migrate to Post-Quantum Cryptography",
      short: "PQC Migration",
      code: "PQC-03",
      accent: "#b8f45d",
      secondary: "#62f2ff",
      objective: "Move from standards awareness to evidence-backed discovery, hybrid testing, phased rollout, and measurable crypto-agility.",
      question: "Which assets need migration, which paths can be tested now, and how do we preserve rollback?",
      risk: "Harvest-now-decrypt-later exposure, incompatible dependencies, vendor uncertainty, and uncontrolled cutovers.",
      systems: ["war-room", "crypto-inventory", "attack-defense", "pki-lab", "research-scout", "tdaf"],
      primary: ["war-room", "crypto-inventory", "attack-defense"],
      situation: [
        ["Standards", "ML-KEM · ML-DSA · SLH-DSA"],
        ["Inventory", "Algorithms · keys · protocols · owners"],
        ["Experiment", "Classical vs hybrid handshake evidence"],
        ["Migration", "Phased rollout · telemetry · rollback"]
      ],
      terminalHint: "pqc",
      mapFilter: ["standards", "government", "security", "vendor"]
    },
    quantum: {
      id: "quantum",
      order: 4,
      label: "Evaluate Quantum Technology",
      short: "Quantum Evaluation",
      code: "Q-EVAL-04",
      accent: "#9f7cff",
      secondary: "#62f2ff",
      objective: "Determine whether a quantum approach deserves a controlled experiment before comparing providers or claiming advantage.",
      question: "Does the mission problem fit, what baseline must win, and which architecture constraints matter?",
      risk: "Technology-first framing, weak classical controls, incomparable metrics, and unsupported advantage claims.",
      systems: ["tdaf", "qcef", "iqm-benchmarks", "oncology", "research-scout"],
      primary: ["tdaf", "qcef", "iqm-benchmarks"],
      situation: [
        ["Mission fit", "Decision context before technology"],
        ["Baseline", "Credible classical comparator required"],
        ["Architecture", "Topology · native operations · routing"],
        ["Experiment", "Bounded success and stop criteria"]
      ],
      terminalHint: "quantum",
      mapFilter: ["research", "vendor", "government"]
    },
    lab: {
      id: "lab",
      order: 5,
      label: "Explore the Research Lab",
      short: "Open Lab",
      code: "LAB-05",
      accent: "#ffbe68",
      secondary: "#8b5cf6",
      objective: "Traverse the complete research environment, replay decisions, inspect architectures, and open the systems behind the portfolio.",
      question: "How do the projects connect, and what is it like to reason inside this environment?",
      risk: "None. This mode is an open exploration of public and bounded research artifacts.",
      systems: systems.map((system) => system.id),
      primary: ["research-scout", "tdaf", "war-room"],
      situation: [
        ["Mode", "Open exploration"],
        ["Systems", "Public · private · lab · prototype"],
        ["Interactions", "Graph · globe · chip · replay · terminal"],
        ["Boundary", "Public-safe portfolio environment"]
      ],
      terminalHint: "lab",
      mapFilter: ["standards", "government", "vendor", "research", "security"]
    }
  };

  const decisionScenarios = {
    pqc: {
      id: "pqc",
      label: "Hybrid ML-KEM Migration",
      context: "Should a federal program phase hybrid ML-KEM key establishment into a long-lived public service?",
      result: "PROCEED WITH CONTROLLED PHASED ROLLOUT",
      resultTone: "good",
      evidence: [
        ["ADMITTED", "Finalized standards and authoritative migration direction", "good"],
        ["ADMITTED", "Observed TLS 1.3 and hybrid negotiation in an isolated lab", "good"],
        ["QUARANTINED", "Vendor readiness claim without implementation evidence", "warn"],
        ["UNKNOWN", "Legacy middlebox behavior across the full dependency chain", "warn"]
      ],
      stages: [
        ["OBSERVE", "Standards, inventory findings, negotiation telemetry, and dependency evidence enter the case."],
        ["ADMIT", "Authoritative and measured evidence is admitted. Unsupported marketing claims remain visible in quarantine."],
        ["EVALUATE", "Rules require standardized primitives, rollback, telemetry, ownership, and bounded failure impact."],
        ["RECORD", "The decision record preserves the rollout recommendation, open middlebox risk, and required monitoring."],
        ["DECIDE", "The accountable security owner approves or rejects the rollout. The system does not inherit authority."]
      ],
      record: {
        decision_id: "EOS-PQC-001",
        disposition: "controlled_rollout_justified",
        evidence_admitted: 2,
        evidence_quarantined: 1,
        unknowns: ["legacy_middlebox_behavior"],
        controls: ["phased_enablement", "negotiation_telemetry", "rollback_path", "owner_assigned"],
        authority: "retained_by_security_owner"
      }
    },
    grid: {
      id: "grid",
      label: "Quantum Grid Optimization Pilot",
      context: "Should a mission owner run a bounded quantum optimization pilot for outage-restoration scheduling?",
      result: "CONTROLLED EXPERIMENT JUSTIFIED",
      resultTone: "conditional",
      evidence: [
        ["ADMITTED", "Problem structure maps to a constrained optimization formulation", "good"],
        ["ADMITTED", "A credible MILP baseline exists on the same synthetic scenario", "good"],
        ["INSUFFICIENT", "No advantage evidence at operational scale", "warn"],
        ["ADMITTED", "The pilot can fail offline without mission impact", "good"]
      ],
      stages: [
        ["OBSERVE", "Mission objective, synthetic scenario, classical baseline, hardware limits, and success criteria enter the case."],
        ["ADMIT", "Structured public research and measured baseline evidence are admitted; incomparable vendor claims are quarantined."],
        ["EVALUATE", "Rules confirm mission fit and safe experimentation, but reject any production-readiness or advantage conclusion."],
        ["RECORD", "The record defines shared partitions, stop criteria, resource accounting, and the classical champion."],
        ["DECIDE", "The mission owner may authorize a bounded experiment, not operational deployment or provider selection."]
      ],
      record: {
        decision_id: "EOS-QGRID-001",
        disposition: "controlled_experiment_justified",
        baseline: "classical_MILP",
        advantage_claimed: false,
        required_controls: ["shared_instance_set", "resource_accounting", "stop_criteria", "offline_execution"],
        authority: "retained_by_mission_owner"
      }
    },
    qml: {
      id: "qml",
      label: "Quantum ML Fraud Detection",
      context: "Should a production fraud platform replace its classical champion with a quantum-kernel model?",
      result: "DEFER. RETAIN CLASSICAL CHAMPION",
      resultTone: "bad",
      evidence: [
        ["ADMITTED", "Quantum-kernel results on bounded research data", "good"],
        ["ADMITTED", "Strong classical PR-AUC on the production-like distribution", "good"],
        ["NOT FOUND", "Advantage evidence under operational imbalance and latency", "bad"],
        ["FAILED", "Current execution path cannot meet production scoring latency", "bad"]
      ],
      stages: [
        ["OBSERVE", "Research results, imbalance, latency constraints, classical performance, and operational risk enter the case."],
        ["ADMIT", "Reproducible benchmark evidence is admitted. Small-sample superiority claims are bounded to their test context."],
        ["EVALUATE", "Rules require advantage under shared operational conditions and satisfaction of the latency constraint."],
        ["RECORD", "The record retains the classical champion and defines explicit evidence triggers for future reassessment."],
        ["DECIDE", "The platform owner accepts or rejects the recommendation and remains responsible for production risk."]
      ],
      record: {
        decision_id: "EOS-QML-001",
        disposition: "defer",
        current_champion: "classical_gradient_boosting",
        advantage_claimed: false,
        reevaluate_when: ["operational_scale_advantage", "latency_constraint_satisfied"],
        authority: "retained_by_platform_owner"
      }
    }
  };

  const earthMarkers = [

    {
      id: "us-federal-quantum-network",
      name: "U.S. Federal Quantum & Cybersecurity Programs",
      location: "United States",
      lat: 38.9072,
      lon: -77.0369,
      category: "government",
      relevance: "Multi-agency public activity spanning quantum information science, cryptographic standards, cybersecurity, workforce development, national laboratories, and advanced research.",
      link: "https://www.quantum.gov/"
    },
    {
      id: "european-quantum-programs",
      name: "European Public Quantum Programs",
      location: "European Union",
      lat: 50.8503,
      lon: 4.3517,
      category: "government",
      relevance: "Multi-country public research and innovation programs spanning quantum computing, simulation, communication, sensing, and ecosystem development.",
      link: "https://qt.eu/"
    },
    {
      id: "uk-quantum-programme",
      name: "UK National Quantum Technologies Programme",
      location: "United Kingdom",
      lat: 51.5074,
      lon: -0.1278,
      category: "government",
      relevance: "A cross-government and research program connecting national strategy, research hubs, skills, infrastructure, and quantum-technology transition.",
      link: "https://www.gov.uk/government/publications/national-quantum-strategy"
    },
    {
      id: "ietf-pquip",
      name: "IETF Post-Quantum Use in Protocols",
      location: "Global standards community",
      lat: 18.0,
      lon: -28.0,
      category: "standards",
      relevance: "Open Internet standards work examining post-quantum transition, protocol integration, operational considerations, and implementation guidance.",
      link: "https://datatracker.ietf.org/wg/pquip/about/"
    },
    {
      id: "etsi-qsc",
      name: "ETSI Quantum-Safe Cryptography",
      location: "Sophia Antipolis, France",
      lat: 43.6156,
      lon: 7.055,
      category: "standards",
      relevance: "Public standards and technical work addressing quantum-safe cryptography, migration, interoperability, and deployment considerations.",
      link: "https://www.etsi.org/technologies/quantum-safe-cryptography"
    },
    {
      id: "open-quantum-safe",
      name: "Open Quantum Safe",
      location: "Global open-source community",
      lat: 43.4723,
      lon: -80.5449,
      category: "security",
      relevance: "Open-source post-quantum cryptographic implementations and integrations used for research, interoperability testing, and migration experimentation.",
      link: "https://openquantumsafe.org/"
    },
    {
      id: "qutech",
      name: "QuTech",
      location: "Delft, Netherlands",
      lat: 52.0116,
      lon: 4.3571,
      category: "research",
      relevance: "Public quantum research spanning computing, networking, hardware, software, and foundational system engineering.",
      link: "https://qutech.nl/"
    },
    {
      id: "iqm",
      name: "IQM Quantum Computers",
      location: "Espoo, Finland",
      lat: 60.2055,
      lon: 24.6559,
      category: "vendor",
      relevance: "Superconducting quantum hardware, architecture-aware benchmarking, and compilation research.",
      link: "https://www.meetiqm.com/"
    },
    {
      id: "alice-bob",
      name: "Alice & Bob",
      location: "Paris, France",
      lat: 48.8566,
      lon: 2.3522,
      category: "vendor",
      relevance: "Cat-qubit hardware and fault-tolerance-oriented architecture research.",
      link: "https://alice-bob.com/"
    },
    {
      id: "quobly",
      name: "Quobly",
      location: "Grenoble, France",
      lat: 45.1885,
      lon: 5.7245,
      category: "vendor",
      relevance: "Silicon spin-qubit development and semiconductor manufacturing pathways.",
      link: "https://www.quobly.io/"
    },
    {
      id: "ntt",
      name: "NTT Research",
      location: "Tokyo, Japan",
      lat: 35.6762,
      lon: 139.6503,
      category: "research",
      relevance: "Quantum science, photonics, cryptography, and foundational computing research.",
      link: "https://ntt-research.com/"
    },
    {
      id: "sandboxaq",
      name: "SandboxAQ",
      location: "Palo Alto, California",
      lat: 37.4419,
      lon: -122.143,
      category: "security",
      relevance: "Cryptographic management, quantum security, simulation, and AI-enabled science.",
      link: "https://www.sandboxaq.com/"
    },
    {
      id: "ionq",
      name: "IonQ",
      location: "College Park, Maryland",
      lat: 38.9897,
      lon: -76.9378,
      category: "vendor",
      relevance: "Trapped-ion quantum systems and application experimentation.",
      link: "https://ionq.com/"
    },
    {
      id: "quantinuum",
      name: "Quantinuum",
      location: "Cambridge, United Kingdom",
      lat: 52.2053,
      lon: 0.1218,
      category: "vendor",
      relevance: "Trapped-ion systems, quantum software, cryptography, and error-correction research.",
      link: "https://www.quantinuum.com/"
    },
    {
      id: "ibm",
      name: "IBM Quantum",
      location: "Yorktown Heights, New York",
      lat: 41.2709,
      lon: -73.7776,
      category: "research",
      relevance: "Superconducting systems, quantum software, benchmarking, and error correction.",
      link: "https://www.ibm.com/quantum"
    }
  ];

  const quantumArchitectures = [
    {
      id: "superconducting",
      label: "Superconducting Lattice",
      family: "Gate model",
      accent: "#62f2ff",
      native: "Microwave-controlled single-qubit rotations and tunable or fixed two-qubit entangling gates.",
      connectivity: "Usually sparse local connectivity, making placement, SWAP insertion, and routing central to performance.",
      strength: "Fast gates, mature control stacks, broad software support, and extensive benchmark history.",
      constraint: "Two-qubit error, crosstalk, calibration drift, and routing inflation accumulate quickly in deeper circuits.",
      errorCorrection: "Surface-code pathways are common, but physical-qubit overhead and decoder performance remain decisive.",
      workloads: ["Shallow variational circuits", "Hardware-aware kernels", "Small chemistry models", "Error-correction experiments"],
      questions: ["What topology reaches the workload interaction graph?", "Which published and measured error source feeds the model?", "How much compiled depth survives optimization?"],
      meters: { connectivity: 48, speed: 88, coherence: 42, maturity: 86, routing: 38 }
    },
    {
      id: "resonator",
      label: "Resonator-Bus Superconducting",
      family: "Gate model",
      accent: "#6ce9ff",
      native: "Qubit-resonator MOVE operations and bus-mediated interactions.",
      connectivity: "A central resonator can reduce long-range routing for star-pattern and hub-and-spoke workloads.",
      strength: "Architectural advantage for workloads with repeated long-range interactions around shared hubs.",
      constraint: "Compiler preservation, resonator occupancy, calibration behavior, and native-operation fidelity must be measured explicitly.",
      errorCorrection: "Potential routing benefits must be evaluated alongside threshold margin and resonator-specific failure modes.",
      workloads: ["Star entanglement", "Hub-and-spoke optimization", "Long-range interaction tests", "Architecture comparison"],
      questions: ["Are native MOVE operations preserved in submitted circuits?", "Does the compiler simplify away diagnostic depth?", "When does routing advantage outweigh gate error?"],
      meters: { connectivity: 83, speed: 76, coherence: 46, maturity: 58, routing: 89 }
    },
    {
      id: "trapped-ion",
      label: "Trapped Ion",
      family: "Gate model",
      accent: "#9f7cff",
      native: "Laser-driven single-qubit operations and collective or pairwise entangling gates.",
      connectivity: "Often high or effectively all-to-all within a chain, reducing routing overhead for dense interactions.",
      strength: "High-fidelity operations, flexible connectivity, and strong fit for algorithms requiring nonlocal interactions.",
      constraint: "Gate duration, chain scaling, optical complexity, and throughput can limit time-to-solution.",
      errorCorrection: "High fidelity can improve threshold margin, but cycle time and system scale still determine practical overhead.",
      workloads: ["Dense interaction circuits", "Algorithm prototypes", "Error-correction demonstrations", "Quantum simulation"],
      questions: ["Does wall-clock latency matter more than circuit depth?", "How does fidelity change as chain size grows?", "What concurrency is available?"],
      meters: { connectivity: 94, speed: 34, coherence: 90, maturity: 74, routing: 96 }
    },
    {
      id: "neutral-atom",
      label: "Neutral Atom Array",
      family: "Gate model / analog",
      accent: "#b8f45d",
      native: "Rydberg-mediated interactions, configurable atom placement, and analog or digital-analog evolution.",
      connectivity: "Geometry can be reconfigured to match graph structure, with interaction range governed by physical layout.",
      strength: "Large programmable arrays and natural fit for graph problems, simulation, and structured many-body dynamics.",
      constraint: "Atom loss, state preparation, measurement, gate fidelity, and compilation into geometry-aware interactions.",
      errorCorrection: "Array scale is promising, but fault-tolerant operation requires sufficiently reliable gates, transport, and repeated cycles.",
      workloads: ["Graph optimization", "Many-body simulation", "Analog dynamics", "Geometry-aware experiments"],
      questions: ["Can the problem graph map to the array geometry?", "Is the workload analog, digital, or hybrid?", "How are atom loss and readout modeled?"],
      meters: { connectivity: 81, speed: 67, coherence: 64, maturity: 58, routing: 78 }
    },
    {
      id: "photonic",
      label: "Photonic",
      family: "Gate model / sampling",
      accent: "#ffbe68",
      native: "Single photons, interferometers, squeezing, measurement, and feed-forward depending on architecture.",
      connectivity: "Optical routing can be flexible, but loss, source quality, detector behavior, and resource-state construction dominate.",
      strength: "Room-temperature pathways, networking compatibility, sampling, and measurement-based fault-tolerance concepts.",
      constraint: "Loss, probabilistic operations, source and detector efficiency, and large resource-state overhead.",
      errorCorrection: "Bosonic and measurement-based schemes can be attractive, but resource generation and loss thresholds are central.",
      workloads: ["Sampling", "Continuous-variable optimization", "Quantum networking", "Measurement-based research"],
      questions: ["Which execution model is exposed to users?", "How are loss and detector efficiency reported?", "What classical post-processing is required?"],
      meters: { connectivity: 74, speed: 82, coherence: 88, maturity: 51, routing: 72 }
    },
    {
      id: "annealing",
      label: "Quantum Annealing",
      family: "Optimization",
      accent: "#ff8a5c",
      native: "Ising or QUBO energy minimization through annealing schedules and hardware graph embedding.",
      connectivity: "Hardware graph connectivity and minor embedding determine chain count, coefficient scaling, and usable problem size.",
      strength: "Direct optimization interface, large variable counts, and mature hybrid decomposition workflows.",
      constraint: "Embedding overhead, coefficient precision, chain breaks, sampling interpretation, and comparison with strong classical solvers.",
      errorCorrection: "Current workflows emphasize error mitigation, embedding, calibration, and hybrid orchestration rather than gate-model fault tolerance.",
      workloads: ["QUBO optimization", "Scheduling", "Resource allocation", "Hybrid decomposition"],
      questions: ["What is the classical champion?", "How much embedding overhead remains?", "Are energy quality and business metrics aligned?"],
      meters: { connectivity: 63, speed: 84, coherence: 36, maturity: 82, routing: 57 }
    }
  ];

  const timeline = [
    {
      id: "pqc-foundation",
      date: "2025",
      title: "Quantum-security engineering foundation",
      category: "security",
      summary: "PQC migration, cryptographic inventory, TLS visibility, and quantum-threat modeling converge into one practical engineering focus.",
      evidence: ["Crypto inventory experiments", "TLS 1.3 visibility research", "PQC migration architecture"],
      link: "https://github.com/raybeecham/crypto-inventory-demo"
    },
    {
      id: "research-scout",
      date: "May 2026",
      title: "Quantum Research Scout becomes a public intelligence system",
      category: "intelligence",
      summary: "Automated collection evolves into an evidence-first platform for strategic signals, missions, procurement, patents, forecasts, and data trust.",
      evidence: ["Daily automation", "Source provenance", "Temporal intelligence", "Public dashboard"],
      link: "https://raybeecham.github.io/quantum-research-scout/"
    },
    {
      id: "pqc-war-room",
      date: "2026",
      title: "PQC Readiness War Room makes unknowns visible",
      category: "security",
      summary: "A live edge-based demonstration separates observed modernization signals from unverified PQC and enterprise-readiness claims.",
      evidence: ["TLS and HTTP telemetry", "Evidence ledger", "Executive brief", "Fail-closed readiness boundaries"],
      link: "https://pqc-readiness-war-room.raybeecham2009.workers.dev/"
    },
    {
      id: "tdaf",
      date: "July 2026",
      title: "Technology Decision Assurance Framework formalizes the method",
      category: "decision",
      summary: "Mission problems, evidence, governed rulebooks, deterministic results, decision records, and human dispositions become an explicit framework.",
      evidence: ["Normative model", "Deterministic engine", "Quantum suitability module", "Conformance tests"],
      link: "#decision-replay"
    },
    {
      id: "oncology",
      date: "July 2026",
      title: "Quantum Oncology Benchmark applies bounded experimental discipline",
      category: "quantum",
      summary: "Strong classical controls, leakage resistance, uncertainty reporting, and explicit non-advantage claims shape a research benchmark.",
      evidence: ["Shared partitions", "Statistical evaluation", "Resource accounting", "Research-use governance"],
      link: "https://github.com/raybeecham/quantum-oncology-benchmark"
    },
    {
      id: "evidence-os",
      date: "August 2026",
      title: "EvidenceOS turns the portfolio into an operating environment",
      category: "platform",
      summary: "Mission selection, system graph, decision replay, research earth, architecture explorer, situation room, timeline, and terminal converge into one public experience.",
      evidence: ["Mission-based navigation", "Interactive decision systems", "Public-safe data", "Accessible static architecture"],
      link: "#mission-control"
    },
    {
      id: "future",
      date: "Next",
      title: "From portfolio to reusable public decision laboratory",
      category: "future",
      summary: "The next phase adds approved research publications, stable releases, mission-specific evidence packs, and reproducible public demonstrations.",
      evidence: ["TDAF 1.0", "Quantum Workload Advisor", "Public research briefs", "Validated system releases"],
      link: "#contact"
    }
  ];

  const researchFeed = [
    { type: "STANDARD", tone: "cyan", text: "PQC standards are an input to migration. Inventory and ownership determine execution." },
    { type: "THREAT", tone: "red", text: "Long-lived confidentiality creates harvest-now-decrypt-later exposure before a cryptographically relevant quantum computer exists." },
    { type: "METHOD", tone: "violet", text: "A technology decision should preserve admitted evidence, quarantined claims, rule outcomes, and unknowns." },
    { type: "QUANTUM", tone: "lime", text: "Architecture fit depends on workload interaction, routing, native operations, error provenance, and the classical champion." },
    { type: "CONTROL", tone: "amber", text: "Automation accelerates analysis. Accountable authority remains human." }
  ];

  window.EvidenceOSData = Object.freeze({
    systems,
    edges,
    missions,
    decisionScenarios,
    earthMarkers,
    quantumArchitectures,
    timeline,
    researchFeed
  });
})();
