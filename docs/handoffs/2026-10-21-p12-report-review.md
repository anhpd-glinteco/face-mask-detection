# P12 — rà soát báo cáo theo mẫu, 21/10/2026

Nhánh `docs/p12-report-template`, draft PR #41 nhắm `docs/p12-report-slides`.
Không merge/deploy. Issue #26 giữ OPEN; đây là tự rà soát, không phải review độc lập.

## Kết quả và vị trí bàn giao

- Bản cuối: `D:\Codex\outputs\face-mask-detection\p12-report-template-review\final`.
- DOCX/PDF Word 16: 34 trang, 5 chương, 6 hình, 27 bảng; 3 section, 3 danh mục/mục lục.
- `manifest.json`: SHA-256, 81 heading/caption đối chiếu trang PDF và danh mục,
  font/lề, 15 parts giữ từ mẫu, relationships, metric P4/P11 và hash bốn artifact P12 cũ.
- `verification`: Word receipts, verifier log; `qa/word-final`: toàn bộ 34 trang render.
- `review.md` và `review.json` ở thư mục review: lỗi trước sửa, kết quả sau sửa,
  vị trí trang, checklist từng trang và các mục NOT_RUN. Nguồn/lệnh tái tạo trong
  `docs/report/p12-template/README.md`; manifest hiện tại được lưu cùng nguồn repo.
- Bản 35 trang gốc và bản sao kiểm chứng ở `artifacts` giữ nguyên để đối chiếu;
  mẫu ngoài repo và bộ slide không đổi.

## Lỗi đã sửa

| Lỗi ban đầu | Bằng chứng | Xử lý / kết quả cuối |
|---|---|---|
| Dòng Markdown thành đoạn Word riêng, ngắt câu và tạo khoảng trắng thừa | Trang PDF gốc 12–15 (số in 5–8) | Nối dòng trong cùng đoạn UC01–03, không đổi từ/nội dung; trang cuối 12–14 đọc liền mạch |
| URL TorchVision tràn lề phải | Trang PDF gốc 33, mục [7] | Tách URL thành run và dùng 8 pt cho URL dài hơn 100 ký tự, giữ nguyên chuỗi; trang cuối 32 nằm trong lề |
| “đổi tab” có thể bị hiểu là tab trình duyệt | Mục 4.5; source Home và WebcamWorkspace | Ghi rõ “đổi chế độ đầu vào”; không tuyên bố tự stop khi browser mất focus |

Verifier/render bỏ khóa cứng 35 trang, đối chiếu số trang thực tế với Word receipt/
manifest. Thêm assert ngăn tái xuất đoạn UC bị tách và kiểm tra URL nguyên vẹn,
font URL dài sau Word. Không đổi public API, code sản phẩm, dependencies hoặc slide.

## Kiểm chứng và giới hạn

PASS: verifier chạy trên bản sao 35 trang trước sửa và bản cuối 34 trang. Đã xem
toàn bộ 35 trang ban đầu và 34 trang sau sửa; lần xuất cuối chỉ trang 32 thay đổi
pixel so với bộ 34 trang đã xem, trang 32 được mở lại để chốt. Không thấy clipping,
overlap, glyph lỗi hoặc nội dung UniLend; bảng qua trang có header lặp. Một số
trang cuối chương còn ngắn do giữ quy tắc chương mới bắt đầu trang mới.

PASS: đối chiếu P4 raw JSON/model card, P11 run 3 API/browser/memory và regression
report; F1 0,2061/mAP50:95 0,0820, warm p95 36,89 ms, displayed FPS 4,91/4,99.
Giữ tách ngưỡng P4 0,15 và API 0,001, fixture/synthetic/camera thật, HTTP/display
counts, giới hạn memory và dữ liệu. Snapshot Git `88687c9` có các đường dẫn nguồn
đã dẫn; mở lại bốn nguồn arXiv/TorchVision/MDN, không coi stable 0.29 là runtime 0.24.

NOT_RUN: test sản phẩm local, training, benchmark, camera vật lý, clean setup,
HTTPS/rollback hosted, xác minh quyền từng ảnh và review độc lập. MSSV/khóa/đóng
góp vẫn “Cần bổ sung”. Không coi báo cáo đã đủ nghiệm thu; deployment gate CLOSED.

`AGENTS.md` giữ nguyên SHA-256
`b8cce059b0616eab2a249c7c2c15ac4b92939b1982183107a3848edc4e390a52`, không stage.
Trạng thái push/PR/CI/issue cuối phiên lưu ở `verification/final-state.json` của
thư mục review; CI sản phẩm không thay thế QA tài liệu hay nghiệm thu còn thiếu.
