# Bộ nộp báo cáo cuối kỳ lần 1

Hạn nộp theo thông báo lớp: **08/11/2026**. Mục tiêu nội bộ: chốt bộ nộp
**05/11**, dành 06–07/11 sửa lỗi và bổ sung thông tin. Ưu tiên bài nộp và demo
local. Thí nghiệm pretrained đã được tổng hợp; lượt chốt này tập trung hoàn thiện hồ sơ nộp.

## Tài liệu và phiên bản

- Báo cáo nền: bản theo mẫu cập nhật PlantUML ngày 01/11, giữ nguyên bản gốc.
- Nguồn chỉnh văn phong: `docs/report/p12-template/bao-cao.md`.
- Đầu ra phiên này: `D:/Codex/outputs/face-mask-detection/submission-local-final-2026-11-07`.
- Bản sản phẩm dùng rehearsal: PR #55, nhánh `fix/detection-presentation`,
  commit `84758d86d9fc7046abf17708e551242e33f1e723`.
  Nhánh tài liệu không chứa thay đổi UI đó; không chạy nhầm nhánh hoặc gọi PR là đã merge.
- Dùng checkpoint fine-tune SHA-256 `7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e`; giữ API/schema và dependencies và số đo P4/P11 không đổi.
  Nghiệm thu mới có log riêng, không thay kết quả lịch sử.

## Chốt bộ ngày 07/11

Thông tin đã xác nhận gồm nhóm 1, khóa K18 và lớp học phần 20261IT6150003. Phùng Đức Anh phụ trách FE, Hoàng phối hợp FE và phụ trách kiểm thử/hiệu năng/Docker/CI; Kiệt và Hải đồng phụ trách dữ liệu/ML/inference. Báo cáo, slide, nghiệm thu và video là việc chung của nhóm.

Bộ cuối đặt tại `D:/Codex/outputs/face-mask-detection/submission-local-final-2026-11-07`. Kết quả thực nghiệm cập nhật đến 05/11; ngày xuất 07/11. Báo cáo `DACN_1_BaoCao_v1.docx`, hướng dẫn `DACN_1_ChuongTrinh.docx`, kèm PDF/TXT, 14 slide và ZIP/checksum.

BM124 được nộp riêng với tên `DACN-1-BM124`; đang thiếu mẫu gốc. Video demo còn cần quay đủ ba luồng và kiểm tra phát lại. Hai hạng mục này tiếp tục chưa hoàn tất.

Trước khi nộp, kiểm tra nội dung, tên tệp và liên kết trên cổng lớp. Trạng thái nộp và giờ đóng cổng chưa được xác minh.
