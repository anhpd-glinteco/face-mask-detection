# Dependency audit — 21/10/2026 (#46)

## Kết quả và thay đổi

| Audit từ npm registry | Trước | Sau |
|---|---:|---:|
| Critical | 1 | 0 |
| High | 12 | 5 |
| Tổng vulnerabilities (đếm package, gồm cảnh báo lan truyền) | 13 | 5 |
| Sau, `npm audit --omit=dev --json` | — | 0 |

Raw snapshots: [trước](audit-before.json), [sau](audit-after.json).
Full audit sau vẫn **exit 1**; production-only audit exit 0. Không gọi toàn bộ
dependency tree là sạch hoặc coi audit là kiểm chứng exploitability.

Manifest pin `next` và `eslint-config-next` từ 16.3.5 → **16.3.8** cùng nhau.
Lockfile cập nhật `vite` 7.3.6 → **7.3.7**, `source-map-js` 1.2.1 → **1.2.2**,
`sharp` 0.35.4 → **0.35.5** và các binary/libvips tương ứng trong dải dependency
hiện có. PostCSS vẫn 8.5.23. Không thêm dependency trực tiếp, override, thay
React/Vitest, chạy `audit fix --force`, đổi API/schema hoặc code sản phẩm.

## Advisory và đường sử dụng

Đã đọc toàn bộ 13 advisory duy nhất từ audit ban đầu qua GitHub Advisory API;
JSON gốc được lưu trong evidence root dưới đây. Không chạy payload khai thác.

| Advisory chính thức | Phạm vi / đối chiếu repo | Xử lý |
|---|---|---|
| [Next ImageResponse RCE](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | Node runtime, SVG đầu vào không tin cậy; repo không import `next/og`/`ImageResponse` | Next 16.3.8, vượt bản vá 16.3.6 |
| [Draft Mode cache](https://github.com/advisories/GHSA-3w37-wq28-93x7) | Cache Components/use cache và Draft Mode; không cấu hình trong repo | Next 16.3.8 |
| [SSG/ISR cache](https://github.com/advisories/GHSA-4jqv-mc3x-m676), [catch-all cache](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | Pages Router SSG/ISR hoặc root catch-all; app hiện dùng App Router, không có các route này | Next 16.3.8 |
| [Dev MCP disclosure](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | `next dev`; có script dev, không phải production endpoint | Next 16.3.8 |
| [Metadata image dynamicParams](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | Webpack metadata image routes; repo không có route ảnh động này | Next 16.3.8 |
| [Image Optimization SSRF](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | Remote image allowlist; không dùng `next/image` hay `images.remotePatterns` | Next 16.3.8 |
| [sharp/librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | SVG decoding có điều kiện trên glibc Linux; sharp thuộc Next optional runtime tree, app không import trực tiếp | sharp 0.35.5; Windows tests không chứng minh Linux exploitability |
| [source-map-js DoS](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | Indexed source maps qua PostCSS/build tooling; không có API nhận source map | Lockfile 1.2.2 |
| [Vite Windows existence bypass](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [percent escaping](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [editor CLI flags](https://github.com/advisories/GHSA-r825-w8mm-5pxw) | Dev/test Vite editor handling, có điều kiện Windows/WSL/editor; Vite được dùng bởi Vitest/plugin-react, không phải production server | Vite 7.3.7, không nâng major |

## Quyết định cho 5 high còn lại

Một advisory gốc: [braces stack exhaustion GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
GitHub ghi **chưa có bản vá**; npm registry hiện có braces 3.0.3. Audit đếm cả
chuỗi bên dưới, không phải năm lỗi độc lập:

| Package | Phiên bản | Đường ảnh hưởng / quyết định |
|---|---|---|
| `eslint-config-next` | 16.3.8 | Dev dependency trực tiếp; giữ cùng Next đã vá |
| `@next/eslint-plugin-next` | 16.3.8 | Từ config; dùng fast-glob trong `get-root-dirs` |
| `fast-glob` | 3.3.1 | Từ plugin; truyền glob sang micromatch |
| `micromatch` | 4.0.8 | Từ fast-glob; dùng braces |
| `braces` | 3.0.3 | Advisory DoS khi parse brace pattern lồng sâu, chưa có bản vá |

Quyết định tại checkpoint này: giữ chuỗi ESLint và công khai residual risk,
không hạ `eslint-config-next` về 14.2.35 theo fixAvailable của npm (major downgrade,
không đồng bộ Next 16). Không gỡ lint hoặc vá dependency bằng override.

`eslint.config.mjs` không đặt `settings.next.rootDir` glob; plugin mặc định dùng
`context.cwd`. Lint/CI lấy config và đường dẫn từ checkout, không lấy pattern từ
upload ảnh/video/webcam. Chỉ chạy tooling trên checkout/config đáng tin cậy;
không mở Vite/dev/editor endpoints ra mạng để xử lý đầu vào không tin cậy.
Đây là phân tích source, không phải chứng minh không thể khai thác trong mọi môi trường.

Production-only audit bỏ dev dependencies nên trả 0. **Dockerfile hiện vẫn
`npm ci` toàn bộ dependencies**: năm cảnh báo vẫn có trong image build/runtime
filesystem; kết quả omit-dev không chứng minh container đã loại chúng. Chưa đổi
packaging hoặc mở deployment gate trong task này. Rà lại advisory/chuỗi dependency
khi upstream có bản vá hoặc trước khi thay glob config, dev-server exposure hay deploy.

## Kiểm chứng và evidence

Evidence root: `D:\Codex\outputs\face-mask-detection\dependency-security-2026-10-21`.
Node 24.19.0, npm 11.17.0 trên Windows; CI dùng Node 22/Linux. npm cache riêng
trên D: do cache mặc định báo EEXIST; không xóa cache dùng chung. npm ci cảnh báo
allow-scripts cho esbuild/unrs-resolver; không đổi policy chung, dùng các kiểm tra
thực chạy để xác minh toolchain.

Baseline trước sửa: `npm ci` exit 0 và 81 unit tests PASS. Sau sửa: `npm ci`,
81 unit tests, typecheck/lint và production build qua Playwright webServer đạt;
4 Chromium fixture tests ảnh/video/webcam đạt. Kết quả checkpoint thật và CI
cuối được ghi tại [handoff](../handoffs/2026-10-21-dependency-security.md).
Receipts ghi command/cwd/time/exit; `dependency-tree.json`, `lockfile-changes.json`,
audit receipts, reports và manifest hash nằm trong evidence root.

Giữ checkpoint/threshold, schema 1.0, báo cáo P12, dữ liệu và weights. Deployment
gate **CLOSED**. Không có nghiệm thu camera vật lý, Docker local, hosted HTTPS,
rollback, chất lượng model hoặc independent product review trong task này.
