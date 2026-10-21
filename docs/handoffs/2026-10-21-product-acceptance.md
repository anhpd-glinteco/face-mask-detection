# Product acceptance — 21/10/2026

Nhánh `test/product-acceptance`, base `docs/p12-report-template` tại `699fcf5`.
Chi tiết: [acceptance matrix](../product-acceptance.md). Không merge/deploy,
chỉnh báo cáo P12, train hoặc phát hành weights/media. Deployment gate CLOSED.

## Kết quả

- Tạo worktree và inference venv mới trên D:, cài từ dependency manifests.
  Fresh dependencies trên cùng host, không phải clean machine/independent setup.
- Thêm E2E opt-in ảnh với checkpoint thật: không route interception; identity,
  bbox/class map, UI labels/confidence và canvas sau desktop/mobile resize.
  Giữ public API/schema 1.0 và production code/dependencies/model/split/threshold.
- PASS: 81 frontend tests; typecheck/lint; 4 fixture E2E; 24 backend tests;
  3 benchmark self-checks; pip check; production build; 2 real-checkpoint browser
  tests; actual API 413/415/422; native missing-model/CORS/UI smoke 1 test.
- Docker Desktop khởi động lỗi inference manager/socket; engine info/status timeout.
  Local Compose NOT_RUN, không factory reset hay đụng Docker storage/distro.
- npm audit báo 12 high/1 critical packages, chưa chứng minh exploitability;
  không tự nâng dependencies hoặc chạy audit fix để che finding.

## GitHub reconciliation

13 issues mở đầu phiên được đối chiếu từng DoD trong acceptance matrix.
#6/#10/#11/#14 đủ evidence plumbing/integration để đóng sau khi PR và CI HEAD
cuối được xác nhận; không đóng các issue đòi hosted/camera/quyền dữ liệu.

Task mới, đã kiểm tra trùng trước khi tạo:
- #42: threshold validation và uncertain đã có trong yêu cầu, chưa triển khai.
- #43: camera vật lý và rehearsal, liên kết #24/#27.
- #44: quality improvement/gate, phụ thuộc #2/#3, tách khỏi phép đo baseline #9.
- #45: Docker startup/socket và Compose local; không thay #22 hosted preview.
- #46: dependencies security, audit trước/sau và regression.

Thứ tự tiếp theo: #46 → #45 → #42; #43 cần thao tác thiết bị/quyền của người dùng;
#44 cần xử lý data/quality với protocol validation trước, không tuning test.
#2/#3/#20/#22/#23/#24/#25/#26/#27 giữ OPEN với phần việc còn thiếu.

## Evidence và trạng thái cuối

`D:\Codex\outputs\face-mask-detection\product-acceptance-2026-10-21` chứa logs,
check JSON, pip freeze, audit, API response/boundaries, task bodies/URLs,
HTML/attachments trong `integration-receipts`, driver và manifest SHA-256.
Lượt integration đầu PASS; lượt thứ hai giữ riêng receipts trước khi Playwright
ghi đè report mặc định. Không gọi các lượt này là performance benchmark mới.

Draft [PR #47](https://github.com/anhpd-glinteco/face-mask-detection/pull/47)
nhắm nhánh tiền nhiệm `docs/p12-report-template`; liên kết CI và trạng thái issues cuối phiên
được lưu trong `final-state.json` của evidence root và comments issues.
GitHub app cần reauthentication; dùng gh đã xác thực làm fallback.

Source gốc giữ nguyên `AGENTS.md` dirty, SHA-256
`b8cce059b0616eab2a249c7c2c15ac4b92939b1982183107a3848edc4e390a52`.
Worktree task phải sạch sau commit; services chỉ dừng process thuộc driver.
Rollback bằng revert commit task, giữ nguyên evidence và artifacts cũ.

NOT_RUN: camera thật, độc lập review sản phẩm/setup, clean machine, fresh ML env,
Firefox/WebKit, train/quality evaluation/benchmark lại, container/hosted HTTPS/rollback.
Review báo cáo độc lập trước đó không thay product review hoặc nghiệm thu camera.
