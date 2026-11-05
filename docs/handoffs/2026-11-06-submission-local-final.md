# Bộ nộp local cập nhật kết quả 05/11

## Phạm vi và phiên bản

- Nhánh tài liệu `docs/submission-local-final`, từ `feat/pretrained-ssdlite` tại `90cad7ed65a8f518d5b463e3f7dba2071a88008d`; PR draft nhắm nhánh tiền nhiệm. Không thay đổi runtime, weights hoặc frontend.
- Bộ xuất mới: `D:/Codex/outputs/face-mask-detection/submission-local-2026-11-05`. Ngày xuất thực tế 06/11/2026; giữ tên thư mục theo kế hoạch đã duyệt.
- 7 tài liệu: báo cáo DOCX/PDF 42 trang, PPTX/PDF 14 slide, chương trình DOCX/PDF/TXT 2 trang; README, manifest và ZIP. Checksum từng file ở `docs/report/submission-local-manifest.json`.
- ZIP SHA-256 sau rà văn phong: `4eff6b840dd35a42291fc79498d9475cfc86ba49d1786adfbdd50d3fc8dd6032`.
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

### Rà văn phong theo yêu cầu bổ sung

Đã dùng Humanizer rà toàn bộ nguồn báo cáo, nội dung/notes 14 slide và hướng dẫn chương trình. Sửa các đoạn dạng log, câu bị động hoặc lặp ý; diễn đạt rõ hơn lỗi lấy mẫu video, kết quả đo bộ nhớ và giới hạn chất lượng. Giữ thuật ngữ, tên công nghệ cần thiết, số liệu, lệnh chạy, mã nguồn định danh và nguồn tham khảo. Bản xuất vẫn 42 trang báo cáo, 14 slide, 2 trang hướng dẫn.

Kiểm tra tự động xác nhận mọi token số, code block, inline code và URL trong báo cáo/hướng dẫn không đổi; bảng dữ liệu, thời lượng và nguồn tham khảo slide không đổi. Notes được đối chiếu đủ 14/14. Word verifier, slide package/layout và ZIP/content/metadata checks chạy lại đạt. Xem lại 29 trang báo cáo, 11 slide và 2 trang hướng dẫn có hình render thay đổi; các trang còn lại trùng hash PNG với bản đã xem. Hồ sơ riêng có `humanizer-verification.json` và bản trước chỉnh. Đây là biên tập văn phong, không phải bằng chứng về người viết hay phép kiểm tra máy phát hiện AI.

Lượt xuất slide sau sửa văn phong ghi đủ output và receipts nhưng Node trả exit 1; package/layout đã kiểm tra độc lập và PDF render thành công. Giữ lỗi exporter như giới hạn công cụ, không đánh dấu exit đó là thành công. CI commit ghi kết quả `50168e0` trước lượt sửa văn phong đạt 5/5; CI của commit văn phong được lưu trong `final-state.json` sau push.

Issue #26 cần nhóm duyệt bản cuối, xác nhận khóa đào tạo, BM124 và phân công thực tế. Issue #27 chưa có video demo hoàn chỉnh. Không đóng hai issue này. #24/#43/#44 tiếp tục giữ giới hạn trong các phiên bàn giao trước; phiên này không nghiệm thu thêm model/camera.

Camera unplug NOT_RUN; ma trận ba trạng thái theo ánh sáng/khoảng cách, lỗi Bắt đầu trong trình duyệt nhúng và setup máy mới chưa nghiệm thu đầy đủ. Quyền dữ liệu/scene independence còn thiếu, deployment gate CLOSED. Không merge hoặc deploy.

## Trạng thái từ xa

- [Draft PR #56](https://github.com/anhpd-glinteco/face-mask-detection/pull/56), base `feat/pretrained-ssdlite`, đã push nguồn tại `b5e8ab96856cb11c062e2bb28cc100652a0a7e8d`.
- [CI run 42074760137](https://github.com/anhpd-glinteco/face-mask-detection/actions/runs/42074760137): **5/5 SUCCESS** trên commit nguồn trên (web, inference, ML, E2E, Compose). Commit tiếp theo chỉ ghi kết quả bàn giao; kiểm tra CI HEAD cuối ở tab Checks của PR và `final-state.json` trong hồ sơ kỹ thuật riêng.
- Issue [#26](https://github.com/anhpd-glinteco/face-mask-detection/issues/26#issuecomment-6664670746) và [#27](https://github.com/anhpd-glinteco/face-mask-detection/issues/27#issuecomment-6664671602) đã cập nhật minh chứng và giữ OPEN.
- Remote SHA khớp local; working tree repository chính và worktree frontend sạch trước commit ghi kết quả này. Không merge/deploy. GitHub integration đọc được nhưng từ chối tạo PR/comment (403); đã dùng GitHub CLI được đăng nhập để hoàn tất trong cùng phạm vi được phép.
