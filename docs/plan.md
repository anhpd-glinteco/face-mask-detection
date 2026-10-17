# Kế hoạch hoàn thành Face Mask Detection — 27/10/2026

Ngày chốt: 17/10/2026 (Asia/Saigon). Đây là kế hoạch thực thi đã được nhóm yêu cầu;
không phải báo cáo kết quả hoàn thành. Trạng thái thực tế ở [bàn giao](handoffs/README.md)
và [bảng hiện trạng](handoffs/2026-10-17-baseline.md).

## Mục tiêu và giới hạn

Ba luồng ảnh/video/webcam dùng model thật, preview triển khai, kiểm thử, benchmark,
báo cáo cuối, slide và video demo. Giữ ba lớp `with_mask`, `without_mask`,
`mask_worn_incorrectly`; `uncertain` là trạng thái suy ra từ threshold.
Không tài khoản, database, lịch sử, nhận diện danh tính, WebSocket hoặc lưu media.
Ưu tiên miễn phí; GPU notebook nếu được cấp, inference CPU và demo local dự phòng.

Nguồn: [Sheet kế hoạch](https://docs.google.com/spreadsheets/d/1n2fokJScS-Tv7vAsV9WobB7r12RVhAJN7JcVJNpqa5g/edit#gid=274651441),
[GitHub issues](https://github.com/anhpd-glinteco/face-mask-detection/issues).
Tuần 6: 14–20/10; tuần 7: 21–27/10. Không cập nhật phần trăm theo thời gian trôi qua.

## Phiên thực hiện

Mỗi phiên 1–3 giờ chủ động, tối đa một PR có mục tiêu rõ. Train dài chạy riêng có
checkpoint. Không gom toàn bộ kế hoạch thành một diff. Ngày là mục tiêu, không là
bằng chứng hoàn thành. Phụ thuộc: dữ liệu → train → model thật → ảnh → video/webcam
→ QA/deploy → nghiệm thu. Viết báo cáo theo từng đầu ra.

| Phiên | Mục tiêu ngày | Issue | Đầu ra và điều kiện kết thúc |
|---|---|---|---|
| P0 | 17/10 | #4–#6, #13, #21–#22 | Kiểm tra nền, audit toàn bộ issue, kế hoạch và bàn giao. Ghi lỗi môi trường riêng; không đóng issue chưa đủ DoD. |
| P1 | 17/10 | #26 | Yêu cầu FR/NFR, 3 đặc tả use case, sơ đồ, đề cương báo cáo và ma trận truy vết. Phân biệt thiết kế dự kiến với code hiện có. |
| P2 | 17–18/10 | #2, #3, #7 | Audit nguồn/license/consent và annotation ba nhãn; manifest split tái lập, kiểm tra duplicate/scene leakage, phân bố lớp. ADR chọn detector nhỏ cho CPU, class map, config và tài nguyên train. |
| P3 | 18–19/10 | #8 | Smoke train rồi baseline; lưu config, seed, dataset version, code SHA, logs/checkpoint; có lệnh resume khi notebook ngắt. |
| P4 | 19–20/10 | #9 | Chốt checkpoint/threshold bằng validation; đo test sau đó. Precision/recall/F1 theo lớp, mAP, confusion matrix và error analysis; không tuning trên test. |
| P5 | 19–20/10 | #6, #10 | Load/cache weights thật, checksum/version/class map, preprocessing/bbox ảnh gốc/timing thật; readiness và lỗi load an toàn. |
| P6 | 20/10 | #11–#14 | Overlay ảnh đúng khi resize, nhiều mặt/không mặt, lỗi/timeout/đổi ảnh; integration với model thật. |
| P7 | 21/10 | #15, #17 | Video local, sampling từng frame, một request đang chạy, không backlog; pause/seek/đổi nguồn hủy hoặc loại kết quả cũ. |
| P8 | 21–22/10 | #16, #18 | Webcam start/stop/quyền/lỗi/cleanup; dùng lại sampler, overlay gắn frame đã phân tích, thống kê processed FPS/latency. |
| P9 | 22–23/10 | #19, #21 | Test còn thiếu và Playwright ba luồng; Docker/Compose với weights thật, build-time API URL, CORS/network/readiness. |
| P10 | 23–24/10 | #20, #22, #23 | Preview HTTPS miễn phí khả thi, raw benchmark + script + môi trường; quyết định deployment gate và rollback. |
| P11 | 24–25/10 | #24, #25 | Regression bản ứng viên, sửa blocker; thử setup theo README, hoàn tất cards/test report/limitations; đóng băng tính năng. |
| P12 | 25–26/10 | #26 | Hoàn thiện báo cáo DOCX/PDF và slide từ evidence thật; kiểm tra sơ đồ, bảng biểu, nguồn và đóng góp. |
| P13 | 26–27/10 | #27 | Video ba luồng, rehearsal, demo local dự phòng, release/commit và danh mục bàn giao; 27/10 chỉ sửa lỗi nộp bài. |

Kiệt/Hải: ML/inference. Anh/Hoàng: web. Hoàng điều phối QA/deploy; cả nhóm tài liệu
và nghiệm thu. Phân công là dự kiến từ Sheet, không phải bằng chứng đóng góp thực tế.

## Mốc quyết định

- Hết 18/10 chưa chốt dữ liệu/quyền dùng/train: ghi blocker và điều chỉnh lịch ngay.
- Hết 20/10: mục tiêu baseline + ảnh thật. Không coi tuần 6 hoàn thành nếu thiếu
  video/webcam/benchmark. Có thể dựng UI/sampler bằng fixture trong khi chờ weights,
  nhưng không đóng issue integration thật bằng test mock.
- Hết 24/10: ba luồng, số đo và môi trường demo; dừng thử nhiều model/tuning rộng/
  trang trí UI. Sau 25/10 không thêm tính năng.
- Host miễn phí không chạy được: cung cấp Docker/local + video; #22 còn thiếu URL
  công khai. Không thay báo cáo model thật bằng số đo stub.

## Giao diện và kiểm chứng

Giữ API `POST /api/v1/detect`, multipart `image`, schema `1.0` khi tương thích;
video/webcam chỉ gửi frame, không upload cả video. `health` báo process sống;
`ready` phản ánh model dùng được. Weights lỗi/thiếu không được trả rỗng giả thành
không phát hiện. Đồng bộ JSON Schema, TypeScript, backend và fixture khi đổi contract.
Bbox pixel ảnh gốc, hữu hạn, `0 <= x1 < x2 <= width`, `0 <= y1 < y2 <= height`.

Kiểm thử theo [yêu cầu](report/requirements.md), [use case](report/use-cases.md)
và [test plan](test-plan.md). Fixture tự động tách biệt kiểm chứng weights/camera thật.
Benchmark: ít nhất 5 cold starts, 100 warm requests hợp lệ và 60 giây mỗi luồng
video/webcam; môi trường, sample size, raw data, p50/p95, memory, error rate, processed FPS.
Mục tiêu demo ban đầu: warm p95 ≤ 1 s/frame, cold readiness ≤ 30 s,
lỗi ngoài dự kiến ≤ 1% đầu vào hợp lệ. Chưa đo thì ghi chưa đo.
Không cam kết mAP trước baseline; report phải có ba lớp và hạn chế.

## Giữ context và lưu trữ

Đầu phiên đọc file này, bàn giao gần nhất, issue và `git status`; xác nhận nhánh/
commit trước sửa. Cuối phiên dùng [mẫu bàn giao](handoffs/TEMPLATE.md): kết quả,
test/lệnh/exit code, file/API đổi, commit/PR, artifact/checksum, blocker và bước kế.
Chỉ đóng issue đủ toàn bộ DoD. Không push/đóng issue hàng loạt để làm đẹp tiến độ.

- Source giữ tại repo hiện có; nhánh `codex/…`.
- Deliverables: `D:\Codex\outputs\face-mask-detection`.
- Downloads: `D:\Codex\downloads\face-mask-detection`.
- Data/runs/venv lớn: `D:\Codex\work\face-mask-detection`.
- Không commit dataset, weights, media khuôn mặt hoặc secret.

Rủi ro: ML bắt đầu từ đầu, còn 10 ngày; GPU/host miễn phí không bảo đảm; metadata
cảnh/nguồn có thể thiếu nên không được tuyên bố không leakage nếu chỉ kiểm tra hash.
