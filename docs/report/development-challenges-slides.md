# Khó khăn trong quá trình xây dựng sản phẩm

Dàn ý trình bày khoảng **3–5 phút** với giảng viên. Mỗi slide có tối đa ba ý để
có thể chuyển trực tiếp sang PowerPoint hoặc Canva. Các đường dẫn ở cuối từng
slide dùng để chuẩn bị và đối chiếu minh chứng, không cần đưa nguyên vào slide.

## Slide 1 — Từ ý tưởng đến hệ thống chạy được

- Sản phẩm cần phối hợp giao diện web, API suy luận và mô hình phát hiện; các phần phải thống nhất ba nhãn và cấu trúc kết quả.
- Nhóm chốt API contract và dựng luồng ảnh với detector stub để phát triển, kiểm tra giao diện và API theo từng phần.
- Luồng ảnh đã có nền tảng; mô hình thật chưa được tích hợp vào inference và chưa có kết quả triển khai được xác nhận.

**Lời trình bày gợi ý:** “Khó khăn đầu tiên là các phần frontend, backend và ML có thể phát triển theo những giả định khác nhau. Nhóm thống nhất đầu vào, đầu ra qua contract và dùng stub để kiểm tra luồng trước. Nhờ vậy có thể làm rõ phần tích hợp, nhưng cần phân biệt luồng stub với mô hình thật: mô hình chưa được đưa vào inference.”

