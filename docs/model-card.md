# Model Card

Status, 18/10/2026: **baseline nội bộ đã train/đánh giá; API vẫn dùng stub**.
Chất lượng thấp; chưa đủ cơ sở sử dụng thực tế. Không phát hành weights/media hoặc
deploy checkpoint này. Quyền ảnh và scene independence chưa xác minh;
`p3_ready=false`, #2/#3 vẫn mở. Xem [dataset card](dataset-card.md).

## Model và dữ liệu

- TorchVision SSDLite320 MobileNetV3 Large, scratch, không pretrained weights.
  Python 3.12.14, Torch 2.9.0+cpu, TorchVision 0.24.0+cpu; CPU hai luồng.
  Torch/TorchVision dùng BSD-3-Clause; không tải weights có license riêng.
  License repo chưa chốt; metadata dataset không xác minh quyền từng ảnh.
- Config: `ml/configs/internal-baseline.json`; seed 42; SGD/StepLR, batch 2,
  30 epoch. Checkpoint cố định epoch 30, không phải epoch tốt nhất đã được chọn.
  Kiến trúc và class IDs: [ADR 0002](adr/0002-cpu-baseline.md).
- Dataset `andrewmvd/face-mask-detection` version 1, curated-v1: 843 ảnh;
  train/validation/test = 670/98/75. Manifest SHA-256:
  `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3`.
- Weights SHA-256:
  `1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
  Train source commit `24ce42a4bb8157e1387a239e322ea1397dfbc6fe`.
- RGB float [0,1], xyxy pixel ảnh gốc; detector tự resize 320. Background ID 0;
  `with_mask`=1, `without_mask`=2, `mask_worn_incorrectly`=3.
  `uncertain` không phải lớp train; P4 chưa triển khai hành vi này trong API.

## Đánh giá P4

Validation 98 ảnh/565 bbox chọn ngưỡng chung **0,15** bằng macro F1 cao nhất trên
grid 0,05–0,95, bước 0,05; hòa chọn ngưỡng cao hơn. Khóa quyết định trước khi mở
test 75 ảnh/360 bbox. Không tuning trên test, không train lại.

| Split | Macro precision | Macro recall | Macro F1 | AP50 | mAP50:95 |
|---|---:|---:|---:|---:|---:|
| Validation | 0,3182 | 0,1560 | 0,1771 | 0,1153 | 0,0495 |
| Test | 0,2393 | 0,1975 | 0,2061 | 0,1792 | 0,0820 |

Test tại ngưỡng 0,15, IoU 0,5:

| Lớp | Số bbox | Precision | Recall | F1 | AP50 | mAP50:95 |
|---|---:|---:|---:|---:|---:|---:|
| with_mask | 299 | 0,4321 | 0,4682 | 0,4494 | 0,4251 | 0,2034 |
| without_mask | 49 | 0,1429 | 0,0408 | 0,0635 | 0,0190 | 0,0086 |
| mask_worn_incorrectly | 12 | 0,1429 | 0,0833 | 0,1053 | 0,0936 | 0,0340 |

PR/F1/AP ghép cùng lớp, confidence giảm dần, một đối một với truth chưa ghép có
IoU cao nhất. AP nội suy 101 điểm recall, IoU 0,50–0,95 bước 0,05, trước ngưỡng
vận hành. Score floor 0,001; NMS IoU 0,55 theo lớp; top-k 300 mỗi lớp; tối đa
100 detections mỗi ảnh. Không dùng official COCO evaluator hoặc area/crowd rules.
Không gọi các số đo này là accuracy hay benchmark tốc độ triển khai.

## Confusion và lỗi trên test

Hàng là nhãn thật, cột là dự đoán; background biểu diễn unmatched. Ghép không xét
lớp tại IoU>=0,5, nên đường chéo không bắt buộc bằng TP của PR/F1 vốn ghép cùng lớp.

| Truth / Prediction | background | with_mask | without_mask | mask_worn_incorrectly |
|---|---:|---:|---:|---:|
| background | 0 | 181 | 13 | 6 |
| with_mask | 159 | 140 | 0 | 0 |
| without_mask | 47 | 1 | 0 | 1 |
| mask_worn_incorrectly | 9 | 2 | 1 | 0 |

Diagnostic counts: 215 truth bị bỏ sót, 5 nhầm lớp, 94 dự đoán lỗi định vị và
106 dự đoán dư. Lỗi định vị là unmatched prediction có truth cùng lớp ở
0,1<=IoU<0,5; unmatched prediction còn lại là dư, kể cả duplicate. Một bbox
định vị sai có thể đồng thời để lại một truth bị bỏ sót.

- Recall hai lớp ít mẫu rất thấp: chỉ ghép đúng 2/49 `without_mask`, 1/12
  `mask_worn_incorrectly` trong phép đo cùng lớp. Không đủ tin cậy để cảnh báo.
- `images/maksssksksss280.png`: 19 missed, 7 localization, 7 extra;
  `images/maksssksksss424.png`: 22 missed, 0 localization, 5 extra.
  Đây là phân tích bằng bbox/nhãn, chưa phải review trực quan nguyên nhân ánh sáng,
  góc mặt hoặc kích thước; không suy diễn những nguyên nhân chưa kiểm tra.
- Lớp mất cân bằng và test minority nhỏ làm kết quả biến động; scene leakage chưa
  loại trừ có thể làm số đo lạc quan. Chưa đo khoảng tin cậy hoặc domain shift.
  Không dùng cho nhận diện danh tính, xử phạt hoặc quyết định về người.

## Bằng chứng và tái lập

Raw predictions, report, confusion/per-image errors và biểu đồ F1 lưu ngoài repo:
`D:\Codex\outputs\face-mask-detection\p4-evaluation\{validation,test}`.
Không có ảnh hoặc weights trong đầu ra P4. Validation decision SHA-256:
`6c54c06e333ac51b1b519d5ca899c7df974a868fe1bfb6884d2a87bac2226151`.
Xem [lệnh tái lập](../ml/README.md) và
[bàn giao P4](handoffs/2026-10-18-p4-internal-evaluation.md).

