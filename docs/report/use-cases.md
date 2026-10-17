# Đặc tả use case

Thiết kế mục tiêu P1; video/webcam/model thật chưa triển khai tại base `b286243`.
Actor: **Người sử dụng**. Hệ thống không yêu cầu tài khoản.

## UC01 — Phân tích ảnh

- Mục đích: xem trạng thái khẩu trang trong một ảnh được phép sử dụng.
- Tiền điều kiện: trang đã mở; dịch vụ/model sẵn sàng để nhận kết quả thật.
- Trigger: người dùng chọn/thay ảnh.
- Đầu vào: JPEG/PNG/WebP ≤ 10 MiB. Đầu ra: preview, detections hoặc trạng thái lỗi.

| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Người dùng chọn ảnh; browser kiểm tra loại/kích thước, hủy request ảnh trước. |
| 2 | Hệ thống preview ảnh, reset kết quả cũ và thông báo đang phân tích. |
| 3 | Gửi multipart `image`; API kiểm tra dung lượng, decode và readiness. |
| 4 | Model xử lý; API trả bbox theo ảnh gốc, nhãn, confidence, version và timing. |
| 5 | Client validate response, kiểm tra còn đúng nguồn/request, scale bbox để vẽ. |
| 6 | Người dùng xem danh sách/overlay; có thể thay ảnh hoặc retry khi lỗi tạm thời. |

Ngoại lệ: loại/dung lượng sai → không gọi API; ảnh hỏng → 422; model chưa sẵn sàng
→ 503; mạng/timeout → giữ preview, báo lỗi và cho retry; response sai → không vẽ.
Đổi ảnh trong lúc chờ → abort/loại response cũ. Không phát hiện mặt từ model thật
là kết quả hợp lệ, tách biệt model lỗi hoặc stub.

Hậu điều kiện: kết quả gắn với ảnh hiện tại, không lưu media; object URL cũ được
thu hồi khi thay ảnh/rời trang. Issue #11–#14; FR01/02/06/08.

## UC02 — Phân tích video

- Mục đích: xem detection của các frame được xử lý trong video local.
- Tiền điều kiện: trình duyệt hỗ trợ codec của file; model sẵn sàng.
- Trigger: chọn video và phát. File ở browser, server chỉ nhận frame ảnh.
- Đầu ra: preview, frame đã phân tích kèm overlay, thống kê và lỗi nếu có.

| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Chọn video; đọc metadata, tạo preview local; lỗi codec/file phải thông báo. |
| 2 | Khi phát, sampler chỉ capture khi không có request đang chạy. |
| 3 | Capture frame cùng source/session ID, frame ID và thời điểm video. |
| 4 | Gửi frame qua detect API, chờ xong trước khi xét frame kế tiếp; không queue. |
| 5 | Chỉ nhận kết quả còn đúng session; hiển thị frame đã phân tích cùng overlay. |
| 6 | Cập nhật thống kê của frame và processed FPS/latency; lặp khi còn phát. |
| 7 | Pause/seek/end/đổi mode/file: dừng lịch, vô hiệu hóa kết quả cũ, cleanup. |

Không vẽ bbox của frame cũ như thể đúng trên frame live mới: dùng vùng kết quả là
snapshot đã phân tích, tách khỏi video preview đang chạy và ghi timestamp của nó.
FPS xử lý không phải FPS video. Không cộng detection thành tổng người duy nhất.

Ngoại lệ: API chậm → bỏ lượt capture khi bận, không backlog; timeout/lỗi → dừng
sampling và báo lỗi, người dùng chủ động thử lại; seek/pause → hủy/vô hiệu hóa request,
không bắt đầu vòng mới trước khi request cũ kết thúc; video không đọc được → không gửi.

Hậu điều kiện: không còn timer/request hữu hiệu của nguồn cũ; thu hồi object URL
khi thay file/unmount. Issue #15/#17/#18; FR02/03/05/06/07/08.

## UC03 — Phân tích webcam

- Mục đích: xem detection theo frame từ camera do người dùng chủ động bật.
- Tiền điều kiện: HTTPS hoặc localhost, camera có thể truy cập, browser hỗ trợ
  `getUserMedia`; model sẵn sàng.
- Trigger: nhấn bật camera. Không mở camera chỉ vì tải trang.

| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Người dùng bật camera; browser xin quyền, UI thông báo đang chờ. |
| 2 | Nếu được cấp quyền, gắn MediaStream và phát preview. |
| 3 | Dùng cùng sampler và cách hiển thị snapshot đã phân tích của UC02. |
| 4 | Hiển thị detections, số lượng theo lớp ở frame hiện tại, FPS xử lý và latency. |
| 5 | Người dùng dừng/đổi mode hoặc rời trang: stop mọi track, timer và request. |

Ngoại lệ: từ chối quyền/không camera/camera bận → thông báo riêng, không vòng retry
vô hạn; track kết thúc → dừng sampling và báo ngắt; yêu cầu quyền trả về sau khi
người dùng đã rời mode → stop ngay stream đến muộn. API lỗi giống UC02; thao tác
dừng phải luôn dùng được ngay cả khi request pending.

Hậu điều kiện: đèn camera tắt, không còn stream hoạt động và không vẽ response cũ.
Issue #16–#18; FR02/04/05/06/07/08.

## Kiểm tra chung khi nghiệm thu

Kiểm tra cả đường thành công, empty, lỗi và cancel; nhiều mặt/nhãn/confidence biên;
resize/letterboxing; pause/seek/đổi nguồn nhanh; bàn phím và status cho trình đọc màn
hình. Model thật/camera thật phải có bằng chứng riêng ngoài mock.
