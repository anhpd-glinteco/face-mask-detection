# Bàn giao các phiên

Đọc [kế hoạch](../plan.md) trước khi thực hiện. Đây là chỉ mục tiến độ, không là
phần trăm hoàn thành sản phẩm.

| Phiên | Trạng thái | Bàn giao |
|---|---|---|
| P0 | Đã kiểm tra nền; Docker runtime và browser→API smoke chưa xác minh | [Hiện trạng và checks](2026-10-17-baseline.md) |
| P1 | Bộ phân tích/thiết kế ban đầu đã soạn; chưa là thiết kế nghiệm thu | [Bàn giao P1](2026-10-17-p1.md) |
| P2 | Đã audit dữ liệu, có manifest ứng viên và ADR/config; chưa đạt gate train | [Bàn giao P2](2026-10-17-p2.md) |
| P3–P13 | Chưa thực hiện | Đọc đầu vào/đầu ra tương ứng trong kế hoạch |

Phiên kế tiếp: **hoàn tất gate P2 — review quyền dùng, bbox lỗi, duplicate conflicts
và scene grouping**. Chưa bắt đầu P3/train. Không viết lại web/API khung đã có.

Khi chuyển chat, gửi:

> Tiếp tục kế hoạch trong docs/plan.md. Đọc docs/handoffs/README.md và bàn giao
> gần nhất, kiểm tra git status/branch/log trước khi sửa. Làm phiên kế tiếp theo
> phụ thuộc, ghi bằng chứng và bàn giao; không làm lại phần đã xác minh, không
> khai hoàn thành model/deploy khi chưa có artifact và số đo thật.
