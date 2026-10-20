# P11 — regression nội bộ — 20/10/2026, Asia/Saigon

Deployment gate: **CLOSED**. Đây là regression kỹ thuật local, không phải nghiệm
thu chất lượng model, camera thật hoặc hosted preview. Sửa một race trong video
sampling và tăng kiểm tra liveness của benchmark; giữ API/schema 1.0, fixture,
dependency, dataset/split, checkpoint và threshold.

## Môi trường và evidence

- Source kiểm thử ban đầu: P10 `cd87d1d0fc972df9e2e16d94e9113c011b35ce02`;
  nhánh `test/p11-internal-regression`. Code fix và benchmark guard được commit
  tại `42a0f76`; lượt kiểm chứng model sau fix dùng đúng commit này.
- Windows 11 Home 10.0.26200; i5-13500H, 12 core/16 logical processors;
  RAM 16,794,722,304 bytes; Node 24.19.0, npm 11.17.0, Python 3.12.14,
  Chromium 156.0.8078.4 từ cache C: đã có sẵn.
  CI dùng Node 22; không coi môi trường local giống CI.
- Dùng lại `p5-venv` cho inference/benchmark và `p3-venv` cho ML, cùng web
  dependencies/Chromium đã cài. Không thực hiện clean-machine install.
- Evidence root: `D:\Codex\outputs\face-mask-detection\p11-internal-regression`.
  Mỗi check có `<name>.log` và `<name>.json` chứa command, cwd, thời điểm và exit
  code. `host.json` ghi môi trường, source SHA, checksum và dirty state ban đầu.
- `AGENTS.md` có thay đổi người dùng từ trước, giữ nguyên và không đưa vào commit.
  SHA-256 ban đầu: `b8cce059b0616eab2a249c7c2c15ac4b92939b1982183107a3848edc4e390a52`.

## Kết quả regression

| Check / evidence name | Kết quả | Phạm vi bằng chứng |
|---|---|---|
| `web-unit` | 80 tests / 6 files, exit 0, trước fix | UI/client/sampler với fixture |
| `web-unit-release` | 81 tests / 6 files, exit 0 | Có test mới tái hiện race video |
| `web-types-release`, `web-lint-release` | Exit 0, không có lint warning | TypeScript/ESLint sau fix cuối |
| `inference` | 24 tests, exit 0 | Contract/loader, weights synthetic; một Starlette/httpx deprecation warning |
| `ml` | 37 tests, exit 0 | Data/evaluation/trainer self-check, synthetic smoke; không train lại dataset |
| `benchmark-tests` | 3 tests, exit 0 | Percentile, denominator, readiness và process-tree memory |
| `browser-fixtures` | 4 tests, exit 0; 41.5 s | Ảnh/video/webcam; desktop 1440×1000 và mobile 390×844, Chromium DPR1 |
| `browser-fixtures-release` | 4 tests, exit 0; 20.3 s | Cùng suite trên code fix cuối, gồm production build |
| Production build | Đạt trong E2E và runner model thật | Next.js; log build nằm trong evidence tương ứng |
| `native-smoke` | 1 test, exit 0; browser test 4.4 s | Browser→API thật không weights, CORS và lỗi UI; **không phải container** |
| `compose-config` | Exit 0 | Chỉ xác thực Compose config |
| `docker-info`, `compose-start` | Exit 1 | Không kết nối được Docker engine; local Compose runtime chưa kiểm chứng |
| `inference-packages` | `pip check` exit 0 | Requirements môi trường inference hiện có |
| `ml-packages` | Exit 1: không có module pip | Chưa xác minh package integrity ML bằng pip; 37 ML tests vẫn đạt |
| `docs-links` | 8 tài liệu, 52 liên kết local hợp lệ; exit 0 | Không xác minh nội dung URL ngoài repo |
| `benchmark-guard-selfcheck` | Exit 0; browser cố ý exit 1 | Fault injection pause video sau 1.5 s bị guard phát hiện |

Fixture browser kiểm tra overlay/resize, empty/invalid response, 503/retry,
video/webcam sampling, lỗi, stale response và cleanup; không dùng model thật.
HTML/results ban đầu nằm trong `fixture-html`/`fixture-results`; lượt sau fix
cuối dùng `fixture-release-html`/`fixture-release-results`. Lượt trung gian
`*-final` có một hook lint warning đã sửa bằng cleanup trực tiếp trong callback;
không dùng lượt trung gian thay cho `*-release`.

Native smoke khởi động Uvicorn và production Next.js bằng process local trên
8000/3000, tái sử dụng `compose.spec.js` qua `E2E_COMPOSE=1`. Tên project/test trong
log vẫn ghi Compose do tái sử dụng selector; nguồn chạy **không có container**.
Health/web 200, ready/detect ảnh PNG hợp lệ 503; origin localhost được phép,
origin không tin cậy bị từ chối; browser hiển thị “Mô hình chưa sẵn sàng”.
`native-summary.json`, `native-{api,web}.log`, `native-html` và `native-results`
ghi bằng chứng riêng. Script điều phối local lưu ngoài repo trong
`D:\Codex\work\face-mask-detection\p11-native-smoke.py`.

