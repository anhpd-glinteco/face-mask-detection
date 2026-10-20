# Báo cáo đồ án — nội dung ban đầu

Bản P1 lịch sử; nội dung hiện tại để review ở [P12](p12/bao-cao.md),
[hướng dẫn xuất và giới hạn](p12/README.md). Không dùng trạng thái P1 dưới đây
để mô tả triển khai hiện tại.

**Trạng thái: bản nháp P1, chưa có kết quả model thật.** Không dùng bản này như
báo cáo hoàn thành. Thông tin bìa/đề cương ở [README](README.md).

## 1. Tổng quan đề tài

Đề tài xây dựng ứng dụng web hỗ trợ quan sát trạng thái đeo khẩu trang từ ảnh,
video chọn trên máy và webcam. Mỗi đối tượng được phát hiện có bounding box, nhãn
và độ tin cậy. Ba nhãn mục tiêu là có khẩu trang, không có khẩu trang và đeo sai
cách. Độ tin cậy không phải cam kết kết quả đúng trong mọi bối cảnh.

Người dùng cần kiểm tra trực quan kết quả, nhận biết lỗi đầu vào và dừng xử lý khi
không còn nhu cầu. Hệ thống không nhận diện danh tính, không đếm người duy nhất
qua nhiều frame và không đưa ra quyết định xử phạt. Phạm vi MVP không có tài khoản,
lịch sử hoặc database. Media chỉ được dùng để xử lý, không lưu lên server.

Mục tiêu đánh giá gồm tính đúng của ba luồng, khả năng xử lý lỗi và cleanup,
chất lượng detection theo lớp và hiệu năng triển khai. Kế hoạch/nguồn minh chứng
được lưu riêng để kết quả có thể truy vết tới phiên bản đã thử nghiệm.

**Cần bổ sung P2:** khảo sát giải pháp liên quan có nguồn gốc, so sánh phù hợp bài
toán và lý do chọn phương án. Không coi mô tả công cụ là khảo sát thực nghiệm.

## 2. Cơ sở lý thuyết và lựa chọn giải pháp

Object detection xác định vị trí và loại đối tượng trong ảnh. Bbox được biểu diễn
bằng hai góc `(x1,y1)` và `(x2,y2)` theo pixel của ảnh gốc; khi preview đổi kích thước,
client phải biến đổi tọa độ đồng nhất với phần ảnh thực hiển thị.

Precision và recall lần lượt phản ánh độ chính xác của các dự đoán và mức thu hồi
đối tượng gán nhãn; F1 cân bằng hai đại lượng. Đánh giá detector còn cần điều kiện
ghép prediction với ground truth theo IoU và mAP. Phải công bố IoU, threshold,
phương pháp matching và kết quả theo từng lớp khi có thực nghiệm; không dùng một
con số accuracy không định nghĩa để thay thế.

Video/webcam dùng HTTP frame sampling với tối đa một request đang chạy. Browser
giữ media gốc và chỉ gửi frame ảnh. Phương án này giữ API stateless và tránh backlog;
processed FPS có thể thấp hơn FPS camera. Snapshot kết quả gắn timestamp giúp
tránh trình bày bbox của frame cũ như thể thuộc frame live mới.

**Cần bổ sung P2–P4:** nguồn lý thuyết gốc; dataset/license; model/code/pretrained
license; so sánh lựa chọn khả thi, cấu hình baseline và kết quả đo.

## 3. Phân tích và thiết kế

Xem [yêu cầu](requirements.md), [use case](use-cases.md) và [sơ đồ](diagrams/README.md).
Đây là thiết kế mục tiêu, không khẳng định video/webcam đã triển khai. Kiến trúc gồm
browser/Next.js, FastAPI và model adapter; API nhận ảnh multipart và trả JSON schema
1.0. Không có kho lưu media. Kiến trúc triển khai cuối cùng được cập nhật theo gate.

## 4. Xây dựng hệ thống

Tại base `b286243`, web có upload ảnh/preview/validation/trạng thái và API client;
FastAPI có health/ready/detect stub. Stub trả detection rỗng và timing bằng 0,
không chứng minh khả năng detection. Video/webcam đang khóa trên UI.

**Cần bổ sung P2–P10:** manifest dữ liệu, config và lệnh train/resume, checksum
weights, adapter/preprocessing/class map, ảnh chụp ba luồng, version và deployment.

## 5. Kiểm thử và thực nghiệm

Test hiện có kiểm tra luồng ảnh bằng mock và endpoint stub. Đây là kiểm chứng
phần mềm nền, không phải đánh giá chất lượng model hoặc độ trễ inference thật.
Kết quả chạy lại ở [baseline](../handoffs/2026-10-17-baseline.md).

**Cần bổ sung P4/P9–P11:** bảng test thực tế, tập đánh giá độc lập, precision/recall/F1
theo lớp, mAP/confusion matrix, error analysis theo ánh sáng/góc/che khuất/mặt nhỏ;
raw cold/warm/memory/error/FPS, cấu hình và đối chiếu budget.

## Kết luận tạm thời

Mới xác minh được một phần khung phần mềm. Chưa có cơ sở kết luận đã hoàn thành
ba luồng, chất lượng model hay deployment. Kết luận cuối cập nhật ở P12 dựa trên
evidence, nêu rõ phần đạt/chưa đạt và các giới hạn dữ liệu, tài nguyên, domain shift.

## Nguồn tài liệu ban đầu

1. [Sheet kế hoạch nhóm](https://docs.google.com/spreadsheets/d/1n2fokJScS-Tv7vAsV9WobB7r12RVhAJN7JcVJNpqa5g/edit#gid=274651441).
2. [Repo và issues](https://github.com/anhpd-glinteco/face-mask-detection).
3. [HaUI-SICT — CTĐT Kỹ thuật phần mềm](https://sict.haui.edu.vn/vn/html/ky-thuat-phan-mem), tham khảo 17/10/2026, định hướng SO2–SO6, không thay rubric học phần.

Nguồn dataset/model/lý thuyết gốc phải thêm khi chọn và kiểm tra ở P2–P4.
