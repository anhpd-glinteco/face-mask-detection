# Yêu cầu và truy vết — P1

Ngày: 17/10/2026. Actor duy nhất trong MVP: người sử dụng trình duyệt.
Model nhận diện trạng thái khẩu trang, không nhận diện danh tính hoặc người duy nhất.
Thống kê đếm detection **trong frame**, không cộng thành số người duy nhất qua video.
Các yêu cầu dưới đây là mục tiêu; trạng thái ở cột cuối không suy ra từ việc có tài liệu.

## Chức năng

| ID | Yêu cầu và nghiệm thu | Use case | Issue | Kiểm chứng / mục báo cáo | Hiện tại |
|---|---|---|---|---|---|
| FR01 | Chọn ảnh JPEG/PNG/WebP ≤ 10 MiB, preview; loại file lỗi/type giả/quá lớn | UC01 | #11, #13, #14 | page.test.tsx; test_api.py; tích hợp ảnh thật / Ch3–5 | Có validation/test cơ bản; thiếu kiểm tra type giả và model thật |
| FR02 | Mỗi mặt: nhãn, confidence, bbox ảnh gốc; overlay đúng khi resize, nhiều mặt | UC01–03 | #6, #10, #12, #18 | Fixture bbox; ảnh thật và ảnh chụp sau resize / Ch3–5 | Danh sách có; overlay/model chưa có |
| FR03 | Video chỉ đọc local; trích/gửi frame, pause/resume/seek và cleanup | UC02 | #15, #17 | Unit sampler; E2E video / Ch3–5 | P7 fixture đã kiểm chứng; chưa model thật/review độc lập |
| FR04 | Webcam chỉ mở sau thao tác; start/stop/quyền/ngắt camera/cleanup | UC03 | #16, #18 | Mock permissions + E2E; camera thật / Ch3–5 | Chưa có |
| FR05 | Không chồng request trong một vòng sampling; không backlog; bỏ kết quả cũ | UC02–03 | #17, #18 | Counter đồng thời ≤ 1; delayed response/seek/source change / Ch3–5 | P7 video fixture đã kiểm chứng; webcam/model thật chưa có |
| FR06 | Phân biệt loading, lỗi, không mặt, chưa sẵn sàng; retry/cancel hợp lý | UC01–03 | #10, #13, #14 | HTTP/network/timeout/weights lỗi; empty model thật / Ch3–5 | Một phần ở luồng ảnh stub |
| FR07 | Hiển thị thống kê frame gần nhất, processed FPS/latency; không gọi là camera FPS | UC02–03 | #18, #20 | Script 60 giây và số đếm đối chiếu / Ch4–5 | Chưa có |
| FR08 | Hiển thị model version, schema và readiness thật; timing đo thật | UC01–03 | #6, #10, #23 | Contract fixtures và API model thật / Ch3–5 | Stub/version/timing giả định bằng 0 |

## Phi chức năng

| ID | Yêu cầu và nghiệm thu | Issue | Bằng chứng / mục báo cáo | Hiện tại |
|---|---|---|---|---|
| NFR01 | Không lưu media/nhận diện danh tính; không log payload; ghi nguồn/license/consent | #2, #25 | Dataset card, review logs/storage / Ch1,4,5 | Chính sách có; dataset chưa chốt |
| NFR02 | Decode và giới hạn payload tại server; bbox/confidence hữu hạn, đúng giới hạn; CORS allowlist | #6, #13, #19 | Boundary tests, contract và config / Ch3–5 | Validation một phần; chưa đủ bbox bounds |
| NFR03 | Warm p95 ≤ 1 s/frame, cold ready ≤ 30 s; lỗi ngoài dự kiến ≤ 1% request hợp lệ | #20, #23 | ≥ 5 cold, ≥ 100 warm, raw data + môi trường / Ch5 | Mục tiêu đề xuất; chưa đo |
| NFR04 | Có label, keyboard control, status/error đọc được; lỗi không chỉ phân biệt bằng màu | #12, #18, #19 | RTL + kiểm tra bàn phím và UI / Ch3–5 | RTL accessibility ảnh cơ bản |
| NFR05 | Split tái lập, không trùng nguồn/cảnh giữa tập; config/seed/code/weights checksum | #3, #7–#9 | Manifest, audit leakage và logs / Ch4–5 | Chưa có; thiếu scene metadata phải nêu hạn chế |
| NFR06 | CI lint/typecheck/test/build; Docker startup, readiness và hướng dẫn tái hiện | #19, #21, #22 | CI run mới, compose/model thật và setup sạch / Ch4–5 | CI/Docker khung có; chưa xác minh model thật |
| NFR07 | Preview HTTPS; webcam hoạt động trong secure context; demo local dự phòng | #22, #23, #27 | URL, smoke/rehearsal, rollback / Ch4–5 | Chưa có URL kiểm chứng |

## Contract cần chốt ở P5/P6

`POST /api/v1/detect` nhận field `image`; response `schema_version=1.0`, `image`,
`model`, `detections`, `timing_ms`. Không thêm API video riêng.
Bbox pixel ảnh gốc: `0 <= x1 < x2 <= width`, `0 <= y1 < y2 <= height`.
Confidence hữu hạn trong [0,1]; class ID khớp class map trong model artifact.

Lỗi mục tiêu: 413 payload quá lớn, 415 type không hỗ trợ/không khớp định dạng được
cho phép, 422 ảnh không decode được; 503 khi model chưa sẵn sàng. Timeout/mạng
hiển thị lỗi rõ và không ghi đè kết quả nguồn mới. Không coi 503 là empty success.
`uncertain` là cách trình bày confidence thấp theo threshold chốt bằng validation;
schema giữ ba nhãn gốc. Test threshold ngay dưới/bằng/trên điểm cắt.

Khi có test/PR thật, thêm tên test, commit/CI URL và mã evidence vào từng dòng;
đường dẫn test dự kiến không có nghĩa test đã tồn tại hoặc đã pass.
