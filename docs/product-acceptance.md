# Product acceptance — 21/10/2026

Phiên này kiểm chứng sản phẩm, không biên tập báo cáo P12. Source nền `699fcf5`,
nhánh `test/product-acceptance` từ `docs/p12-report-template`. Deployment gate
**CLOSED**; không merge/deploy, train, thay threshold/split hay phát hành media/weights.

## Kiểm chứng setup và integration

Worktree mới: `D:\Codex\work\face-mask-detection\product-acceptance-2026-10-21`.
Venv mới: `D:\Codex\work\face-mask-detection\product-acceptance-venv`.
Đã tạo venv Python 3.12 và cài `services/inference/requirements.txt`; `npm ci`
trong frontend chưa có node_modules. Dùng runtime Node 24.19.0, Python và cache
download/Chromium sẵn trên máy; đây là **fresh dependencies trên cùng máy Windows**,
không phải máy sạch hoặc người khác cài độc lập. CI dùng Node 22.

| Check | Kết quả | Giới hạn |
|---|---|---|
| npm ci; pip install -r requirements.txt; pip check | PASS, exit 0 | npm audit có cảnh báo bảo mật, không suy ra dependencies an toàn |
| Frontend unit/typecheck/lint | 81 tests PASS; typecheck/lint exit 0 | Fixture/component checks |
| Default production-browser suite | 4 tests PASS, desktop/mobile | Synthetic media và camera giả; có build production |
| Inference pytest | 24 PASS, 1 Starlette/httpx deprecation warning | Synthetic checkpoint/output trong tests |
| Benchmark self-checks | 3 PASS | Không đo lại benchmark hiệu năng |
| Browser → API → P4 checkpoint thật | 2 tests PASS, desktop/mobile | PNG synthetic không mặt, không đo chất lượng |
| Actual API boundaries | PASS: 413/415/422 | Quá lớn, MIME không hỗ trợ, không decode được |
| Native missing-model smoke | 1 PASS | Health/web 200, ready/detect 503, CORS và UI; không phải Compose |
| Docker engine / local Compose | BLOCKED / NOT_RUN | Desktop lỗi inference-manager trước khi engine chạy |

Test mới `real-model.spec.js` bật bằng `E2E_REAL_MODEL=1`; API được khởi động
riêng với checksum mong đợi. Không intercept route. Test kiểm model identity,
dimensions, bbox hữu hạn trong ảnh, class map, confidence/timing, từng nhãn và
confidence trên UI, canvas có pixel sau resize desktop/mobile. JSON response
được attach vào Playwright report; shared JSON Schema còn được validate trên
response API thật bởi driver. Test không khẳng định các bbox đúng về ngữ nghĩa.

