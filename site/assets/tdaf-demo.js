/* Deterministic public TDAF walkthrough. */

(function () {
  "use strict";
  var root = document.getElementById("tdafRoot");
  if (!root) return;

  var EVIDENCE = [
    {
      id: "EV-001", title: "NSA public guidance on QKD for NSS",
      source: "NSA.gov, Quantum Key Distribution and Quantum Cryptography guidance",
      cls: "authoritative_guidance",
      note: "States QKD is not recommended for securing national security systems; recommends quantum-resistant (PQC) algorithms instead.",
      tags: ["guidance_disfavors_candidate", "alternative_endorsed"],
      admissible: true, defaultAdmitted: true
    },
    {
      id: "EV-002", title: "CNSA 2.0 migration timeline",
      source: "NSA CNSA 2.0 advisory and FAQ",
      cls: "authoritative_guidance",
      note: "Establishes ML-KEM based key establishment as the approved direction and phased timeline for NSS.",
      tags: ["alternative_endorsed", "timeline_defined"],
      admissible: true, defaultAdmitted: true
    },
    {
      id: "EV-003", title: "Vendor whitepaper: QKD product maturity claims",
      source: "Vendor marketing publication, no independent verification",
      cls: "vendor_claim",
      note: "Fails admission: capability claims without independent test evidence are quarantined by policy, not rebutted.",
      tags: ["capability_claim_unverified"],
      admissible: false, defaultAdmitted: false
    },
    {
      id: "EV-004", title: "Peer-reviewed QKD field trial",
      source: "Refereed journal, metropolitan fiber testbed",
      cls: "independent_study",
      note: "Demonstrates link-layer key exchange in a bounded environment. Scope limitation recorded: no authentication solution, no satellite free-space result at mission scale.",
      tags: ["capability_demonstrated_bounded"],
      admissible: true, defaultAdmitted: true
    },
    {
      id: "EV-005", title: "Program asset inventory: 25+ year data lifetime",
      source: "Internal CBOM and data classification review",
      cls: "internal_finding",
      note: "Confirms harvest-now-decrypt-later exposure. Establishes mission need for quantum-resistant protection on this link.",
      tags: ["mission_need_confirmed", "hndl_exposure"],
      admissible: true, defaultAdmitted: true
    }
  ];

  var RULES = [
    {
      id: "R1",
      text: "If admitted authoritative guidance disfavors the candidate technology for this mission class, disposition cannot be ADOPT.",
      test: function (adm) { return adm.some(function (e) { return e.tags.indexOf("guidance_disfavors_candidate") >= 0; }); }
    },
    {
      id: "R2",
      text: "If mission need is confirmed and an endorsed alternative exists in admitted evidence, recommend the alternative path.",
      test: function (adm) {
        var need = adm.some(function (e) { return e.tags.indexOf("mission_need_confirmed") >= 0; });
        var alt = adm.some(function (e) { return e.tags.indexOf("alternative_endorsed") >= 0; });
        return need && alt;
      }
    },
    {
      id: "R3",
      text: "If fewer than three admitted evidence items support the context, flag INSUFFICIENT EVIDENCE and stop.",
      test: function (adm) { return adm.length < 3; }
    },
    {
      id: "R4",
      text: "Quarantined or vendor-only claims never satisfy a capability requirement. Quarantine is recorded, not silently dropped.",
      test: function () { return EVIDENCE.some(function (e) { return !e.admissible; }); }
    }
  ];

  var admitted = {};
  EVIDENCE.forEach(function (e) { admitted[e.id] = e.defaultAdmitted; });

  var evEl = root.querySelector("#tdafEvidence");
  var rulesEl = root.querySelector("#tdafRules");
  var recordEl = root.querySelector("#tdafRecord");
  var dispEl = root.querySelector("#tdafDisposition");
  var dispTextEl = root.querySelector("#tdafDispositionText");
  var pipelineEl = root.querySelector("#tdafPipeline");

  function evaluate() {
    var adm = EVIDENCE.filter(function (e) { return e.admissible && admitted[e.id]; });
    var quarantined = EVIDENCE.filter(function (e) { return !e.admissible || !admitted[e.id]; });

    var fired = {};
    RULES.forEach(function (r) { fired[r.id] = r.test(adm); });

    var disposition, kind, rationale;
    if (fired.R3) {
      disposition = "INSUFFICIENT EVIDENCE: DO NOT PROCEED TO SELECTION";
      kind = "insufficient";
      rationale = "Admitted evidence fell below the minimum admission threshold (R3). The framework stops rather than infers.";
    } else if (fired.R1 && fired.R2) {
      disposition = "DO NOT CONSIDER CANDIDATE: PROCEED WITH ENDORSED ALTERNATIVE (HYBRID ML-KEM PATH)";
      kind = "alt";
      rationale = "Authoritative guidance disfavors the candidate for this mission class (R1) while mission need and an endorsed alternative are both established (R2).";
    } else if (fired.R1) {
      disposition = "CANDIDATE BLOCKED FOR THIS MISSION CLASS: ALTERNATIVE NOT YET ESTABLISHED IN ADMITTED EVIDENCE";
      kind = "blocked";
      rationale = "R1 fired without R2: the endorsed alternative or mission need is missing from admitted evidence, so no forward path is asserted.";
    } else if (fired.R2) {
      disposition = "CONDITIONAL: MISSION NEED AND ALTERNATIVE ESTABLISHED, CANDIDATE NOT EXCLUDED BY ADMITTED GUIDANCE";
      kind = "conditional";
      rationale = "With authoritative guidance removed from admission, the rulebook cannot exclude the candidate. Note what changed: the evidence set, not the rules.";
    } else {
      disposition = "NO DETERMINATION: RULE CONDITIONS UNMET ON ADMITTED EVIDENCE";
      kind = "insufficient";
      rationale = "No rule producing a disposition fired. Unknowns remain unknowns.";
    }

    var unknowns = [
      "QKD authentication approach at mission scale (no admitted evidence)",
      "Free-space satellite QKD performance under operational conditions (no admitted evidence)"
    ];
    if (!adm.some(function (e) { return e.tags.indexOf("mission_need_confirmed") >= 0; })) {
      unknowns.push("Mission data lifetime and HNDL exposure (evidence not admitted)");
    }

    var record = {
      record_id: "TDAF-DEMO-QKD-GROUNDLINK",
      schema: "tdaf.decision-record/0.3-public-demo",
      generated: "deterministic (no timestamp: identical inputs yield identical records)",
      decision_context: {
        question: "Consider QKD for long-lived satellite ground-link vs planned PQC migration",
        mission_class: "national_security_system",
        data_lifetime_years: "25+"
      },
      evidence_admitted: adm.map(function (e) { return { id: e.id, class: e.cls, source: e.source }; }),
      evidence_quarantined: quarantined.map(function (e) {
        return { id: e.id, class: e.cls, reason: e.admissible ? "manually excluded in this run" : "fails admission policy: unverified vendor claim" };
      }),
      rules_evaluated: RULES.map(function (r) { return { id: r.id, fired: fired[r.id] }; }),
      disposition: disposition,
      rationale: rationale,
      assumptions: ["Public guidance documents are current as of record generation", "Asset inventory classification is accurate"],
      unknowns_preserved: unknowns,
      accountable_owner: "REQUIRED: UNASSIGNED (authority is not inherited by this system)"
    };

    render(fired, record, disposition, kind);
  }

  function render(fired, record, disposition, kind) {
    evEl.innerHTML = "";
    EVIDENCE.forEach(function (e) {
      var isAdmitted = e.admissible && admitted[e.id];
      var card = document.createElement("div");
      card.className = "tdaf-card";
      card.dataset.state = isAdmitted ? "admitted" : "quarantined";

      var top = document.createElement("div");
      top.className = "tdaf-card-top";

      var left = document.createElement("div");
      var title = document.createElement("p");
      title.className = "tdaf-card-title";
      title.textContent = e.id + " \u00b7 " + e.title;
      var meta = document.createElement("p");
      meta.className = "tdaf-card-meta";
      meta.textContent = e.cls + " \u00b7 " + e.source;
      left.appendChild(title); left.appendChild(meta);

      var right = document.createElement("div");
      right.style.display = "flex"; right.style.flexDirection = "column";
      right.style.alignItems = "flex-end"; right.style.gap = "6px";

      var badge = document.createElement("span");
      badge.className = "tdaf-badge " + (isAdmitted ? "admitted" : "quarantined");
      badge.textContent = isAdmitted ? "ADMITTED" : "QUARANTINED";
      right.appendChild(badge);

      if (e.admissible) {
        var btn = document.createElement("button");
        btn.className = "tdaf-toggle"; btn.type = "button";
        btn.textContent = isAdmitted ? "Exclude" : "Admit";
        btn.setAttribute("aria-pressed", String(isAdmitted));
        btn.setAttribute("aria-label", (isAdmitted ? "Exclude " : "Admit ") + e.id);
        btn.addEventListener("click", function () { admitted[e.id] = !admitted[e.id]; evaluate(); });
        right.appendChild(btn);
      } else {
        var locked = document.createElement("span");
        locked.className = "tdaf-card-meta";
        locked.textContent = "policy lock";
        right.appendChild(locked);
      }

      top.appendChild(left); top.appendChild(right);
      card.appendChild(top);

      var note = document.createElement("p");
      note.className = "tdaf-card-note";
      note.textContent = e.note;
      card.appendChild(note);

      evEl.appendChild(card);
    });

    rulesEl.innerHTML = "";
    RULES.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "tdaf-rule" + (fired[r.id] ? " fired" : "");
      var rid = document.createElement("span");
      rid.className = "tdaf-rule-id"; rid.textContent = r.id;
      var txt = document.createElement("span"); txt.textContent = r.text;
      var chip = document.createElement("span");
      chip.className = "tdaf-rule-fire"; chip.textContent = fired[r.id] ? "FIRED" : "idle";
      row.appendChild(rid); row.appendChild(txt); row.appendChild(chip);
      rulesEl.appendChild(row);
    });

    dispEl.dataset.kind = kind;
    dispTextEl.textContent = disposition;
    recordEl.textContent = JSON.stringify(record, null, 2);

    var stages = pipelineEl.querySelectorAll(".tdaf-stage");
    stages.forEach(function (s, i) {
      s.classList.remove("active", "done");
      if (i < stages.length - 1) s.classList.add("done"); else s.classList.add("active");
    });
  }

  var copyBtn = root.querySelector("#tdafCopy");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var btn = this;
      var text = recordEl.textContent;
      function ok() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy record JSON"; }, 1400); }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, ok); } else { ok(); }
    });
  }

  var resetBtn = root.querySelector("#tdafReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      EVIDENCE.forEach(function (e) { admitted[e.id] = e.defaultAdmitted; });
      evaluate();
    });
  }

  evaluate();
})();
