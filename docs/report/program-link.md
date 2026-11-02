# Chương trình đồ án nhóm 1

Đề tài: Xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang.

Repository: https://github.com/anhpd-glinteco/face-mask-detection

Mã nguồn phiên bản demo: https://github.com/anhpd-glinteco/face-mask-detection/tree/a341b6bdc101b09d89fddb713d1158bdf28ab32f

Pull request của phiên bản giao diện: https://github.com/anhpd-glinteco/face-mask-detection/pull/49

Commit: `a341b6bdc101b09d89fddb713d1158bdf28ab32f`.
PR còn chờ review; đường dẫn trên định danh phiên bản được dùng, không có nghĩa đã merge.
Hiện chưa có URL web công khai được nghiệm thu. Chương trình chạy local trên laptop.

## Chạy trên laptop hiện có

Sử dụng checkout sẵn có tại `D:/Codex/work/face-mask-detection/issue-42-uncertainty`.
Các lệnh dưới đây dùng môi trường đã cài; không cần Docker. Mở hai terminal PowerShell.

Terminal API:

```powershell
cd D:/Codex/work/face-mask-detection/issue-42-uncertainty/services/inference
$env:MODEL_PATH='D:/Codex/outputs/face-mask-detection/p3-internal/baseline-v2/checkpoint.pt'
$env:MODEL_SHA256='1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74'
$env:ALLOWED_ORIGINS='http://localhost:3110'
& D:/Codex/work/face-mask-detection/p5-venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal giao diện:

```powershell
cd D:/Codex/work/face-mask-detection/issue-42-uncertainty/apps/web
$env:NEXT_PUBLIC_INFERENCE_API_URL='http://localhost:8000'
npm run build
npm run start -- --hostname 127.0.0.1 --port 3110
```

Mở http://localhost:3110 trong trình duyệt trên chính laptop này. API readiness:
http://localhost:8000/api/v1/ready. Chỉ bắt đầu demo model thật khi readiness trả 200.
Nếu trả 503, kiểm tra cấu hình và checksum checkpoint; không coi đó là kết quả không có mặt.
Máy khác cần cài môi trường theo README; thiết lập máy sạch chưa được nghiệm thu trong phiên này.
Trọng số nội bộ không nằm trong repository và không được cung cấp qua link công khai.

## Kịch bản demo

1. Ảnh: chọn JPEG/PNG/WebP được phép sử dụng, tối đa 10 MiB; xem vùng phát hiện, nhãn và độ tin cậy. Ảnh synthetic chỉ kiểm tra đường xử lý, không đo độ chính xác nhận diện.
2. Video: chọn file local, phát, tạm dừng rồi tua và phát tiếp. Kết quả gắn với khung hình đã phân tích; FPS xử lý khác FPS video và số detection không phải số người duy nhất.
3. Webcam: chọn Webcam, bấm Bắt đầu, cho phép camera tích hợp laptop; không thu âm. Bấm Dừng hoặc đổi chế độ để giải phóng camera. Kiểm tra đèn camera tắt sau khi dừng.
4. Confidence dưới 0,15 được đánh dấu “Chưa chắc chắn” và đếm riêng; đúng 0,15 đạt ngưỡng. API giữ ba lớp, không thêm lớp uncertain và không loại kết quả thấp tại giao diện.
5. Kết thúc bằng Ctrl+C ở cả hai terminal. Không ghi hình người thật nếu chưa có sự đồng ý.

## Giới hạn kết quả

Baseline P4 có test macro F1 0,2061 và mAP50:95 0,0820; khả năng nhận diện hai lớp ít mẫu còn thấp.
Đây là bản trình diễn kỹ thuật nội bộ, không dùng để cảnh báo hay quyết định về con người.
Quyền từng ảnh và tính độc lập giữa các cảnh chưa xác minh đầy đủ; deployment gate CLOSED.
Chưa phát hành trọng số hoặc triển khai công khai. Số đo P4/P11 trong báo cáo là kết quả lịch sử;
log nghiệm thu webcam laptop được lưu riêng trong bộ bàn giao phiên 02/11/2026.
