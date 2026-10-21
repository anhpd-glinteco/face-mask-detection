# #46 — dependency security, 21/10/2026

Nhánh `fix/dependency-security` từ `test/product-acceptance` tại `29ea5bf`;
worktree `D:\Codex\work\face-mask-detection\dependency-security-2026-10-21`.
[PR #48](https://github.com/anhpd-glinteco/face-mask-detection/pull/48) đã mở
draft nhắm nhánh tiền nhiệm; không merge/deploy. Deployment gate **CLOSED**.

## Thay đổi

- Next.js/eslint-config-next 16.3.5 → 16.3.8; lockfile Vite 7.3.7,
  source-map-js 1.2.2, sharp 0.35.5 cùng binary/libvips tương ứng.
- [Audit và quyết định residual risk](../security/dependency-audit-2026-10-21.md)
  kèm raw JSON trước/sau. Full audit 12 high/1 critical → **5 high/0 critical**;
  production-only audit 0. Full audit vẫn exit 1.
- Năm high cùng chuỗi ESLint → fast-glob → micromatch → braces 3.0.3 chưa có
  bản vá. Giữ tooling đồng bộ; không override, force fix hay downgrade major.
  Quyết định có giới hạn cho dev/build đã ghi; chưa loại dependencies khỏi image.
- Không đổi public API/schema 1.0, code sản phẩm/tests/CI, React/Vitest,
  model/threshold/splits, dữ liệu/weights hoặc báo cáo/slide P12.

## Kiểm chứng

| Check sau sửa | Kết quả |
|---|---|
| `npm ci` | PASS, exit 0; npm 11.17.0/Node 24.19.0 Windows |
| `npm test` | PASS, 81 tests / 6 files |
| typecheck, lint | PASS, exit 0 |
| production build | PASS qua webServer `npm run build && npm run start` trong fixture và real-model suites |
| Chromium fixture ảnh/video/webcam, desktop/mobile | PASS, 4 tests |
| Chromium ảnh synthetic → API → checkpoint thật, desktop/mobile | PASS, 2 tests; không route interception |
| Actual API boundary/schema/model identity | PASS, 413/415/422, schema validation và checksum |
| Native missing-model/CORS/UI smoke | PASS, 1 test; không phải container |
| `npm audit --json` | exit 1, 5 high công khai trong quyết định residual |
| `npm audit --omit=dev --json` | PASS, exit 0, không vulnerabilities được báo |

Checkpoint giữ SHA-256
`1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
Media synthetic, không chứng minh accuracy/camera vật lý; không đo benchmark mới.
Inference venv tái sử dụng từ acceptance, không phải fresh/independent setup.

Evidence: `D:\Codex\outputs\face-mask-detection\dependency-security-2026-10-21`:
audit/advisory snapshots, dependency tree/lockfile changes, command receipts,
Playwright fixture/real/native reports, driver tái dùng và manifest SHA-256.
`verification.json` kiểm tra receipts, version/preservation invariants và audit;
`final-state.json` lưu remote HEAD/PR/CI/issues và trạng thái checkout cuối phiên.

## Closeout và bước tiếp

Đã push task branch, mở draft PR nhắm `test/product-acceptance`; chỉ đóng #46 sau
khi CI HEAD cuối đạt và issue đã liên kết PR/audit/verification cùng quyết định
cho cả năm high còn lại. #24/#25 giữ OPEN và dẫn kết quả này; các tiêu chí khác
không được nghiệm thu bằng dependency patch. CI/issue/remote HEAD cuối phiên
được đọc lại sau push và ghi trong `final-state.json` tại evidence root;
[checks PR #48](https://github.com/anhpd-glinteco/face-mask-detection/pull/48/checks)
là trạng thái live, không dùng CI của nhánh tiền nhiệm thay cho HEAD task.

`AGENTS.md` đang sửa ở source gốc được giữ nguyên, SHA-256
`b8cce059b0616eab2a249c7c2c15ac4b92939b1982183107a3848edc4e390a52`;
không stage. Worktree task phải sạch. Native worktree tool tạo trên C: không có
tùy chọn D:, Git không move xuyên volume được; checkout tạm C: đã archive,
worktree thực hiện và toàn bộ evidence/cache dùng D: theo yêu cầu.

Bước tiếp ưu tiên **#45 Docker local**, rồi **#42 uncertain**. Recheck braces
khi upstream vá hoặc trước deploy/thay glob settings/dev-server exposure.
Rollback dependency change bằng revert commit task, giữ evidence cũ.

NOT_RUN: local Docker/WSL repair, camera vật lý, hosted HTTPS/rollback,
quality training/evaluation, exploit testing và independent product review.
