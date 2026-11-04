# Tổng hợp tiến độ tuần 1 đến tuần 7

Lớp: DACN_20261IT6150003. Cập nhật hồi cứu ngày 02/11/2026 theo yêu cầu nhóm.
100% là hoàn tất hồ sơ tiến độ tuần; nghiệm thu sản phẩm còn theo issue và bằng chứng.
Phân công theo kế hoạch nhóm, không xác nhận tác giả từng commit. Giờ họp hồi dựng cần xác nhận.

## Tuần 1

- Phụ trách: Phùng Đức Anh điều phối; Nguyễn Đình Luân Kiệt, Bùi Nguyên Hải, Bùi Ngọc Minh Hoàng phối hợp.
- Công việc: Anh tổng hợp yêu cầu, khởi tạo repo/backlog và quy tắc Git; Kiệt, Hải rà bài toán và ba nhãn khẩu trang; Hoàng đề xuất kiến trúc web/API, phạm vi kiểm thử. Cả nhóm thống nhất ảnh/video/webcam, không nhận diện danh tính, không lưu lịch sử media.
- Đầu ra: README, backlog GitHub, yêu cầu/use case, sơ đồ kiến trúc và API contract.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: Không suy ngày hoàn thành thực tế từ mốc tuần dự kiến.
- Bước tiếp: Kiệt/Hải rà dữ liệu và chia tập; Anh/Hoàng dựng giao diện và contract.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/blob/a2cc3f5/docs/plan.md; https://github.com/anhpd-glinteco/face-mask-detection/tree/a2cc3f5/docs/report

## Tuần 2

- Phụ trách: Nguyễn Đình Luân Kiệt: dữ liệu/split; Bùi Nguyên Hải: kiểm tra nhãn/API; Phùng Đức Anh, Bùi Ngọc Minh Hoàng: khung web và contract.
- Công việc: Kiệt kiểm kê PNG/XML, hash, duplicate và manifest chia tập; Hải rà bbox/nhãn và dataset card. Anh dựng Next.js; Hoàng phối hợp FastAPI health/ready/detect và JSON Schema, kiểm tra kết nối frontend/API.
- Đầu ra: Curated 843 ảnh/3.970 bbox; manifest train 670/validation 98/test 75; dataset card, khung web/API và contract.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: Quyền từng ảnh và scene independence chưa xác minh; #2/#3 vẫn mở, không công bố weights.
- Bước tiếp: Hải huấn luyện baseline; Kiệt kiểm tra manifest/config và hỗ trợ đánh giá.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/pull/28; https://github.com/anhpd-glinteco/face-mask-detection/issues/2; https://github.com/anhpd-glinteco/face-mask-detection/issues/3

## Tuần 3

- Phụ trách: Bùi Nguyên Hải: train/evaluation/inference; Nguyễn Đình Luân Kiệt: manifest, cấu hình và rà số đo.
- Công việc: Hải cấu hình SSDLite320 MobileNetV3 Large, train baseline 30 epoch, lưu checkpoint/config/seed; chọn ngưỡng trên validation rồi đo test và tích hợp adapter. Kiệt kiểm tra split, checksum, phân bố lớp và error analysis; hai bạn cập nhật model card.
- Đầu ra: Checkpoint nội bộ; ngưỡng 0,15; test macro F1 0,2061, mAP50:95 0,0820; báo cáo theo lớp và adapter thật.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: Chất lượng hai lớp ít mẫu thấp; cải thiện model #44 hoãn đến sau bộ nộp. Deployment gate CLOSED.
- Bước tiếp: Anh/Hoàng nối giao diện ảnh với contract và adapter; giữ checkpoint đã pin.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/pull/30; https://github.com/anhpd-glinteco/face-mask-detection/pull/32; https://github.com/anhpd-glinteco/face-mask-detection/pull/33; https://github.com/anhpd-glinteco/face-mask-detection/issues/44

## Tuần 4

- Phụ trách: Phùng Đức Anh: giao diện ảnh/API; Bùi Ngọc Minh Hoàng: overlay, xử lý lỗi và kiểm thử; Hải hỗ trợ adapter.
- Công việc: Anh hoàn thiện upload/preview và kết nối API; Hoàng phối hợp Canvas bbox, resize, loading/empty/error/retry, hủy kết quả cũ khi thay ảnh. Hai bạn kiểm thử file sai loại/quá lớn, response sai và readiness 503; Hải hỗ trợ đối chiếu model version.
- Đầu ra: Luồng ảnh, overlay và kết quả kiểm thử; đường browser→API→checkpoint thật được kiểm tra riêng trên ảnh synthetic.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: UI dưới 0,15 hiển thị Chưa chắc chắn; fixture và model thật là hai loại bằng chứng riêng.
- Bước tiếp: Hoàng làm sampler/video/webcam; Anh phối hợp hiển thị snapshot và thống kê.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/pull/34; https://github.com/anhpd-glinteco/face-mask-detection/pull/47; https://github.com/anhpd-glinteco/face-mask-detection/pull/49

