# Bàn giao các phiên

Đọc [kế hoạch](../plan.md) trước khi thực hiện. Đây là chỉ mục tiến độ, không là
phần trăm hoàn thành sản phẩm.

| Phiên | Trạng thái | Bàn giao |
|---|---|---|
| P0 | Đã kiểm tra nền; Docker runtime và browser→API smoke chưa xác minh | [Hiện trạng và checks](2026-10-17-baseline.md) |
| P1 | Bộ phân tích/thiết kế ban đầu đã soạn; chưa là thiết kế nghiệm thu | [Bàn giao P1](2026-10-17-p1.md) |
| P2 | Khôi phục công bố MakeML; curated pass kỹ thuật, còn quyền từng ảnh và scene grouping | [Provenance mới nhất](2026-10-17-p2-provenance.md), [review curated](2026-10-17-p2-review.md), [audit gốc](2026-10-17-p2.md) |
| P3–P13 | Chưa thực hiện | Đọc đầu vào/đầu ra tương ứng trong kế hoạch |

Phiên kế tiếp: **hoàn tất gate P2 — quyền dùng và scene/source grouping**; bản
curated đã xử lý bbox vượt biên và duplicate conflicts. Còn 562 ảnh chưa rõ nhóm
cảnh và các nhóm ứng viên cần xác nhận. Chưa bắt đầu P3/train; không làm lại audit
gốc hoặc sửa lại bbox đã có bằng chứng nếu không xuất hiện dữ kiện mới.
Đã khôi phục trang MakeML qua Wayback; metadata toàn bộ PNG/XML không cung cấp
mapping scene/source, CSV không đổi. Bước tiếp cần bằng chứng từng nguồn hoặc
quyết định có ghi rõ giới hạn của nhóm phụ trách, không lặp lại tra cứu đã lưu.

Khi chuyển chat, gửi:

> Tiếp tục kế hoạch trong docs/plan.md. Đọc docs/handoffs/README.md và bàn giao
> gần nhất, kiểm tra git status/branch/log trước khi sửa. Làm phiên kế tiếp theo
> phụ thuộc, ghi bằng chứng và bàn giao; không làm lại phần đã xác minh, không
> khai hoàn thành model/deploy khi chưa có artifact và số đo thật.
