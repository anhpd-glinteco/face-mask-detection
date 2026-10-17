# Danh mục minh chứng cần thu thập

Tất cả mục dưới đây là **chờ thu thập** nếu không có liên kết kết quả trong bàn giao.
Mỗi evidence ghi mã, phiên bản code/model/data, ngày, môi trường, lệnh/kịch bản,
kết quả mong đợi/thực tế, nơi lưu và checksum khi phù hợp.

| Mã | Nội dung | Phiên | Phục vụ |
|---|---|---|---|
| E01 | Nguồn/version/license URL, phạm vi sử dụng và quyết định dataset | P2 | #2; NFR01, SO4 |
| E02 | Manifest/split seed, hash duplicate, nguồn/scene và phân bố lớp; hạn chế metadata | P2 | #3; NFR05 |
| E03 | ADR chọn model, config/class map, seed/code SHA/log/checkpoint/resume | P2–P3 | #7/#8; Ch2,4 |
| E04 | Validation chọn threshold; test metrics theo lớp, mAP/confusion/error cases | P4 | #9; Ch5, SO6 |
| E05 | Weights checksum/version, API thật, readiness khi missing/broken weights | P5 | #6/#10; FR08 |
| E06 | Ảnh nhiều mặt/không mặt, bbox resize, lỗi/type giả/oversize/timeout | P6 | #11–#14; UC01 |
| E07 | Video pause/seek/source-change, single-flight, snapshot/timestamp/FPS | P7–P8 | #15/#17/#18; UC02 |
| E08 | Webcam quyền/ngắt/đến muộn/stop tracks; chạy camera thật | P8 | #16/#18; UC03 |
| E09 | Unit/integration/E2E logs + CI SHA; phân biệt mock và real-model | P9 | #19; SO6 |
| E10 | Compose startup/readiness thật; build API URL/CORS/network; setup sạch | P9 | #21; NFR06 |
| E11 | Preview HTTPS, host config/rollback; kiểm tra browser truy cập API | P10 | #22; NFR07 |
| E12 | Raw cold/warm benchmark, p50/p95/memory/error/FPS; budget và gate | P10 | #20/#23; NFR03 |
| E13 | Regression release candidate, blocker/limitations, tài liệu chạy được | P11 | #24/#25 |
| E14 | Báo cáo/slide, nguồn hình/tài liệu, bảng đóng góp thực tế, review | P12 | #26; SO2/SO3 |
| E15 | Demo video ba luồng, rehearsal, local fallback và release manifest | P13 | #27 |

Đặt số đo/hình thật vào chương tương ứng khi có E04–E13, không viết trước kết luận.
Tránh đưa media khuôn mặt vào repo; dùng dữ liệu có quyền sử dụng, lưu ngoài repo
và chỉ đưa hình minh họa vào bản nộp khi quyền sử dụng cho phép.

## Bảng đóng góp thực tế (điền từ bằng chứng)

| Thành viên | Dự kiến | Đã thực hiện + PR/commit/review | Hạn chế |
|---|---|---|---|
| Phùng Đức Anh | Web, điều phối | Chờ đối chiếu | Không suy ra tác giả từ phân công |
| Nguyễn Đình Luân Kiệt | ML/inference | Chờ đối chiếu | Như trên |
| Bùi Nguyên Hải | ML/inference | Chờ đối chiếu | Như trên |
| Bùi Ngọc Minh Hoàng | Web, QA/deploy | Chờ đối chiếu | Như trên |
