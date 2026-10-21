# P12 — review độc lập báo cáo, 21/10/2026

Đã review snapshot `e2c0aadce136652700ad05622c3aa39086f84fb5` trên nhánh
`docs/p12-report-template`, draft PR #41 nhắm `docs/p12-report-slides`.
Reviewer là subagent riêng, không tham gia viết/sửa báo cáo; đây là review bằng
agent, không phải xác nhận của giảng viên hoặc nghiệm thu học phần.

## Kết quả

**PASS bàn giao kỹ thuật có giới hạn; không phát hiện blocker kỹ thuật/P0/P1.**
Reviewer xem riêng toàn bộ 34 trang, đối chiếu source và raw evidence P4/P11.
Không thấy clipping/mất chữ, bảng/hình hỏng hoặc số liệu chính sai. CI không được
dùng thay bằng chứng QA tài liệu. Không sửa báo cáo, slide hoặc code sản phẩm.

Output: `D:\Codex\outputs\face-mask-detection\p12-independent-review-2026-10-21`.
- `review.md`, `review.json`: kết luận, PASS/FAIL/NOT_RUN, trang/mục và sửa tối thiểu.
- `reviewer/page-checklist.md` và `.json`: kiểm tra đủ 34 trang.
- `verification`: verifier, manifest comparison, preservation hashes, fresh-render
  comparison, bản sao DOCX/PDF và remote/CI snapshots.

## Phát hiện và phần còn thiếu

| ID | Mức độ | Trang PDF / số in | Kết luận và sửa tối thiểu |
|---|---|---|---|
| G01 | P2, trước nộp cuối | 1; 9/2; 34/27 | MSSV/khóa/đóng góp còn “Cần bổ sung”, được công bố đúng. Cần nhóm xác nhận rồi xuất bản mới; không tự điền. |
| O01 | P3, góp ý đặc tả | 13/6 | UC02 bước 3 nói source/session ID và frame ID; code hiện dùng generation guard, snapshot file/timestamp/result. Vì thuộc chương yêu cầu, chưa xác định là lỗi triển khai. Lần biên tập sau làm rõ mô tả hiện tại hay ID khái niệm; không thêm API chỉ để khớp câu chữ. |
| O02 | P3, lần xuất bản sau | 2/i; 30/23; 34/27 | Snapshot báo cáo vẫn ghi chưa review độc lập, đúng tại thời điểm tạo. Bản tiếp theo dẫn review mới và phạm vi; không sửa ngược snapshot/manifest. |

## Kiểm chứng

PASS: verifier hiện có chạy trên bản sao, exit 0: 34 trang, 6 hình, 27 bảng,
81 heading/caption/list entries; metric P4/P11, relationships, preserved parts và
hash P12 cũ. Manifest tạo lại bằng manifest gốc; DOCX/PDF khớp hash.
Render mới từ bản sao PDF tạo đủ 34 PNG, khớp từng byte với 34 PNG reviewer đã xem.
DOCX/PDF/manifest cuối và AGENTS.md giữ nguyên hash trước/sau.

Đây là kiểm lại package với Word receipts đã lưu, không phải clean Word rebuild.
NOT_RUN: rebuild Word/máy sạch, train/evaluation/benchmark lại, camera vật lý,
hosted/HTTPS/rollback, test sản phẩm và kiểm URL live. Nguồn/tham chiếu được
đối chiếu nội bộ; không khẳng định URL ngoài còn truy cập được.

## Trạng thái và bước tiếp

Issue #26 giữ OPEN: thiếu thông tin nhóm và chưa đủ toàn bộ DoD; review báo cáo
không bao phủ review slide. Giới hạn quyền từng ảnh/scene independence, chất lượng
model, camera/hosted/setup và P13 được giữ riêng theo tiêu chí tương ứng, không
mặc nhiên coi tất cả là blocker của báo cáo. Deployment gate CLOSED.

Nhánh được push và PR #41 giữ draft sau commit handoff; không merge/deploy.
Trạng thái remote/PR/CI/issue cuối phiên lưu ở `verification/final-state.json`
trong output. Working tree dự kiến chỉ còn thay đổi có sẵn ở AGENTS.md, không stage.
