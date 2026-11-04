# Bộ nộp báo cáo cuối kỳ lần 1

Hạn nộp theo thông báo lớp: **08/11/2026**. Mục tiêu nội bộ: chốt bộ nộp
**05/11**, dành 06–07/11 sửa lỗi và bổ sung thông tin. Ưu tiên bài nộp và demo
local; cải thiện model #44 được hoãn, không train lại hoặc tuning trên test.

## Tài liệu và phiên bản

- Báo cáo nền: bản theo mẫu cập nhật PlantUML ngày 01/11, giữ nguyên bản gốc.
- Nguồn chỉnh văn phong: `docs/report/p12-template/bao-cao.md`.
- Đầu ra phiên này: `D:/Codex/outputs/face-mask-detection/submission-2026-11-02`.
- Bản sản phẩm dùng rehearsal: PR #49, nhánh `feat/detection-uncertainty`,
  commit `a341b6bdc101b09d89fddb713d1158bdf28ab32f`.
  Nhánh tài liệu không chứa thay đổi UI đó; không chạy nhầm nhánh hoặc gọi PR là đã merge.
- Giữ API/schema, dependencies, checkpoint P4 và số đo P4/P11 không đổi.
  Nghiệm thu mới có log riêng, không thay kết quả lịch sử.

## Các phiên đến ngày chốt

| Thời điểm mục tiêu | Việc và điều kiện kết thúc |
| --- | --- |
| 02–03/11 | Chỉnh văn phong báo cáo, đối chiếu bảng/số liệu/trích dẫn; giữ bố cục mẫu, xuất DOCX/PDF và xem từng trang. |
| 03/11 | Điền MSSV, khóa và đóng góp từ thông tin nhóm xác nhận; rà bìa, mục lục, sơ đồ và trạng thái triển khai. |
| 04/11 | Rehearsal ảnh/video/webcam laptop với model thật; log ít nhất 60 giây cho video và camera, kiểm tra quyền, stop và đổi chế độ. Có thể làm sớm khi môi trường sẵn sàng. |
| 05/11 | Chốt file báo cáo, file link chương trình, bộ dự phòng; rà slide hiện có và quay video nếu đã có đồng ý lưu hình ảnh. |
| 06–07/11 | Sửa lỗi nộp bài hoặc bổ sung thông tin đã được xác nhận; không mở thêm tính năng. |

## Checklist trước nộp

- [ ] `DACN_1_BaoCao_v1.docx`: nội dung và thông tin nhóm được xác nhận; PDF để đối chiếu.
- [ ] `DACN_1_ChuongTrinh.docx`: repository, commit demo, hướng dẫn native local và giới hạn.
- [ ] Đối chiếu hạng mục BM124 trong thông báo lớp; không tự tạo mẫu hoặc bỏ yêu cầu này khi chưa làm rõ.
- [ ] MSSV, khóa và đóng góp cá nhân; không tự suy đoán hoặc thêm chữ ký.
- [ ] Rà lại slide theo báo cáo cuối, rehearsal và video P13; không gọi log tự động là video demo.
- [ ] Người dùng kiểm tra đèn camera tắt sau stop; ngắt thiết bị vật lý chưa thay bằng mô phỏng track.
- [ ] PR, CI, issue và handoff phản ánh đúng PASS/FAIL/BLOCKED/NOT_RUN.

Nguồn yêu cầu nộp là ảnh thông báo do người dùng cung cấp trong chat ngày 02/11.
Tên file lấy số nhóm 1 từ báo cáo hiện có; cần đối chiếu nếu lớp yêu cầu định dạng khác.
Thông báo ghi file link trong file text nhưng ví dụ tên là DOCX; chuẩn bị DOCX theo
ví dụ và TXT cùng nội dung để dự phòng, không tự nộp lên lớp.

## Giới hạn

Demo dùng localhost, webcam tích hợp laptop và model nội bộ. Không lưu mặt vào
evidence mặc định, không phát hành weights/media hoặc deploy công khai.
Chất lượng P4 còn thấp, quyền từng ảnh và scene independence chưa xác minh;
deployment gate vẫn **CLOSED**. #2/#3/#22/#44 không được đóng bởi việc chỉnh báo cáo.
Docker #45 được theo dõi riêng, không là điều kiện để xuất báo cáo hoặc chạy native.
