# ADR 0002 — SSDLite320 MobileNetV3 cho baseline CPU

Ngày: 17/10/2026. Kiến trúc/config đã chọn; **chưa được phép bắt đầu P3**.
Issues: #7, phụ thuộc #2/#3 và contract hiện có.

## Quyết định

Chọn `torchvision.models.detection.ssdlite320_mobilenet_v3_large`, input 320×320,
4 output classes gồm background. Config máy đọc được: `ml/configs/baseline.json`.
Torch 2.9.0 / TorchVision 0.24.0, Python 3.12 là môi trường dự kiến; chưa cài hoặc
smoke model ở P2. Các phiên bản này thuộc cặp tương thích được công bố trong
[bảng TorchVision](https://github.com/pytorch/vision#installation).

| Lựa chọn | Quyết định và lý do |
|---|---|
| SSDLite320 MobileNetV3 | Chọn: detector một bước, input nhỏ, có sẵn trong TorchVision; thuận lợi cho CPU và tránh thêm framework |
| Faster R-CNN ResNet50 FPN | Không chọn cho baseline: detector hai bước/backbone lớn hơn, chưa có bằng chứng phù hợp budget CPU của dự án |
| Ultralytics YOLO nano | Không chọn ở phiên này: thêm framework và cần quyết định tuân thủ AGPL hoặc enterprise trước khi phân phối; không mặc định AGPL cấm sử dụng |

Nguồn: [SSDLite API 0.24](https://docs.pytorch.org/vision/0.24/models/generated/torchvision.models.detection.ssdlite320_mobilenet_v3_large.html),
[Faster R-CNN](https://docs.pytorch.org/vision/0.24/models/generated/torchvision.models.detection.fasterrcnn_resnet50_fpn.html),
[Ultralytics license](https://github.com/ultralytics/ultralytics/blob/main/LICENSE).
Đây là so sánh thiết kế, chưa benchmark tốc độ hoặc accuracy giữa các model.

## License và khởi tạo

Code TorchVision: [BSD-3-Clause](https://github.com/pytorch/vision/blob/v0.24.0/LICENSE),
giữ notices khi phân phối. License code không tự cấp quyền với pretrained weights;
[TorchVision README](https://github.com/pytorch/vision#pre-trained-model-license)
yêu cầu kiểm tra điều kiện từ dữ liệu train.

Baseline này **khởi tạo ngẫu nhiên**, truyền rõ cả `weights=None` và
`weights_backbone=None` để tránh default tự tải ImageNet weights. Không có pretrained
weights nên không có license/checksum pretrained được tuyên bố. Checkpoint chưa tồn
tại; quyền phân phối checkpoint train sau này vẫn phụ thuộc phê duyệt dữ liệu.
Đổi sang transfer learning cần bổ sung provenance/license weights và cập nhật ADR.

Đánh đổi: train từ đầu trên 853 ảnh có thể cho chất lượng thấp, nhất là lớp đeo sai
chỉ có 123 bbox gốc. Baseline là mốc đo, không hứa đạt mAP hoặc đủ demo.

## Giao diện và experiment P3

- Class IDs: 0 background; 1 `with_mask`; 2 `without_mask`; 3 `mask_worn_incorrectly`.
  `uncertain` chỉ suy từ confidence, không có trong training targets.
- Input RGB tensor float [0,1]; dùng transform nội bộ SSD, không resize hai lần.
  Bbox manifest là xyxy pixel gốc; nhãn alias đã chuẩn hóa. Trước P3 phải giải quyết
  tọa độ vượt biên và thống nhất quy ước pixel; không tự trừ 1 hoặc clamp.
- Seed 42 cho Python/NumPy/Torch khi trainer được viết. Chạy CPU, batch 2, workers 0;
  SGD lr .005, momentum .9, weight decay .0005, StepLR 20/.1; tối đa 30 epochs.
- Smoke 5 train batches + 2 validation batches, 1 epoch, finite loss và bbox hợp lệ;
  đo thời gian/RAM thực trước khi chạy dài. Lưu config, manifest checksum, code SHA,
  RNG/optimizer/scheduler/epoch trong checkpoint để resume; chọn checkpoint bằng
  validation mAP 50:95, chưa đụng test để tuning. Threshold chốt ở P4.

## Tài nguyên và gate

Host đã khảo sát: i5-13500H, 12 core/16 logical, RAM 16,794,722,304 byte, Intel Iris Xe;
chưa xác nhận CUDA/GPU notebook. CPU local là phương án smoke có sẵn, chưa đo được
thời gian train hoặc inference. Không cam kết chạy hết 30 epochs trên máy này.
P3 dùng venv Python 3.12 riêng trên D; không dùng venv audit Python 3.14 làm bằng
chứng model tương thích. GPU cloud chỉ dùng khi có runtime thực và ghi lại môi trường.

Gate chưa đạt: 11 annotation bbox lỗi, 5 cặp ảnh trùng có annotation khác nhau,
metadata scene/nguồn không có, consent/quyền dùng cần nhóm xác nhận. Không bắt đầu
train hoặc đóng #7 theo DoD khi các phụ thuộc chưa được giải quyết.