## Model thật trên media synthetic

Dùng runner P10, bổ sung guard/diagnostics browser như mô tả bên dưới, giữ nguyên
cách đo HTTP/memory và percentile. Checkpoint epoch 30 tại
`D:\Codex\outputs\face-mask-detection\p3-internal\baseline-v2\checkpoint.pt`, SHA-256
`1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
Raw evidence: `real-model-run-{1,2,3}`; không ghi ảnh upload hoặc weights vào repo.

Method giữ nguyên [P10](benchmark-report.md): 5 process-cold starts, không xóa
OS cache; 100 warm API requests; ảnh PNG 320×240 và video/Webcam synthetic ít nhất
60 giây mỗi luồng. Request browser đi vào API/checkpoint thật; chỉ media/camera
source được mô phỏng. Đây không phải bộ dữ liệu workload đại diện hoặc phép đo
camera vật lý. Schema và model checksum được kiểm trên responses.

Run 1, trước fix:

| API measurement | Thành công / attempts | p50 | p95 |
|---|---:|---:|---:|
| Process-cold readiness | 5 / 5 | 6,158.10 ms | 6,166.37 ms |
| Warm API HTTP | 100 / 100 | 35.04 ms | 54.64 ms |

Warm error rate 0%; các budget tương ứng là cold ≤30 s và warm p95 ≤1 s.
Run 1 ghi `complete=true`, nhưng video chỉ có **40 frame/60.78 s (0.66 FPS)**,
UI counter dừng ở 40 sau khoảng 8 s. Vì vậy không dùng cờ complete để khẳng định
video sampling liên tục 60 s. Raw run được giữ nguyên phục vụ điều tra, không
thay bằng số đo P10 cũ. Webcam có 293 frame/60.09 s (4.88 FPS), HTTP p95 163.34 ms;
không có page error hoặc request failure. Memory không có sampling error, peak
sampled working sets API 346.61 MiB/web 101.59 MiB, page JS heap 8.14 MiB.

### Run 3 — sau fix, kết quả cuối

Runner exit 0, `complete=true`, source `42a0f76`; guard liveness bật suốt hai
streaming phases. Không có UI alert trong samples, page error hoặc unexpected
request failure. Một video request abort lúc dừng được giữ riêng trong raw data.

| Measurement | Thành công / attempts | p50 | p95 |
|---|---:|---:|---:|
| Process-cold readiness | 5 / 5 | 3,549.30 ms | 3,567.03 ms |
| Warm API HTTP | 100 / 100 | 34.50 ms | 36.89 ms |
| Browser image HTTP | 1 / 1 | 41.31 ms | 41.31 ms |
| Browser video HTTP | 296 / 296 | 36.62 ms | 41.33 ms |
| Browser synthetic webcam HTTP | 302 / 302 | 35.95 ms | 40.03 ms |

Video 60.31 s, 296 displayed snapshots, **4.91 displayed FPS**; webcam 60.37 s,
301 displayed snapshots, **4.99 displayed FPS**. Webcam HTTP có một response
thành công chưa nằm trong display samples lúc phase kết thúc; không coi HTTP
count và display count là cùng số đo. Capture-to-display estimate p50/p95:
video 72.40/89.50 ms, webcam 71.60/86.00 ms; không phải độ trễ màn hình vật lý.
Image chỉ một mẫu nên p95 không có ý nghĩa phân bố.

271 memory records, không có sampling errors; maximum sampled API process-tree
working set **356.83 MiB**, web **102.09 MiB**, page JS heap **7.96 MiB**. Working
set có thể đếm trùng shared pages; không phải private bytes hoặc tổng Chromium
memory. Poll 1 s có thể bỏ qua peak ngắn, chưa có memory budget để pass/fail.
Video counters cuối chỉ thuộc loop cuối; dùng whole-phase requests/display để
đo aggregate FPS. Các budget latency/error local đạt; không thay quality gate P4.

## Tái lập

### Lỗi video được tái hiện và sửa

Run 2 dùng guard mới và fail exit 1 thay vì báo complete: sau vòng lặp đầu,
playback vẫn chạy (`paused=false`, `loop=true`, `readyState=4`) nhưng UI giữ lỗi
“Video chưa sẵn sàng” và counter dừng ở 40. Timeline/alerts nằm trong
`real-model-run-2/browser.json`; đây là bằng chứng lỗi sản phẩm, không phải HTTP
error. Hai lượt chẩn đoán ngắn riêng không tái hiện được race, không dùng chúng
để phủ nhận failed run.

Nguyên nhân: sampler có thể quan sát trạng thái media chưa sẵn sàng trước khi
event seeking/pause dừng generation hiện tại. Nhánh này từng đi vào onError và
khóa restart, dù video đã phát lại. Fix dừng sampler trước khi reject frame,
hủy generation cũ, giải phóng snapshot và chờ onPlaying/onSeeked restart; API/decode errors thật
vẫn yêu cầu retry. Không thay shared sampler hoặc hành vi webcam.

Test `resumes after media becomes unready before the seeking event arrives`
fail trên code cũ (`video-race-red`: 1 failed/13 passed, exit 1), rồi pass trong
81 tests sau fix. Benchmark còn ghi media/alerts mỗi sample và fail nếu 5 giây
không có snapshot mới; guard này không phải budget sản phẩm mới.

Self-check guard chạy benchmark thật với preload chỉ trong lần thử, cố ý pause
video sau 1.5 s. Browser exit 1 đúng thông báo “video display stalled for 5
seconds”; sample cuối `paused=true`. Driver assert cả exit code, thông báo và
media state rồi exit 0. Evidence riêng `guard-fault-injection/{browser.json,
browser.log,summary.json}`; không đưa kết quả fault injection vào số đo performance.

### Lệnh chạy

Các lệnh dưới dùng môi trường đã cài; xem README để tạo môi trường mới.
Từ repo root, backend pytest dùng cwd `services/inference` và `$env:PYTHONPATH='.'`;
frontend dùng cwd `apps/web`.

```powershell
# apps/web; npm run test:e2e tự build production
npm test
npm run typecheck
npm run lint
npm run test:e2e

