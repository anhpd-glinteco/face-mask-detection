# Browser regression fixtures

Run from `apps/web` (Node 22):

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

The runner builds production with `NEXT_PUBLIC_INFERENCE_API_URL=http://localhost:8000`
and starts port 3109 itself. No API server or model is needed for fixture tests.
Chromium runs desktop 1440×1000 and mobile 390×844, DPR1. The suite reuses the
P6–P8 browser checks: image response/resize/errors, serial video/webcam sampling,
busy opportunities, stale responses, permission retry and camera cleanup.
PNG images are created in browser canvas. `fixtures/landscape.webm` is the
320×240 face-free synthetic P8 video; it contains no dataset or camera footage.
Camera tests replace `getUserMedia` with a video-backed `captureStream` and
injected permission errors. They do not exercise physical camera permission.

Compose smoke uses the real services with **no weights** and no route interception:

```sh
# Repository root; requires a running Docker engine and ports 3000/8000 free
docker compose up --build --wait --wait-timeout 120
cd apps/web
# PowerShell: $env:E2E_COMPOSE='1'
E2E_COMPOSE=1 npm run test:e2e
```

Unset `E2E_COMPOSE` before running fixture tests again. From the repository root,
capture `docker compose logs --no-color`, then run
`docker compose down --volumes --remove-orphans` even if the test fails.
Compose tests assert web/health 200, ready/detect 503, allowed/denied CORS origins,
and an actual browser upload receiving the model-unavailable message.
Health checks prove process availability, not model readiness.

CI runs fixture and Compose jobs separately. HTML reports are in
`playwright-report`; `test-results` contains per-test fixture results/screenshots
and retained failure traces. CI uploads both and Compose startup/state logs.
Use `npx playwright show-report` to inspect the report.
For downloads on D: in PowerShell, set
`$env:PLAYWRIGHT_BROWSERS_PATH='D:\Codex\downloads\face-mask-detection\playwright'`
before **both** browser installation and test execution.

No real model, camera hardware, model-quality measurement, performance benchmark,
Firefox/WebKit or public deployment is covered by this suite.
