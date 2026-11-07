# Chương trình đồ án nhóm 1

Đề tài xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang. Nhóm 1, khóa K18, lớp học phần 20261IT6150003.

Repository https://github.com/anhpd-glinteco/face-mask-detection

Phiên bản frontend dùng cho demo local ngày 05/11/2026 https://github.com/anhpd-glinteco/face-mask-detection/tree/84758d86d9fc7046abf17708e551242e33f1e723

Commit 84758d86d9fc7046abf17708e551242e33f1e723. Phiên bản này đã được kiểm thử local; pull request đang chờ rà soát.

## Chuẩn bị môi trường local

Mở PowerShell tại thư mục mã nguồn đúng phiên bản. Cần Python 3.12, Node.js, npm và các thư viện Python theo README trong services/inference. Máy thử nghiệm dùng Windows, CPU i5-13500H, Torch 2.9.0+cpu/TorchVision 0.24.0+cpu. Khi chuyển sang máy khác, cần kiểm tra lại bước cài đặt.

Nhóm chuẩn bị riêng checkpoint fine-tune và đặt tại local-models/best.pt ở gốc dự án. Đây là trọng số nội bộ, không có trong repository; cần có tệp này để chạy nhận diện.

SHA-256 checkpoint 7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e.

## Chạy API

Tại gốc dự án, tạo môi trường Python 3.12 riêng và cài các thư viện cần thiết. Nếu đã có môi trường tương thích, dùng đường dẫn Python của môi trường đó.

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

Readiness http://localhost:8220/api/v1/ready phải trả 200 trước khi demo. Nếu trả 503, kiểm tra checkpoint, môi trường và checksum. Mã này cho biết mô hình chưa sẵn sàng.

## Chạy giao diện

Mở terminal thứ hai tại gốc dự án. Cài các thư viện theo README trước khi build.

```powershell
cd apps/web
npm ci
$env:NEXT_PUBLIC_INFERENCE_API_URL='http://localhost:8220'
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3111
```

Mở http://localhost:3111 trong trình duyệt local đã cho phép camera. Lượt thử đã dùng bản build production và API riêng ở cổng 8220.

## Thao tác demo

1. Ảnh JPEG/PNG/WebP tối đa 10 MiB. Vùng chọn ảnh giữa màn hình và nút Chọn ảnh đều mở hộp chọn tệp, hỗ trợ Enter/Space.
2. Video local được lấy mẫu theo từng khung hình. Khi tạm dừng hoặc kết thúc, giao diện giữ khung hình cuối đã phân tích cùng mốc thời gian để xem lại. Tua hoặc thay nguồn sẽ xóa kết quả cũ.
3. Webcam chỉ mở khi bấm Bắt đầu và cho phép camera, không thu âm. Nút Dừng tắt camera và giữ kết quả khung hình cuối. Kiểm tra đèn camera tắt sau Dừng.
4. Giao diện mặc định hiện các phát hiện đạt ngưỡng trình bày 0,15. Có thể mở nhóm chưa chắc chắn để xem dự đoán yếu cùng bbox. Số đếm chỉ thuộc từng khung hình.
5. Kết thúc API và web bằng Ctrl+C trong hai terminal. Không ghi hình người thật nếu chưa có sự đồng ý.

## Kết quả và giới hạn

Thí nghiệm COCO fine-tune chạy 30 epoch, chọn epoch 10 theo validation mAP50:95. Ngưỡng đánh giá 0,25 được khóa trước lượt test của thí nghiệm. Test macro F1 0,3240 và mAP50:95 0,1333; lớp đeo sai còn yếu. Mục tiêu chất lượng 0,80 chưa đạt. Test P4 đã được sử dụng trước đó, kết quả mới là phép so sánh trên cùng tập đã dùng.

Camera laptop thật đã chạy hơn 60 giây và được kiểm tra việc cấp quyền, dừng, giải phóng track. Lỗi Bắt đầu trong trình duyệt nhúng chưa được nghiệm thu, nên khi demo cần dùng trình duyệt đã kiểm tra trên máy thử nghiệm. Nhóm chưa nghiệm thu cài đặt trên máy mới hoặc đánh giá đủ các điều kiện ánh sáng và khoảng cách.

Chương trình dùng cho trình diễn kỹ thuật local. Quyền sử dụng dữ liệu và tính độc lập giữa các cảnh (scene independence) chưa được xác minh đầy đủ. Điều kiện triển khai công khai chưa đạt, deployment gate CLOSED. Nhóm còn cần ghi và xác nhận video demo hoàn chỉnh.
