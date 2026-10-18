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

P2, 17/10/2026: E01–E03 có **bằng chứng một phần** trong
[bàn giao P2](../handoffs/2026-10-17-p2.md), [dataset card](../dataset-card.md),
[ADR 0002](../adr/0002-cpu-baseline.md) và `ml/reports/p2-audit.json`.
Audit 853 ảnh phát hiện 11 annotation vượt biên và 5 cặp duplicate có annotation
khác nhau; manifest ứng viên tái lập nhưng chưa được duyệt. Chưa có consent/
scene review đầy đủ, train logs/checkpoint hoặc model metrics. Không đánh dấu
E01–E03 hoàn tất bằng việc có source/config.

Tiếp P2, 17/10/2026: E02 bổ sung [curated audit](../../ml/reports/p2-curated-audit.json),
[quyết định review](../../ml/reviews/p2-curation.json) và
[bàn giao review](../handoffs/2026-10-17-p2-review.md). Rà 853 ảnh bằng contact sheet;
sửa 12 bbox trong 11 ảnh, loại 10 ảnh conflict, còn 843 ảnh/3,970 bbox. Audit
curated hai lần exit 0, manifest giống từng byte; 12 ML tests pass; 1,706 file nguồn
không đổi và khớp archive. CSV gom 281 ảnh vào 38 nhóm, còn 562 ảnh unresolved.
Không coi review bằng contact sheet là kiểm định mọi nhãn hoặc scene independence.
E01 chưa được duyệt quyền dùng, E02 còn thiếu scene evidence/người review độc lập;
E03 vẫn chỉ ở mức ADR/config, chưa có model artifact hoặc metric.

P2 provenance, 17/10/2026: E01 bổ sung bản lưu MakeML 26/05/2020 và 28/02/2022,
công bố Public Domain/PDM và metadata Kaggle CC0; chưa chứng minh quyền từng ảnh
hoặc consent. E02 bổ sung inventory ZIP và kiểm tra metadata toàn bộ 853 PNG/XML,
đánh giá 38 nhóm/562 ảnh unresolved theo bằng chứng mới; không tìm được mapping
scene/source nên CSV giữ nguyên. Xem [bàn giao provenance](../handoffs/2026-10-17-p2-provenance.md)
và [dataset card](../dataset-card.md). Raw responses/checksum/metadata lưu ngoài
repo tại `D:\Codex\outputs\face-mask-detection\p2-provenance`; E01/E02 chưa hoàn tất,
`p3_ready=false`. Không chạy lại train hoặc audit split vì đầu vào không đổi.

P4 nội bộ, 18/10/2026: E04 có validation chọn ngưỡng 0,15 trên 98 ảnh, sau đó
test riêng 75 ảnh. Test macro F1 0,2061, AP50 0,1792, mAP50:95 0,0820; có
precision/recall/F1/AP theo lớp, confusion matrix, error counts và biểu đồ F1.
Xem [model card](../model-card.md) và [bàn giao P4](../handoffs/2026-10-18-p4-internal-evaluation.md).
Đây là baseline nội bộ chất lượng thấp, không phải nghiệm thu model dùng thực tế;
quyền ảnh/scene chưa xác minh, weights không publish/deploy. Không suy diễn
nguyên nhân ánh sáng/góc mặt từ phân tích bbox chưa review trực quan.

## Bảng đóng góp thực tế (điền từ bằng chứng)

| Thành viên | Dự kiến | Đã thực hiện + PR/commit/review | Hạn chế |
|---|---|---|---|
| Phùng Đức Anh | Web, điều phối | Chờ đối chiếu | Không suy ra tác giả từ phân công |
| Nguyễn Đình Luân Kiệt | ML/inference | Chờ đối chiếu | Như trên |
| Bùi Nguyên Hải | ML/inference | Chờ đối chiếu | Như trên |
| Bùi Ngọc Minh Hoàng | Web, QA/deploy | Chờ đối chiếu | Như trên |