Checkpoint P4 giữ SHA-256
`1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
Empty detections được kiểm qua backend deterministic output và browser fixture;
không ép checkpoint thật trả empty để tạo bằng chứng giả. Các lỗi timeout/network,
invalid response/retry và lifecycle tiếp tục được kiểm bởi suite sẵn có.
API/schema public, code sản phẩm, dependencies, dataset và weights không đổi.

## Đối chiếu 14 issues đang mở đầu phiên

Đóng #6/#10/#11/#14 chỉ sau PR, CI HEAD cuối và ghi evidence/giới hạn vào issue.
Các hàng khác giữ OPEN; không hạ tiêu chí hosted thành local để đóng issue.

| Issue | Kết luận đối chiếu DoD | Việc còn lại / task |
|---|---|---|
| #2 | Chưa xác minh quyền từng ảnh | Bằng chứng nguồn/phạm vi sử dụng; không lặp tra cứu cũ |
| #3 | Curated/split tái lập có evidence; scene independence chưa đạt | 562 ảnh unresolved và nhóm ứng viên cần xác nhận |
| #6 | Contract/schema, fixtures, bbox và frontend/backend đã kiểm chứng | Đủ điều kiện đóng cho contract hiện có; `uncertain` tách #42 |
| #10 | Loader/cache/checksum, output bounds, load failures và checkpoint thật đạt | Đủ điều kiện đóng plumbing, không bao gồm model quality |
| #11 | Upload browser thực gọi API/checkpoint, render labels/overlay và lỗi đạt | Đủ điều kiện đóng integration nội bộ |
| #14 | Fixture hợp lệ/empty/error/oversize + API boundaries và browser checkpoint đạt | Đủ điều kiện đóng suite upload ảnh, không phải accuracy acceptance |
| #20 | P10/P11 có raw cold/warm/memory/error số đo local | Chưa đo hosted preview; không đóng |
| #22 | CI và Compose mặc định có evidence CI trước đó | Thiếu HTTPS/rollback/log hosted; #44/#46 trước public preview |
| #23 | Có báo cáo và quyết định gate CLOSED | Chưa có số đo/hosting decision trên preview |
| #24 | Regression nội bộ có evidence và lỗi video đã sửa | Camera thật #43, hosted regression; gap yêu cầu #42, Docker #45, audit #46 |
| #25 | README/cards/test report có evidence; setup dependencies mới đạt | Setup độc lập, quyền dữ liệu, container/hosted còn thiếu |
| #26 | DOCX/PDF và slide đã có; báo cáo được review | Thông tin nhóm và review slide; không chỉnh tiếp trong phiên này |
| #27 | Chưa có video/rehearsal cuối | Camera/rehearsal #43 và demo fallback; không coi synthetic suite là video demo |

## Task mới và ưu tiên

1. [#46](https://github.com/anhpd-glinteco/face-mask-detection/issues/46): xử lý npm audit
   (12 high, 1 critical theo audit). Next 16.3.5 bị audit nêu advisory RCE next/og;
   đây là dependency finding, chưa chứng minh exploitability của app.
2. [#45](https://github.com/anhpd-glinteco/face-mask-detection/issues/45): sửa Docker
   Desktop inference-manager startup, giữ nguyên images/volumes/WSL.
3. [#42](https://github.com/anhpd-glinteco/face-mask-detection/issues/42): threshold
   validation và trạng thái uncertain đồng bộ ba luồng, không thêm lớp train.
4. [#43](https://github.com/anhpd-glinteco/face-mask-detection/issues/43): camera vật lý
   và rehearsal, cần thao tác quyền/thiết bị và consent nếu quay mặt.
5. [#44](https://github.com/anhpd-glinteco/face-mask-detection/issues/44): cải thiện và
   nghiệm thu chất lượng model, liên kết #2/#3; không tự đổi split hoặc tuning test.

Các task mới có DoD, phụ thuộc, cách kiểm chứng và giới hạn riêng; không thay thế
issue cha. Không tạo thêm task provenance/hosted/report trùng những issue đã có.

## Evidence và tái lập

Evidence root: `D:\Codex\outputs\face-mask-detection\product-acceptance-2026-10-21`.
`acceptance_driver.py` lưu tại đây để tái lập kiểm tra Windows, không là tooling
sản phẩm. Các mode `web`, `backend`, `integration` dùng paths được ghi trong script;
chỉ chạy integration khi 8000/3000/3109 rảnh, với checkpoint nội bộ đúng checksum.
Lệnh chạy: `<fresh-venv>\Scripts\python.exe -X utf8 <evidence>\acceptance_driver.py <mode>`.

`*-install.log`, `npm-ci.log`, `pip-freeze.log`, từng check JSON/log và
`integration-receipts` lưu exit codes/commands, API responses và browser reports.
Lượt integration đầu cũng PASS; lượt thứ hai chỉ bổ sung lưu trữ HTML/attachments
riêng trước khi suite tiếp theo ghi đè thư mục Playwright mặc định. Không gộp hai
lượt thành benchmark. `artifact-manifest.json` ghi hash; `final-state.json` lưu
remote/PR/CI/issues/working trees và ports sau kết phiên.

Docker host log cho biết không remove/listen được socket `Docker/run/dockerInference`
(`The file cannot be accessed by the system`, invalid filename syntax).
`docker info`/`docker desktop status` timeout 20s; bản trích lỗi lưu riêng.
Không factory reset, xóa socket/storage/distro, nâng cấp Docker hoặc chạy container.

NOT_RUN: camera vật lý, clean machine/independent setup, fresh ML environment,
Firefox/WebKit, quality evaluation/train/benchmark lại, HTTPS/hosted rollback,
independent product review. Chất lượng P4 và quyền dữ liệu vẫn chặn public preview.