# services/inference
$env:PYTHONPATH='.'
& D:\Codex\work\face-mask-detection\p5-venv\Scripts\python.exe -m pytest tests -v

# repository root
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe -m unittest discover -s ml/tests -v
& D:\Codex\work\face-mask-detection\p5-venv\Scripts\python.exe -m unittest discover -s scripts/benchmark -v
& D:\Codex\work\face-mask-detection\p5-venv\Scripts\python.exe scripts/benchmark/run.py --checkpoint D:\Codex\outputs\face-mask-detection\p3-internal\baseline-v2\checkpoint.pt --sha256 1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74 --output D:\Codex\outputs\face-mask-detection\p11-internal-regression\real-model-run-4
docker compose config --quiet
docker compose up --build --wait --wait-timeout 120
```

Chọn output **mới, rỗng** mỗi lần benchmark; giữ nguyên run trước. Không chạy các
suite/build khác đồng thời benchmark. Ports 8000/3110 phải rảnh; runner tự dừng
process do nó tạo. Browser/Compose commands và teardown ở
[E2E README](../apps/web/e2e/README.md).

Native fallback có thể tái lập bằng hai terminal: API không đặt `MODEL_PATH`/
`MODEL_SHA256`, `ALLOWED_ORIGINS=http://localhost:3000`, chạy Uvicorn port 8000;
web build với `NEXT_PUBLIC_INFERENCE_API_URL=http://localhost:8000` rồi
`npm run start -- --port 3000`. Terminal thứ ba trong `apps/web` đặt
`$env:E2E_COMPOSE='1'` rồi `npm run test:e2e`; bỏ biến này sau smoke, dừng hai
process của lần thử. Không chạy fallback trên dịch vụ đang dùng của người khác.

## Blocker, workaround và nghiệm thu

- **Môi trường:** Docker Desktop Linux engine pipe không tồn tại
  (`//./pipe/dockerDesktopLinuxEngine`). Compose startup dừng trước khi tạo
  container. Workaround native smoke chỉ chứng minh HTTP/UI/CORS; cần Docker
  engine hoạt động để chạy lại container smoke, không dùng config exit 0 thay thế.
- **Model/data:** chất lượng P4 thấp, quyền từng ảnh và source/scene grouping chưa
  xác minh. Giữ #2/#3 và `p3_ready=false`; không điều chỉnh split/threshold để
  vượt gate. Test macro F1 0.2061/mAP50:95 0.0820 vẫn là số đo P4, không đo lại.
- **Hành vi:** ngưỡng đánh giá P4 0.15 chưa được áp dụng làm bộ lọc API/UI;
  `uncertain` chưa triển khai. API giữ score floor 0.001 và trả nhãn/confidence.
  Ghi giới hạn, không thêm tính năng trong phiên regression.
- **Chưa kiểm chứng:** camera vật lý, Firefox/WebKit, hosted HTTPS/rollback,
  clean-machine setup và review độc lập. Camera synthetic không thay thế các mục này.
- Đã phát hiện và sửa race video trên; giữ failed runs để đối chiếu. #24 giữ mở
  do thiếu preview/camera nghiệm thu; #25 giữ mở vì
  chưa kiểm chứng setup độc lập, license còn chưa chốt và deployment còn thiếu.

P11 hoàn tất phạm vi nội bộ; run thật sau fix đạt và kết quả remote/CI được ghi ở
[bàn giao](handoffs/2026-10-20-p11-internal-regression.md). Không tuyên bố đạt toàn
bộ DoD #24/#25. Bước tiếp P12 có thể dùng evidence hiện có và ghi rõ giới hạn;
nghiệm thu công khai cần xử lý riêng các blocker dữ liệu/model/deployment.
