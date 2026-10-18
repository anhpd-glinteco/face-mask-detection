# Bàn giao các phiên

Đọc [kế hoạch](../plan.md) trước khi thực hiện. Đây là chỉ mục tiến độ, không là
phần trăm hoàn thành sản phẩm.

| Phiên | Trạng thái | Bàn giao |
|---|---|---|
| P0 | Đã kiểm tra nền; Docker runtime và browser→API smoke chưa xác minh | [Hiện trạng và checks](2026-10-17-baseline.md) |
| P1 | Bộ phân tích/thiết kế ban đầu đã soạn; chưa là thiết kế nghiệm thu | [Bàn giao P1](2026-10-17-p1.md) |
| P2 | Khôi phục công bố MakeML; curated pass kỹ thuật, còn quyền từng ảnh và scene grouping | [Provenance mới nhất](2026-10-17-p2-provenance.md), [review curated](2026-10-17-p2-review.md), [audit gốc](2026-10-17-p2.md) |
| P3 nội bộ | Baseline scratch 30 epoch hoàn tất; quyền ảnh/scene chưa xác minh, chưa đánh giá chất lượng | [Bàn giao P3 nội bộ](2026-10-17-p3-internal.md), [trainer synthetic](2026-10-17-p3-synthetic.md) |
| P4 nội bộ | Đã chọn ngưỡng validation và đánh giá test; chất lượng thấp, không deploy | [Bàn giao P4](2026-10-18-p4-internal-evaluation.md) |
| P5 nền tảng | Adapter/readiness và fixture; chưa tích hợp checkpoint P4 | [Bàn giao P5](2026-10-18-p5-inference-fixtures.md) |
| P6 frontend | PR #34 đã push, #12/#13 đã đóng; #6/#10/#11/#14 còn mở, chờ review/CI | [Bàn giao P6](2026-10-18-p6-image-fixtures.md) |
| P7–P13 | Chưa thực hiện | Đọc đầu vào/đầu ra tương ứng trong kế hoạch |

P4 internal evaluation completed: fixed epoch 30, validation threshold 0.15,
test macro F1 0.2061 and mAP50:95 0.0820. P5 prepares the service using synthetic
fixtures; current internal weights are not approved for publication/deployment.
Rights and scene/source grouping remain an independent P2 follow-up; internal
evaluation does not change their verification status or `p3_ready=false`.

P2 follow-up riêng: **quyền dùng và scene/source grouping**; bản
curated đã xử lý bbox vượt biên và duplicate conflicts. Còn 562 ảnh chưa rõ nhóm
cảnh và các nhóm ứng viên cần xác nhận. Phạm vi cũ chưa cho train; quyết định nội bộ mới ở trên thay thế giới hạn này; không làm lại audit
gốc hoặc sửa lại bbox đã có bằng chứng nếu không xuất hiện dữ kiện mới.
Đã khôi phục trang MakeML qua Wayback; metadata toàn bộ PNG/XML không cung cấp
mapping scene/source, CSV không đổi. Bước tiếp cần bằng chứng từng nguồn hoặc
quyết định có ghi rõ giới hạn của nhóm phụ trách, không lặp lại tra cứu đã lưu.

"Gate P2" ở đây là các mục dữ liệu chưa xác minh (#2/#3), không phải thiếu
quyền thao tác repo từ người dùng. Phần chọn kiến trúc/config (#7) và phần trainer
synthetic đã có đầu ra riêng; việc nghiệm thu chúng không đồng nghĩa dataset đã
được xác minh hoặc model đã được đánh giá chất lượng (#9).

Khi chuyển chat, gửi:

> Tiếp tục kế hoạch trong docs/plan.md. Đọc docs/handoffs/README.md và bàn giao
> gần nhất, kiểm tra git status/branch/log trước khi sửa. Làm phiên kế tiếp theo
> phụ thuộc, ghi bằng chứng và bàn giao; không làm lại phần đã xác minh, không
> khai hoàn thành model/deploy khi chưa có artifact và số đo thật.
