# Model Card

Status: **stub — chưa tích hợp model/weights**.

P2 đã chọn kiến trúc baseline SSDLite320 MobileNetV3 và class IDs trong
[ADR 0002](adr/0002-cpu-baseline.md), config ở `ml/configs/baseline.json`.
Đây là lựa chọn thiết kế, chưa khởi tạo/train/benchmark. Không dùng pretrained
weights trong baseline dự kiến; chưa có checkpoint, metric hoặc checksum weights.
P3 bị chặn bởi data review; xem [dataset card](dataset-card.md).

Model card phải ghi implementation/license, pretrained weights/license, dataset version, config/seed, preprocessing, class map, metrics thật theo split, error analysis, limitations và SHA-256 của weights.

