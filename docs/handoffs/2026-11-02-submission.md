# Submission update 02 November 2026

Branch `docs/submission-ready-2026-11`, based on `docs/use-case-tooling` (`a2cc3f5`).
User authorized completing the submission plan, student/class details, and weekly
planning/minutes. Existing user edits in `AGENTS.md` remain excluded.

## Deliverables and evidence

- Edited report source in `docs/report/p12-template/bao-cao.md`; original artifacts retained.
  Cover uses the four MSSV and class `DACN_20261IT6150003` supplied in screenshots.
  Work allocations are attributed to the group plan, not verified individual commit authorship.
  Training year remains unconfirmed and visible as such.
- Latest report: `D:/Codex/outputs/face-mask-detection/submission-2026-11-02/final-report-v2`.
  Word/verifier PASS: **39 pages, 6 figures, 27 tables, 81 list entries, 15 preserved parts**;
  P4/P11 metrics and historical P12 artifact hashes unchanged. No independent review.
- Program-link DOCX/TXT source: `docs/report/program-link.md`. Runtime source is
  PR #49 at `a341b6bdc101b09d89fddb713d1158bdf28ab32f`, not this docs branch.
- Actual laptop camera: USB2.0 HD UVC WebCam, 640×480, source configured at 30 FPS,
  60.39-second run. Permission denial/regrant, stop, restart and mode-switch track
  cleanup PASS. HTTP webcam p95 **1,390.75 ms** (63 successful requests including
  restart), above 1,000 ms budget. No physical-camera media saved.
  Video 60-second check/pause/seek/resume PASS; later 5-request smoke p95
  **1,266.98 ms** FAIL. Keep failed runs, aborts and harness errors as evidence.
  Physical unplug/LED observation NOT_RUN; model accuracy not re-evaluated.
- Runtime tests recorded in previous session: frontend PR #49 **85 PASS**, backend
  **24 PASS**. Initial docs-branch frontend run had 1 timeout/80 pass while concurrent
  heavy checks ran; do not replace that failed log. Production PR #49 build PASS.

Evidence root: `D:/Codex/outputs/face-mask-detection/submission-2026-11-02/verification`.
`acceptance-summary.json` describes PARTIAL acceptance; raw `run-4/acceptance.json`
correctly remains FAIL_OR_BLOCKED because latency assertions failed.

## Two Google Sheets

The original Sheets returned 403 for writes; authenticated Chrome independently
showed **Chỉ xem**. Created editable whole-workbook copies in the current user's
My Drive root and updated those copies, not the original URLs:

- Plan: https://docs.google.com/spreadsheets/d/1oqtgZ7-IMhwGi7J_91NJTRlElYoKN0nsLXfhNjGWtcM/edit
- Minutes: https://docs.google.com/spreadsheets/d/1ox-ZCbwozmfNebATVrNy-2udFGAGnNV9AMOC2uZtixo/edit

Readback verified **186 authored cells** (51 plan, 135 minutes). All seven weekly
percent cells contain numeric 1 formatted as 100%; status and notes explicitly
identify completed weekly records, not full product acceptance. Preserve open
data/model/deployment issues. Minutes include week-by-week tasks, outputs, sources,
balanced draft chair/secretary allocation and reconstructed times near 22:00
(±1.5 hours) requested by the user. These are marked reconstructed/draft, not proof
of attendance, actual statements or signatures. No fabricated signatures.

Screenshots: `plan-updated.png`, `minutes-updated.png`, `minutes-detail-updated.png`.
`sheets-verified.json` contains write receipts and exact readbacks. Rows were
auto-resized only in authored table ranges to avoid clipping; other formatting retained.

## Remaining work

Deadline 08/11; internal target 05/11. User chose submission first, postponing
model improvement #44. Keep #26/#27 open: training year/meeting confirmation,
new report/slide review and recorded video demo are not complete. Keep #43 open
for full physical-device/LED and performance acceptance, #24/#25 open for full DoD.
No merge, deploy, checkpoint publication, model tuning or Docker repair.
Deployment gate **CLOSED**.

Published draft PR [#53](https://github.com/anhpd-glinteco/face-mask-detection/pull/53),
base `docs/use-case-tooling`. All 39 final report pages and both program-document
pages were rendered and visually reviewed. Submission filenames are
`DACN_1_BaoCao_v1.docx/.pdf` and `DACN_1_ChuongTrinh.docx/.pdf/.txt` in the output root.

First CI run `41384909346`: inference, ML, E2E and Compose PASS; web FAIL during
Turbopack's Google-font module resolution (`@vercel/turbopack-next/internal/font/google/font`).
No product/dependency change was made. A single failed-job rerun was requested;
current outcome and exact remote head are retained in `verification/final-state.json`.
Issues #26 and #43 received evidence/limitations comments and remain OPEN.
Task paths are committed/pushed; the only expected dirty file is the user's `AGENTS.md`.
