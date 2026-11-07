# Chốt bộ nộp 07/11/2026

Nhánh docs/submission-local-final, cập nhật draft PR #56 trên base feat/pretrained-ssdlite.

Bộ mới tại D:/Codex/outputs/face-mask-detection/submission-local-final-2026-11-07. Báo cáo DOCX/PDF 42 trang, slide PPTX/PDF 14 trang, chương trình DOCX/PDF/TXT 2 trang; README, manifest và ZIP. Ngày xuất 07/11, kết quả thực nghiệm đến 05/11. ZIP SHA-256 43e8db825a9cdaef0a2d61f0599a7bd829c1babd48afb135a85c0c465d76d9dc.

Đã chốt nhóm 1, K18, lớp 20261IT6150003; Phùng Đức Anh phụ trách FE, Hoàng phối hợp FE và phụ trách kiểm thử/hiệu năng/Docker/CI; Kiệt và Hải đồng phụ trách dữ liệu/ML/inference. Cả nhóm làm báo cáo, slide, nghiệm thu và video. Bỏ phần chia nhỏ nhiệm vụ thiếu căn cứ và các nhắc xác nhận lại thông tin đã chốt.

Word 16 cập nhật 3 danh mục, verifier PASS 42 trang/6 hình/31 bảng/87 mục và 15 phần template, đối chiếu P4/P11/pretrained PASS. Đã xem các trang của 3 PDF bằng bản render, kiểm tra riêng slide 6 ở kích thước đọc được. Slide package/layout validators, metadata/notes/link/workbook scan và ZIP extraction/byte comparison PASS. Native PowerPoint NOT_RUN; PDF slide xuất bằng LibreOffice. Node exporter ghi đủ output/receipts rồi exit 1 như lượt trước; đã kiểm chứng package và bản render độc lập. Môi trường helper slide cũ đã bị thay phiên bản, sử dụng bản cài hiện có 26.1105.12137. Các bộ xuất cũ giữ nguyên.

Frontend 84758d86d9fc7046abf17708e551242e33f1e723; checkpoint 7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e. Checkpoint được chuẩn bị riêng. Không chạy lại model/camera trong phiên tài liệu.

BM124 còn thiếu mẫu gốc, tên tài liệu riêng DACN-1-BM124. Video demo chưa hoàn tất. Giữ #26/#27 mở; deployment gate CLOSED, chưa nộp lên cổng lớp. CI HEAD, remote SHA, PR draft và working tree được kiểm tra sau push; kết quả cuối lưu tại D:/Codex/work/face-mask-detection/final-2026-11-07/final-state.json. Hồ sơ kiểm chứng, receipts và ảnh QA lưu riêng cùng thư mục work.
