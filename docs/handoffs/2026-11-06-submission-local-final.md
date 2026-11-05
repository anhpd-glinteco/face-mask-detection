# Bộ nộp local cập nhật kết quả 05/11

## Phạm vi và phiên bản

- Nhánh tài liệu `docs/submission-local-final`, từ `feat/pretrained-ssdlite` tại `90cad7ed65a8f518d5b463e3f7dba2071a88008d`; PR draft nhắm nhánh tiền nhiệm. Không thay đổi runtime, weights hoặc frontend.
- Bộ xuất mới: `D:/Codex/outputs/face-mask-detection/submission-local-2026-11-05`. Ngày xuất thực tế 06/11/2026; giữ tên thư mục theo kế hoạch đã duyệt.
- 7 tài liệu: báo cáo DOCX/PDF 42 trang, PPTX/PDF 14 slide, chương trình DOCX/PDF/TXT 2 trang; README, manifest và ZIP. Checksum từng file ở `docs/report/submission-local-manifest.json`.
- ZIP SHA-256: `1d6a4cc4c6f5274ca7fd91cd07f89f6036990a47ff61f1e2b4437b52f223c44d`.
- Frontend được hướng dẫn: `84758d86d9fc7046abf17708e551242e33f1e723`; checkpoint `7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e`, chuẩn bị riêng, không có trong ZIP/repository.

## Thay đổi nội dung

Mô tả môi trường local và công nghệ thực tế; bỏ ghi chú điều phối khỏi nội dung nộp, thay đường dẫn cá nhân bằng đường dẫn tương đối/biến cấu hình. Chuẩn hóa properties, theme display names và metadata PDF của các bản xuất riêng. Giữ lịch sử Git, bộ nộp cũ, nguồn trích dẫn, phân công theo kế hoạch nhóm và kết quả kiểm thử có kiểm soát.

Giữ P4/P11 là lịch sử. Thêm COCO fine-tune 30 epoch, chọn epoch 10, threshold đánh giá 0,25; UI 0,15 được mô tả riêng. Validation macro F1 0,3351 và test 0,3240; test mAP50:95 0,1333. Bảng theo lớp giữ cả AP giảm ở lớp đeo sai, TP/FP/FN và mục tiêu chất lượng FAIL. Tập test đã dùng ở P4, không gọi là holdout mới.

Hình UI được chụp lại trên frontend 84758d8 với response kiểm thử và media không khuôn mặt; tách khỏi camera vật lý. Báo cáo camera ngày 05/11 có 220 request thành công gồm restart, p95 204,48 ms; video 299 request, p95 175,68 ms, cả hai luồng trên 60 giây. Người dùng xác nhận đèn camera tắt sau Dừng/đổi chế độ trong hội thoại; không biến script track cleanup thành quan sát vật lý. Không ghi media khuôn mặt.

## Kiểm chứng

- Word 16 mở, cập nhật 3 danh mục và xuất PDF. Verifier PASS: 42 trang, 6 hình, 31 bảng, 87 mục danh mục được đối chiếu đúng trang; 15 phần template giữ nguyên, số P4/P11 và hash bộ P12 cũ không đổi. Kết quả pretrained được đối chiếu trực tiếp JSON validation/test, gồm AP từng lớp; 13 tham khảo không trùng số.
- Render và xem từng trang PDF báo cáo 42/42, slide 14/14, chương trình 2/2; xem lại các trang báo cáo thay đổi sau sửa. Không thấy tràn/chồng chữ hoặc lỗi dấu tiếng Việt. Hình minh họa và bảng đọc được; Word PDF là bản phân trang chuẩn.
- Renderer DOCX bổ sung chạy thành công qua LibreOffice; pagination khác Word nên chỉ dùng kiểm tra tương thích, không thay PDF nộp. Native PowerPoint execution NOT_RUN. Slide PDF được xuất bằng LibreOffice; bố cục/chart/table đã xem trực tiếp.
- Slide package/layout validators PASS: 14 notes, bảng native ở 5/11/12, chart native ở 10. Node exporter ghi đủ output và receipts rồi exit `-1073740791`; đã kiểm tra package độc lập và render PDF thành công, không gọi exit code đó là PASS.
- Rà văn bản, XML/attributes, properties, hyperlinks, notes, comments, workbook biểu đồ nhúng và PDF: không còn tên công cụ điều phối hoặc đường dẫn máy cá nhân trong 7 tài liệu. Nguồn kỹ thuật và khai báo dữ liệu kiểm thử được giữ. Không có comment part.
- Hướng dẫn chương trình có hyperlink thật đến commit và readiness/local URL. Self-check builder chương trình PASS; checksum và class/model facts giữ đúng. Cài lại trên máy sạch NOT_RUN.
- ZIP testzip PASS, giải nén ra thư mục riêng và đối chiếu từng byte PASS; chỉ 9 file bàn giao, không chứa logs, receipts, checkpoint, dataset hoặc ảnh QA. Metadata exception chỉ áp dụng properties/theme names; các phần nội dung Office khác không đổi.
- `git diff --check` PASS. CI nhánh tài liệu được xác nhận sau khi mở PR; xem phần trạng thái từ xa bên dưới.

Hồ sơ kỹ thuật riêng: `D:/Codex/work/face-mask-detection/submission-local-2026-11-05`, gồm Word receipts, source metrics, PNG QA, slide validators, build logs, package-verification.json và ZIP roundtrip. Hướng dẫn tái tạo ở `docs/report/submission-local.md`.

## Còn mở

Issue #26 cần nhóm duyệt bản cuối, xác nhận khóa đào tạo, BM124 và phân công thực tế. Issue #27 chưa có video demo hoàn chỉnh. Không đóng hai issue này. #24/#43/#44 tiếp tục giữ giới hạn trong các phiên bàn giao trước; phiên này không nghiệm thu thêm model/camera.

Camera unplug NOT_RUN; ma trận ba trạng thái theo ánh sáng/khoảng cách, lỗi Bắt đầu trong trình duyệt nhúng và setup máy mới chưa nghiệm thu đầy đủ. Quyền dữ liệu/scene independence còn thiếu, deployment gate CLOSED. Không merge hoặc deploy.

## Trạng thái từ xa

PR draft, CI và trạng thái working tree được cập nhật sau push. Không dùng kết quả CI lịch sử để thay cho CI của nhánh tài liệu.
