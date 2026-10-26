# Crypto self-scan

Weekly cryptographic inventory of my own public repositories, produced with [crypto-inventory-demo](https://github.com/raybeecham/crypto-inventory-demo) (CodeQL for Python plus a TLS configuration scan). Last scan: **Oct 26, 2026**.

- Repositories scanned: **9**
- Findings: **41**
- PQC status: SAFE 40 · NOT_SAFE 0 · UNKNOWN 1
- Harvest-now-decrypt-later exposure: 0

Coverage limits: Python source and text configuration only. JavaScript, TypeScript, Java builds, dependencies, and runtime traffic are not scanned here, so an empty row means "nothing found in scanned files", not "no cryptography". The scanner's own repository is excluded because it ships intentionally weak fixtures.

| Repository | Findings | Most common |
|---|---:|---|
| [Chrono](https://github.com/raybeecham/Chrono) | 0 | — |
| [claude-certified-associate-foundations](https://github.com/raybeecham/claude-certified-associate-foundations) | 0 | — |
| [MEnGPT](https://github.com/raybeecham/MEnGPT) | 0 | — |
| [modern-practical-pki](https://github.com/raybeecham/modern-practical-pki) | 0 | — |
| [pqc-readiness-war-room](https://github.com/raybeecham/pqc-readiness-war-room) | 0 | — |
| [quantum-oncology-benchmark](https://github.com/raybeecham/quantum-oncology-benchmark) | 3 | SHA-256 ×3 |
| [quantum-research-scout](https://github.com/raybeecham/quantum-research-scout) | 38 | SHA-256 ×37 · SHA-1 ×1 |
| [raybeecham](https://github.com/raybeecham/raybeecham) | 0 | — |
| [Test_2](https://github.com/raybeecham/Test_2) | 0 | — |

## Findings

| Repository | Location | Algorithm | Risk | PQC | Reason |
|---|---|---|---|---|---|
| quantum-oncology-benchmark | [src/quantum_oncology_benchmark/evolution_cohort.py:31](https://github.com/raybeecham/quantum-oncology-benchmark/blob/HEAD/src/quantum_oncology_benchmark/evolution_cohort.py#L31) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-oncology-benchmark | [src/quantum_oncology_benchmark/evolution_reporting.py:17](https://github.com/raybeecham/quantum-oncology-benchmark/blob/HEAD/src/quantum_oncology_benchmark/evolution_reporting.py#L17) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-oncology-benchmark | [src/quantum_oncology_benchmark/quantum_execution.py:317](https://github.com/raybeecham/quantum-oncology-benchmark/blob/HEAD/src/quantum_oncology_benchmark/quantum_execution.py#L317) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:101](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L101) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:108](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L108) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:204](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L204) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:263](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L263) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:624](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L624) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:680](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L680) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:767](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L767) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:814](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L814) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/amendment_intelligence.py:818](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/amendment_intelligence.py#L818) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/briefing.py:332](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/briefing.py#L332) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/claim_ledger.py:459](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/claim_ledger.py#L459) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/claim_ledger.py:865](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/claim_ledger.py#L865) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/claim_ledger.py:1039](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/claim_ledger.py#L1039) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/claim_ledger.py:1129](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/claim_ledger.py#L1129) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/claim_ledger.py:1153](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/claim_ledger.py#L1153) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/decision_center.py:529](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/decision_center.py#L529) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/evidence_review.py:180](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/evidence_review.py#L180) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/news_intelligence.py:940](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/news_intelligence.py#L940) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/news_intelligence.py:989](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/news_intelligence.py#L989) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/news_intelligence.py:1316](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/news_intelligence.py#L1316) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/procurement_intelligence.py:295](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/procurement_intelligence.py#L295) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/procurement_intelligence.py:788](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/procurement_intelligence.py#L788) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/procurement_intelligence.py:1211](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/procurement_intelligence.py#L1211) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/publication.py:26](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/publication.py#L26) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/publication.py:47](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/publication.py#L47) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/scoring_calibration.py:653](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/scoring_calibration.py#L653) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/scoring_calibration.py:1034](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/scoring_calibration.py#L1034) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/story_archive.py:105](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/story_archive.py#L105) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/story_archive.py:138](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/story_archive.py#L138) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/story_archive.py:154](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/story_archive.py#L154) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/story_archive.py:350](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/story_archive.py#L350) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/story_follow.py:159](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/story_follow.py#L159) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/strategic_forecasts.py:825](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/strategic_forecasts.py#L825) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [pqc_quantum_research_agent/text.py:41](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/pqc_quantum_research_agent/text.py#L41) | SHA-1 | HIGH | UNKNOWN | Broken hash |
| quantum-research-scout | [scripts/build_dashboard.py:321](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/scripts/build_dashboard.py#L321) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [scripts/report_schedule.py:75](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/scripts/report_schedule.py#L75) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [scripts/report_schedule.py:131](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/scripts/report_schedule.py#L131) | SHA-256 | LOW | SAFE | Modern hash |
| quantum-research-scout | [scripts/sync_feed_issues.py:20](https://github.com/raybeecham/quantum-research-scout/blob/HEAD/scripts/sync_feed_issues.py#L20) | SHA-256 | LOW | SAFE | Modern hash |
