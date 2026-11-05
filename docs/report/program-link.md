# Chương trình đồ án nhóm 1

Đề tài xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang.

Repository https://github.com/anhpd-glinteco/face-mask-detection

Phiên bản frontend dùng cho demo local ngày 05/11/2026 https://github.com/anhpd-glinteco/face-mask-detection/tree/84758d86d9fc7046abf17708e551242e33f1e723

Commit 84758d86d9fc7046abf17708e551242e33f1e723. Phiên bản đã có kiểm thử local; pull request còn chờ review.

## Chuẩn bị môi trường local

Mở PowerShell tại thư mục mã nguồn đúng phiên bản. Cần Python 3.12, Node.js, npm và môi trường Python đã cài dependencies theo README trong services/inference. Máy đã thử dùng Windows, CPU i5-13500H và Torch 2.9.0+cpu/TorchVision 0.24.0+cpu. Máy khác cần kiểm tra lại việc cài đặt.

Checkpoint fine-tune được chuẩn bị riêng trong thư mục local-models/best.pt ở gốc dự án. File này chứa trọng số nội bộ và không có trong repository. Cần có file đã được nhóm chuẩn bị để chạy nhận diện thật.

SHA-256 checkpoint 7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e.

## Chạy API

Từ gốc dự án, tạo môi trường Python 3.12 riêng và cài dependencies. Nếu đã có môi trường tương thích, dùng đường dẫn Python của môi trường đó.

```powershell
$projectRoot=(Get-Location).Path
python -m venv .venv
& "$projectRoot/.venv/Scripts/python.exe" -m pip install -r services/inference/requirements.txt
$env:MODEL_PATH=Join-Path $projectRoot 'local-models/best.pt'
$env:MODEL_SHA256='7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e'
$env:ALLOWED_ORIGINS='http://localhost:3111'
cd services/inference
& "$projectRoot/.venv/Scripts/python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8220
```

Readiness http://localhost:8220/api/v1/ready phải trả 200 trước khi demo. Nếu trả 503, kiểm tra checkpoint, môi trường và checksum. Tình huống này là model chưa sẵn sàng.

## Chạy giao diện

Mở terminal thứ hai tại gốc dự án. Cài dependencies theo README trước khi build.

```powershell
cd apps/web
npm ci
$env:NEXT_PUBLIC_INFERENCE_API_URL='http://localhost:8220'
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3111
```

Mở http://localhost:3111 trong trình duyệt local đã cho phép camera. Bản đã thử dùng build production và API riêng cổng 8220.

## Thao tác demo

1. Ảnh JPEG/PNG/WebP tối đa 10 MiB. Vùng chọn ảnh giữa màn hình và nút Chọn ảnh đều mở file picker, hỗ trợ Enter/Space.
2. Video local được lấy mẫu từng frame. Khi pause hoặc kết thúc, frame cuối đã phân tích cùng timestamp được giữ để xem lại; tua hoặc thay nguồn xóa kết quả cũ.
3. Webcam chỉ mở khi bấm Bắt đầu và cho phép camera, không thu âm. Dừng tắt camera và giữ kết quả frame cuối. Kiểm tra đèn camera tắt sau Dừng.
4. Giao diện mặc định hiện detection đạt ngưỡng trình bày 0,15. Mở nhóm chưa chắc chắn để xem các dự đoán yếu cùng bounding box. Số đếm là detection từng frame.
5. Kết thúc API và web bằng Ctrl+C trong hai terminal. Không ghi hình người thật nếu chưa có sự đồng ý.

## Kết quả và giới hạn

Thí nghiệm COCO fine-tune chạy 30 epoch, chọn epoch 10 theo validation mAP50:95. Threshold đánh giá 0,25 được khóa trước lượt test của thí nghiệm. Test macro F1 0,3240 và mAP50:95 0,1333; lớp đeo sai còn yếu. Mục tiêu chất lượng 0,80 chưa đạt. Test P4 đã được sử dụng trước đó, kết quả mới là phép so sánh trên cùng tập đã dùng.

Camera laptop thật đã chạy hơn 60 giây, kiểm tra quyền, dừng và giải phóng track. Lỗi Bắt đầu trong trình duyệt nhúng chưa được nghiệm thu; dùng trình duyệt đã được kiểm tra trên máy demo. Chưa có nghiệm thu cài đặt trên máy mới hoặc đủ điều kiện ánh sáng/khoảng cách.

Chương trình dùng cho trình diễn kỹ thuật local. Quyền dữ liệu và scene independence còn thiếu xác minh, điều kiện triển khai công khai chưa đạt, deployment gate CLOSED. Video demo hoàn chỉnh còn do nhóm ghi và xác nhận.