## Tuần 5

- Phụ trách: Bùi Ngọc Minh Hoàng: video/webcam/sampler; Phùng Đức Anh: UI kết quả/thống kê; Hải hỗ trợ API.
- Công việc: Hoàng xây dựng lấy mẫu frame HTTP 200 ms, một tác vụ đang chạy, bỏ lượt khi bận; xử lý pause/seek/stop và stream cleanup. Anh phối hợp snapshot, bbox và FPS/latency theo frame. Hai bạn kiểm thử phản hồi muộn và quyền camera bằng fixture.
- Đầu ra: VideoWorkspace, WebcamWorkspace, shared sampler, kiểm thử start/stop/quyền/cleanup và benchmark synthetic.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: Bằng chứng tuần dùng webcam synthetic. Retest laptop 02/11 chạy >60 giây, track cleanup đạt; latency mới chưa đạt mọi budget, chưa quan sát đèn/ngắt vật lý.
- Bước tiếp: Hoàng tổng hợp CI/regression/benchmark; cả nhóm rà lỗi và tài liệu.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/pull/35; https://github.com/anhpd-glinteco/face-mask-detection/pull/36; https://github.com/anhpd-glinteco/face-mask-detection/issues/43

## Tuần 6

- Phụ trách: Bùi Ngọc Minh Hoàng: QA/CI/benchmark; Phùng Đức Anh: UI/E2E; Kiệt/Hải: kiểm thử ML và API.
- Công việc: Hoàng tổng hợp unit/integration/E2E, Docker/Compose CI và benchmark local; Anh hỗ trợ browser checks và sửa race video; Hải/Kiệt rà backend/ML tests, checkpoint và raw metrics. Phân biệt fixture, model thật và môi trường local/hosted.
- Đầu ra: P11: 81 frontend, 24 backend, 37 ML, 3 benchmark self-check và 4 browser fixture tests; benchmark local, CI và regression report.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: P11 warm p95 36,89 ms, video/webcam synthetic 4,91/4,99 FPS là lịch sử; Docker local #45 và public preview còn thiếu. Không ghi đã deploy.
- Bước tiếp: Cả nhóm tổng hợp báo cáo/slide; Anh biên tập nội dung, Hoàng rà QA, Kiệt/Hải rà model và dữ liệu.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/pull/37; https://github.com/anhpd-glinteco/face-mask-detection/pull/38; https://github.com/anhpd-glinteco/face-mask-detection/pull/39; https://github.com/anhpd-glinteco/face-mask-detection/pull/51; https://github.com/anhpd-glinteco/face-mask-detection/issues/45

## Tuần 7

- Phụ trách: Phùng Đức Anh: tổng hợp báo cáo/slide; Kiệt/Hải: dữ liệu/model; Hoàng: QA/hướng dẫn/demo; cả nhóm rà nội dung.
- Công việc: Anh tổng hợp báo cáo theo mẫu và slide; Kiệt/Hải rà số liệu, nguồn dữ liệu và giới hạn baseline; Hoàng rà kiểm thử, hướng dẫn chạy, uncertainty và kịch bản demo. Cả nhóm liên kết PR/evidence và ghi phần cần hoàn thiện trước nộp.
- Đầu ra: Báo cáo DOCX/PDF theo mẫu, 14 slide bản review, README/cards và handoff; bản PlantUML cập nhật 01/11, văn phong/MSSV/lớp cập nhật 02/11.
- Tiến độ hồ sơ tuần: 100%.
- Giới hạn và phần chuyển tiếp: Bộ cuối còn khóa đào tạo, xác nhận biên bản/đóng góp và video demo P13; không ghi có video hay nghiệm thu GV khi chưa có.
- Bước tiếp: 02–05/11: chốt văn phong, MSSV/lớp, webcam laptop, file link và đóng gói; 06–07/11 dự phòng.
- Minh chứng: https://github.com/anhpd-glinteco/face-mask-detection/pull/40; https://github.com/anhpd-glinteco/face-mask-detection/pull/41; https://github.com/anhpd-glinteco/face-mask-detection/pull/49; https://github.com/anhpd-glinteco/face-mask-detection/pull/50; https://github.com/anhpd-glinteco/face-mask-detection/pull/52; https://github.com/anhpd-glinteco/face-mask-detection/issues/26; https://github.com/anhpd-glinteco/face-mask-detection/issues/27
