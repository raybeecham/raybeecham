# EvidenceOS Timeline Alignment

This temporary review note documents the final timeline-rail correction.

The timeline uses one local marker-center coordinate for every milestone. Each milestone except the final item draws its own connector segment from its marker center to the next marker center. The final `Next` milestone has no outgoing connector and uses a terminal glow.

The review branch removes the one-time wiring script before commit. This note can be removed after the alignment is accepted.
