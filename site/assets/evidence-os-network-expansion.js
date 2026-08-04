(() => {
  "use strict";

  const data = window.EvidenceOSData;
  if (!data?.earthMarkers) return;

  const additionalMarkers = [
    {
      id: "iso-sc27",
      name: "ISO/IEC JTC 1/SC 27",
      location: "Geneva, Switzerland",
      lat: 46.2044,
      lon: 6.1432,
      category: "standards",
      relevance: "International standards work spanning information security, cybersecurity, privacy, cryptographic techniques, and related controls.",
      link: "https://www.iso.org/committee/45306.html"
    },
    {
      id: "irtf-cfrg",
      name: "IRTF Crypto Forum Research Group",
      location: "Global standards community",
      lat: 8.0,
      lon: 18.0,
      category: "standards",
      relevance: "Open cryptographic research and review that informs protocol design, implementation choices, and emerging algorithm use.",
      link: "https://datatracker.ietf.org/rg/cfrg/about/"
    },
    {
      id: "pqca",
      name: "Post-Quantum Cryptography Alliance",
      location: "Global open-source ecosystem",
      lat: 37.7749,
      lon: -122.4194,
      category: "security",
      relevance: "Collaborative open-source implementation, evaluation, tooling, and adoption work for standardized post-quantum cryptography.",
      link: "https://pqca.org/"
    },
    {
      id: "openssl",
      name: "OpenSSL Project",
      location: "Global open-source ecosystem",
      lat: 31.0,
      lon: -11.0,
      category: "security",
      relevance: "Widely used cryptographic and TLS implementation ecosystem relevant to interoperability, migration testing, and production adoption paths.",
      link: "https://www.openssl.org/"
    },
    {
      id: "canada-nqs",
      name: "Canada National Quantum Strategy",
      location: "Canada",
      lat: 45.4215,
      lon: -75.6972,
      category: "government",
      relevance: "Whole-of-government strategy connecting quantum research, talent, commercialization, communications, sensing, computing, and post-quantum capability.",
      link: "https://ised-isde.canada.ca/site/national-quantum-strategy/en/canadas-national-quantum-strategy"
    },
    {
      id: "australia-nqs",
      name: "Australia National Quantum Strategy",
      location: "Australia",
      lat: -35.2809,
      lon: 149.13,
      category: "government",
      relevance: "National strategy linking research, commercialization, infrastructure, skills, international partnerships, standards, and responsible development.",
      link: "https://www.industry.gov.au/publications/national-quantum-strategy"
    },
    {
      id: "singapore-nqs",
      name: "Singapore National Quantum Strategy",
      location: "Singapore",
      lat: 1.3521,
      lon: 103.8198,
      category: "government",
      relevance: "National program coordinating research excellence, processor development, engineering capability, talent, quantum-safe networks, and industry partnerships.",
      link: "https://www.cqt.sg/national-role/"
    },
    {
      id: "uk-nqcc",
      name: "UK National Quantum Computing Centre",
      location: "Harwell, United Kingdom",
      lat: 51.577,
      lon: -1.314,
      category: "government",
      relevance: "National infrastructure supporting quantum-computing hardware, software, applications, readiness, skills, and user-community development.",
      link: "https://www.nqcc.ac.uk/"
    },
    {
      id: "mit-qmit",
      name: "MIT Quantum Initiative",
      location: "Cambridge, Massachusetts",
      lat: 42.3601,
      lon: -71.0942,
      category: "research",
      relevance: "Institute-wide quantum research spanning computing, sensing, simulation, materials, networks, systems engineering, and workforce development.",
      link: "https://quantum.mit.edu/"
    },
    {
      id: "waterloo-iqc",
      name: "Institute for Quantum Computing",
      location: "Waterloo, Canada",
      lat: 43.4723,
      lon: -80.5449,
      category: "research",
      relevance: "Multidisciplinary quantum information research spanning computation, communication, cryptography, devices, algorithms, and talent development.",
      link: "https://uwaterloo.ca/institute-for-quantum-computing/"
    },
    {
      id: "oxford-quantum-institute",
      name: "Oxford Quantum Institute",
      location: "Oxford, United Kingdom",
      lat: 51.752,
      lon: -1.2577,
      category: "research",
      relevance: "Cross-disciplinary research community connecting quantum foundations, computing, devices, photonics, applications, and broader scientific use.",
      link: "https://oqi.web.ox.ac.uk/"
    },
    {
      id: "riken-rqc",
      name: "RIKEN Center for Quantum Computing",
      location: "Wako, Japan",
      lat: 35.781,
      lon: 139.605,
      category: "research",
      relevance: "Research across superconducting, optical, semiconductor, cold-atom, software, and foundational quantum-computing approaches.",
      link: "https://www.riken.jp/en/research/labs/rqc/"
    },
    {
      id: "chicago-quantum-exchange",
      name: "Chicago Quantum Exchange",
      location: "Chicago, Illinois",
      lat: 41.7886,
      lon: -87.5987,
      category: "research",
      relevance: "Regional research consortium connecting universities, laboratories, industry, workforce development, supply chains, and discovery-to-deployment activity.",
      link: "https://chicagoquantum.org/"
    },
    {
      id: "cqt-singapore",
      name: "Centre for Quantum Technologies",
      location: "Singapore",
      lat: 1.2966,
      lon: 103.7764,
      category: "research",
      relevance: "National research centre spanning quantum computing, communication, security, sensing, processors, networking, and scientific talent development.",
      link: "https://www.cqt.sg/"
    },
    {
      id: "d-wave",
      name: "D-Wave Quantum",
      location: "Burnaby, Canada",
      lat: 49.2488,
      lon: -122.9805,
      category: "vendor",
      relevance: "Quantum annealing, hybrid optimization, embedding, sampling, and application-development ecosystem.",
      link: "https://www.dwavequantum.com/"
    },
    {
      id: "quera",
      name: "QuEra Computing",
      location: "Boston, Massachusetts",
      lat: 42.3601,
      lon: -71.0589,
      category: "vendor",
      relevance: "Neutral-atom quantum systems, programmable arrays, analog and digital execution, and application experimentation.",
      link: "https://www.quera.com/"
    },
    {
      id: "pasqal",
      name: "PASQAL",
      location: "Paris, France",
      lat: 48.8566,
      lon: 2.3522,
      category: "vendor",
      relevance: "Neutral-atom hardware, pulse-level control, analog and digital-analog methods, and enterprise-oriented application research.",
      link: "https://www.pasqal.com/"
    },
    {
      id: "xanadu",
      name: "Xanadu",
      location: "Toronto, Canada",
      lat: 43.6532,
      lon: -79.3832,
      category: "vendor",
      relevance: "Photonic quantum computing, software, differentiable programming, continuous-variable methods, and fault-tolerance research.",
      link: "https://www.xanadu.ai/"
    },
    {
      id: "psiquantum",
      name: "PsiQuantum",
      location: "Palo Alto, California",
      lat: 37.4419,
      lon: -122.143,
      category: "vendor",
      relevance: "Photonic fault-tolerant architecture, semiconductor manufacturing pathways, networking, and large-scale system engineering.",
      link: "https://www.psiquantum.com/"
    },
    {
      id: "atom-computing",
      name: "Atom Computing",
      location: "Boulder, Colorado",
      lat: 40.015,
      lon: -105.2705,
      category: "vendor",
      relevance: "Neutral-atom quantum hardware, optical control, scaling, error-correction experimentation, and cloud-accessible systems.",
      link: "https://atom-computing.com/"
    },
    {
      id: "google-quantum-ai",
      name: "Google Quantum AI",
      location: "Santa Barbara, California",
      lat: 34.4208,
      lon: -119.6982,
      category: "vendor",
      relevance: "Superconducting quantum processors, algorithms, software, benchmarking, and quantum-error-correction research.",
      link: "https://quantumai.google/"
    },
    {
      id: "q-ctrl",
      name: "Q-CTRL",
      location: "Sydney, Australia",
      lat: -33.8688,
      lon: 151.2093,
      category: "vendor",
      relevance: "Quantum control, error suppression, performance management, sensing, education, and hardware-agnostic software tooling.",
      link: "https://q-ctrl.com/"
    }
  ];

  const existing = new Set(data.earthMarkers.map((marker) => marker.id));
  additionalMarkers.forEach((marker) => {
    if (!existing.has(marker.id)) {
      data.earthMarkers.push(marker);
      existing.add(marker.id);
    }
  });
})();
