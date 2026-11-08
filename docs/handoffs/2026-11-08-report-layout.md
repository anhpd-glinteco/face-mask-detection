# Chỉnh báo cáo 08/11/2026

Nhánh docs/submission-local-final, draft PR #56 về feat/pretrained-ssdlite. Nguồn báo cáo, builder, preservation, cập nhật Word, verifier và đóng gói được chỉnh theo kế hoạch người dùng. Bìa tham khảo trang 2 PDF cùng trường; logo trích riêng, khung đen mới, thông tin hai cột. Giữ năm chương; chương 3 dữ liệu/mô hình, API và vòng đời frame về chương 4. Tên bảng khai báo rõ trong nguồn, chú thích hình ngắn. Tóm tắt/kết luận ưu tiên fine-tune; giới hạn và nguồn minh họa giữ nguyên. Checklist nộp bài và hướng dẫn sửa sơ đồ chuyển khỏi báo cáo.

Bộ mới D:/Codex/outputs/face-mask-detection/submission-local-final-2026-11-08. Word/PDF 41 trang, 6 hình, 30 bảng; 81 mục danh mục được đối chiếu vị trí và số trang. Validator PASS font/lề/bìa/relationship/parts và metrics baseline, pretrained, hiệu năng lịch sử. ZIP SHA-256 3df6f7cc5c545a6f137818fb87433eed8a779f3a80fccdf1b205037680344b30. Finalize PASS XML/metadata/comments/links, ZIP extraction/byte comparison. Năm tệp slide/chương trình byte-identical bộ 07/11; manifest ghi nguồn dùng lại. Bộ 07/11 được kiểm tra checksum, không đổi.

QA: PDF Word được raster bằng pypdfium2 thành 41 PNG, xem bố cục toàn bộ qua 11 sheet và mở riêng bìa; các lượt sửa trước kiểm tra thêm chi tiết bảng/hình/phân trang. Không phải kiểm tra mọi trang ở 100% zoom. Packaged render_docx.py thất bại do soffice.exe không nằm trong PATH; dùng PDF xuất native Word và PNG làm bằng chứng thay thế. Bản cuối hết trang kết luận chương rời và hàng E07 rời. Hồ sơ tại D:/Codex/work/face-mask-detection/final-2026-11-08; số liệu gốc giữ tại các thư mục thực nghiệm cũ.

Frontend 84758d86d9fc7046abf17708e551242e33f1e723, checkpoint 7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e không đổi. Không chạy lại model/camera, không sửa slide, không merge/deploy/nộp cổng lớp. BM124 còn thiếu mẫu gốc; video chưa hoàn tất; #26/#27 giữ mở. Mẫu PDF là tham khảo, không xác nhận quy định chính thức. Không có review độc lập.

Remote/PR/CI/issue và working tree sau push ghi tại final-state.json trong hồ sơ work; PR/comment ghi kết quả CI thực tế trên commit bàn giao.