**Minh chứng chuẩn bị:** [README dự án](../../README.md#api-contract), [báo cáo nguồn](README.md), [bàn giao nền P0](../handoffs/2026-10-17-baseline.md).

## Slide 2 — Chất lượng và nguồn gốc dữ liệu

- Audit 853 ảnh ban đầu phát hiện bbox vượt biên và ảnh trùng có annotation mâu thuẫn.
- Lượt curated sửa 12 bbox trong 11 ảnh, loại 10 ảnh xung đột và giữ lại 843 ảnh.
- Quyền sử dụng từng ảnh và consent vẫn chưa xác minh đầy đủ; công bố license của bộ dữ liệu không tự chứng minh quyền với từng ảnh.

**Lời trình bày gợi ý:** “Khó khăn lớn nhất nằm ở dữ liệu: dữ liệu tải về không đồng nghĩa với dữ liệu đã sạch và đủ căn cứ sử dụng. Nhóm đã sửa các hộp vượt biên và loại ảnh trùng có nhãn xung đột. Tuy vậy, bằng chứng hiện có chưa xác nhận quyền sử dụng và consent của từng ảnh, nên đây vẫn là giới hạn cần trình bày rõ.”

**Minh chứng chuẩn bị:** [dataset card](../dataset-card.md), [bàn giao review curated](../handoffs/2026-10-17-p2-review.md), [bàn giao provenance](../handoffs/2026-10-17-p2-provenance.md).

## Slide 3 — Chia dữ liệu để đánh giá đáng tin cậy

- Ảnh gần giống hoặc cùng cảnh có thể lọt vào cả train và validation/test, khiến đánh giá không phản ánh tốt khả năng tổng quát hóa.
- Đã gom 281 ảnh vào 38 nhóm ứng viên; 562 ảnh còn lại chưa rõ nhóm cảnh.
- Vì vậy chưa thể khẳng định split độc lập theo scene; trạng thái xác minh dữ liệu vẫn chưa đạt.

**Lời trình bày gợi ý:** “Ngay cả khi nhãn ảnh đã được rà soát, cách chia tập vẫn có thể tạo ra kết quả lạc quan nếu ảnh cùng cảnh nằm ở nhiều tập. Nhóm đã nhận diện được một phần nhóm ảnh nhưng metadata hiện có chưa đủ cho phần còn lại. Vì thế, chúng em chưa coi việc chia tập là đã giải quyết xong.”

**Minh chứng chuẩn bị:** [dataset card](../dataset-card.md), [bàn giao provenance](../handoffs/2026-10-17-p2-provenance.md), [danh mục minh chứng](evidence.md#danh-mục-minh-chứng-cần-thu-thập).

## Slide 4 — Huấn luyện trên CPU và lưu trạng thái

- Nhóm chọn SSDLite320 MobileNetV3 nhỏ, có sẵn trong TorchVision và phù hợp để thử baseline trên CPU; đây là lựa chọn theo thiết kế, chưa phải kết quả benchmark giá/tốc độ giữa các model.
- Baseline nội bộ đã chạy đủ **30 epoch trên CPU**, tổng thời gian train được ghi là **3.945 giây (khoảng 66 phút)**; checkpoint/resume giúp giữ tiến độ khi chạy lâu. Không thuê GPU cho lượt này.
- Chưa có mAP, accuracy hay đánh giá test; loss train giảm không đủ để kết luận mô hình tốt, và mô hình chưa tích hợp vào sản phẩm.

**Lời trình bày gợi ý:** “Một khó khăn thực tế là huấn luyện lâu: riêng lượt baseline này cần cộng dồn khoảng 66 phút chạy CPU cho 30 epoch, nên nhóm phải lưu checkpoint để có thể tiếp tục. Nhóm chọn một model gọn để phù hợp giới hạn máy; thuê GPU có thể đổi thời gian lấy chi phí, nhưng lần chạy này không dùng dịch vụ GPU trả phí và nhóm chưa benchmark chi phí giữa các lựa chọn. Chúng em cũng chưa đo mAP trên tập đánh giá nên chưa kết luận chất lượng.”

**Ghi chú kể chuyện:** Có thể đùa rằng “CPU cày lâu đến mức cả nhóm bắt đầu nhìn cái quạt”, nhưng không kể CPU đã chạm 90°C hay quạt đã phải bật lớn như sự kiện thật: lần chạy này không ghi nhận nhiệt độ hoặc tiếng quạt. Không đưa ra con số chi phí GPU vì không phát sinh lượt thuê và chưa có bảng giá/benchmark được lưu.

**Minh chứng chuẩn bị:** [ADR chọn baseline](../adr/0002-cpu-baseline.md), [bàn giao trainer synthetic](../handoffs/2026-10-17-p3-synthetic.md), [bàn giao baseline nội bộ mới nhất](../handoffs/2026-10-17-p3-internal.md).

## Slide 5 — Bài học và hướng xử lý tiếp

- Chất lượng, quyền sử dụng và cách chia dữ liệu quyết định liệu kết quả ML có đáng tin cậy hay không.
- API contract, kiểm thử và bàn giao theo phiên giúp phát triển các phần độc lập và tiếp tục công việc có căn cứ.
- Bước tiếp theo là xử lý các khoảng trống dữ liệu, đánh giá baseline trên validation rồi mới chạy test và xem xét tích hợp mô hình thật.

**Lời trình bày gợi ý:** “Qua quá trình làm, nhóm nhận ra tiến độ không chỉ phụ thuộc vào viết tính năng mà còn phụ thuộc vào bằng chứng dữ liệu và cách kiểm chứng. Contract, test và bàn giao giúp nhóm biết phần nào đã chạy, phần nào mới là thiết kế và việc gì còn tồn tại. Hướng tiếp theo là làm rõ dữ liệu, hoàn thành đánh giá mô hình rồi mới quyết định tích hợp.”

**Minh chứng chuẩn bị:** [kế hoạch phiên](../plan.md), [chỉ mục bàn giao](../handoffs/README.md), [danh mục minh chứng](evidence.md).

## Cập nhật sau mỗi phiên làm việc

Khi có phiên mới, cập nhật slide liên quan và bàn giao tương ứng bằng bốn thông tin:

1. Khó khăn hoặc câu hỏi thực tế đã gặp.
2. Cách xử lý đã thử và kết quả quan sát được.
3. Minh chứng có thể kiểm tra: commit/PR, lệnh và kết quả, artifact hoặc tài liệu nguồn.
4. Trạng thái còn lại và bước tiếp theo đã được cho phép.

Giữ rõ ranh giới giữa đã kiểm thử, đã chạy thử, đã đánh giá và đã tích hợp. Không
điền metric, quyền sử dụng hoặc đóng góp cá nhân nếu chưa có minh chứng.
