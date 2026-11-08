# Bộ xuất ngày 08/11/2026

Bản mới giữ năm chương, thay bìa có logo và thông tin hai cột, dùng TNR14 và lề mới theo kế hoạch người dùng. Số trang lấy từ receipt Word, kiểm tra với PDF thay vì cố định 42. Slide 14 trang và hướng dẫn chương trình 2 trang được dùng lại từ bộ 07/11; giữ nguyên commit và checkpoint. Truyền --reuse-from trỏ đến bộ 07/11 cho cả prepare và finalize để giữ nguyên byte của năm tệp slide/hướng dẫn. Finalize kiểm tra lại tính đồng nhất. Manifest ghi rõ các tệp dùng lại.

BM124 chưa có mẫu gốc; video demo chưa hoàn tất. Hai việc này theo dõi trong handoff nội bộ, không đưa checklist đang làm dở vào báo cáo. Chưa nộp lên cổng lớp.

# Tạo lại bộ nộp local

Nguồn báo cáo nằm ở `p12-template/bao-cao.md`, slide ở `p12/slides.json`, hướng dẫn chương trình ở `program-link.md`. Giữ mẫu báo cáo tham chiếu và bố cục 14 slide. Nội dung tổng hợp kết quả đến 05/11/2026; bản xuất này được tạo ngày 07/11/2026.

## Môi trường xuất tài liệu

Cần Python có python-docx, lxml, pypdf, Pillow và thư viện render PDF; Node có thư viện tạo slide mà `p12/build_slides.mjs` đang dùng; Word desktop để cập nhật ba danh mục và xuất PDF; LibreOffice để xuất PDF slide. Dùng runtime và thư viện đã được cấu hình trên máy biên soạn. Các biến đường dẫn dưới đây phải được đặt trước, trỏ tới thư mục riêng của lượt xuất, ngoài repository:

- `$Python`, `$Node`: executable của môi trường biên soạn.
- `$Work`, `$Output`: thư mục trung gian và bộ nộp mới.
- `$Reference`: mẫu DOCX gốc đã được kiểm tra checksum trong builder.
- `$env:P12_PRESENTATIONS_SKILL`: thư mục chứa các bộ kiểm tra package/layout của slide.
- `$env:P12_RUNTIME_PYTHON`: cùng executable với `$Python`.
- `$Work/slides/node_modules`: thư viện slide đã cài, được builder nạp theo thư mục này.

Từ gốc dự án, chạy lần lượt:

```powershell
& docs/report/p12-template/rebuild.ps1 -Reference $Reference -Output "$Work/report" -Work "$Work/report-work" -Python $Python
& $Python docs/report/build_program.py --output "$Work/program"
& docs/report/p12-template/update_word.ps1 -Docx "$Work/program/DACN_1_ChuongTrinh.docx" -Pdf "$Work/program/DACN_1_ChuongTrinh.pdf" -Receipt "$Work/program/word.json"
& $Node docs/report/p12/build_slides.mjs "$Work/slides-output" "$Work/slides"
& $Python docs/report/package_submission.py prepare --work $Work --output $Output
```

Chỉ tiếp tục khi builder và receipts hợp lệ. Xuất `DACN_1_ThuyetTrinh.pptx` thành PDF cùng tên trong `$Output`, bằng LibreOffice với profile riêng cho lượt xuất. Không lưu đè PPTX qua bộ chuyển đổi. Sau đó:

```powershell
& $Python docs/report/package_submission.py finalize --work $Work --output $Output
```

`prepare` tạo bản xuất riêng, xóa thông tin tác giả/phần mềm trong properties và chuẩn hóa tên hiển thị của theme. Nó kiểm tra các phần nội dung còn lại không đổi. `finalize` rà XML, speaker notes, hyperlink, workbook biểu đồ nhúng, comments và metadata; xóa metadata PDF, đối chiếu số trang, tạo checklist/checksum và kiểm tra ZIP giải nén trùng từng byte. Các lỗi đều chặn đóng gói. Chạy lại `finalize` tạo ZIP/checksum mới; chỉ dùng manifest của lượt cuối.

Ảnh giao diện trong `p12/assets` dùng dữ liệu kiểm thử có kiểm soát, không có khuôn mặt và không chứng minh chất lượng model. Nếu chụp lại bằng `p12/capture-fixtures.mjs`, phải dùng đúng frontend được ghi trong `capture.json`, giữ khai báo nguồn và kiểm tra các ảnh trước khi build lại.

## Kiểm tra trước khi giao

Kiểm tra tự động không thay cho xem từng trang. Mở DOCX bằng Word, cập nhật mục lục, xuất PDF rồi render và xem mọi trang/slide ở kích thước đọc được. Kiểm tra font tiếng Việt, bảng, hình, ngắt trang, đường dẫn và nội dung notes. PDF báo cáo xuất từ Word là bản phân trang chuẩn; phần mềm văn phòng khác có thể phân trang DOCX khác. Kiểm tra bản chương trình giữ đúng commit frontend và SHA-256 checkpoint.

Tách toàn bộ logs, receipts, ảnh QA và bản nháp khỏi bộ nộp. ZIP không chứa checkpoint hoặc dataset. Checkpoint phải được nhóm chuẩn bị riêng theo hướng dẫn chương trình. Trước khi nộp, nhóm còn cần bổ sung mẫu gốc BM124 và hoàn thành video demo; giữ nguyên các kết quả FAIL/NOT_RUN và giới hạn chất lượng đã ghi.
