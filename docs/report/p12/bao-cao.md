# Xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang

ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI

TRƯỜNG CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG

BÁO CÁO ĐỒ ÁN CHUYÊN NGÀNH KỸ THUẬT PHẦN MỀM

Nhóm 1 • Lớp học phần 2026IT6150003

Giảng viên hướng dẫn: ThS. Vũ Thị Dương

| Sinh viên | MSSV |
| --- | --- |
| Phùng Đức Anh | Cần bổ sung |
| Nguyễn Đình Luân Kiệt | Cần bổ sung |
| Bùi Nguyên Hải | Cần bổ sung |
| Bùi Ngọc Minh Hoàng | Cần bổ sung |

Khóa đào tạo: Cần bổ sung

Hà Nội, tháng 10 năm 2026

Phiên bản P12 để review, chốt bằng chứng ngày 20/10/2026. Thông tin bìa và đóng góp cá nhân chờ nhóm xác nhận. Chưa có review độc lập hoặc nghiệm thu công khai.

<!-- page -->
# Tóm tắt

Đồ án xây dựng ứng dụng web tiếp nhận ảnh, video trên máy và webcam để hiển thị vùng phát hiện, nhãn trạng thái đeo khẩu trang và độ tin cậy. Hệ thống gồm giao diện Next.js, API FastAPI và bộ suy luận SSDLite320 MobileNetV3 Large trên CPU. Video và webcam dùng chung cơ chế lấy mẫu frame qua HTTP, với tối đa một tác vụ xử lý đang chờ hoàn tất trong mỗi sampler. Media không được lưu thành lịch sử trên server. [1–4]

Phần mềm đã có kiểm chứng tự động cho giao diện, contract, quản lý vòng đời và lỗi; P11 ghi nhận 81 frontend tests, 24 backend tests, 37 ML tests, 3 benchmark self-checks và 4 browser fixture tests. Một race khi video tạm chưa sẵn sàng đã được tái hiện bằng test thất bại trước sửa, sau đó kiểm chứng lại bằng regression và benchmark. Các số đếm này thuộc những suite riêng, không cộng thành thước đo chất lượng model. [3]

Baseline nội bộ học từ đầu trên 843 ảnh curated, chia train/validation/test thành 670/98/75 ảnh. Ngưỡng 0,15 được chọn trên validation trước khi đo test. Test macro F1 đạt 0,2061 và mAP50:95 đạt 0,0820; recall của hai lớp ít mẫu rất thấp. Vì vậy, kết quả hiện tại chưa hỗ trợ sử dụng để cảnh báo hoặc quyết định về con người. [2]

P11 chạy checkpoint thật qua API local với media synthetic không chứa khuôn mặt. Warm HTTP p95 đạt 36,89 ms trên 100/100 request; cold readiness p95 đạt 3.567,03 ms trên 5 lần khởi động process. Video và webcam hiển thị lần lượt 4,91 và 4,99 frame/giây trong hơn 60 giây. Đây là bằng chứng hiệu năng trên workload đã mô tả, không chứng minh camera vật lý, độ chính xác trên cảnh thực hoặc triển khai HTTPS. [3]

Quyền từng ảnh và tính độc lập theo scene chưa được xác minh; `p3_ready=false` và deployment gate CLOSED vẫn giữ nguyên. Báo cáo trình bày phần đã kiểm chứng cùng phần chưa đạt, nhằm hỗ trợ review kỹ thuật và chuẩn bị buổi bảo vệ. Không phát hành dataset, media khuôn mặt hoặc weights trong bộ tài liệu này. [1–3]

Từ khóa: object detection; khẩu trang; SSDLite; FastAPI; HTTP frame sampling; kiểm chứng phần mềm.

<!-- page -->
# Mục lục và từ viết tắt

{{toc}}

| Thuật ngữ | Diễn giải dùng trong báo cáo |
| --- | --- |
| API | Giao diện lập trình giữa browser và dịch vụ suy luận |
| Bbox | Hộp giới hạn đối tượng trong hệ tọa độ ảnh gốc |
| IoU | Diện tích giao chia diện tích hợp của hai bbox |
| AP và mAP | Độ chính xác trung bình theo đường precision–recall và trung bình theo lớp/IoU |
| FPS xử lý | Số frame được xử lý hoặc hiển thị trên thời gian đo đã nêu |
| Fixture | Dữ liệu hoặc phản hồi kiểm thử có kiểm soát |
| Synthetic | Media được tạo tổng hợp, không phải cảnh camera vật lý |
| Readiness | Model đã nạp và có thể phục vụ suy luận |

Quy ước: số thập phân dùng dấu phẩy trong diễn giải và bảng; mã lệnh/JSON giữ dấu chấm. Dẫn nguồn [n] trỏ đến danh mục tài liệu tham khảo. Mỗi hình minh họa giao diện đều ghi loại media và nguồn response.

<!-- page -->
# Chương 1 Tổng quan đề tài
## 1.1 Bài toán và người sử dụng

Người sử dụng cần quan sát các vùng mà mô hình dự đoán có khuôn mặt và trạng thái khẩu trang trong ảnh hoặc luồng hình ảnh. Nếu chỉ hiển thị một nhãn cho cả ảnh, hệ thống không biểu diễn được nhiều người hoặc các trạng thái khác nhau cùng xuất hiện. Vì vậy, đầu ra cần có bbox, nhãn và confidence cho từng detection, đồng thời giữ kích thước ảnh gốc để giao diện đặt overlay đúng vị trí. [4]

Đối tượng sử dụng trong MVP là người thao tác trực tiếp trên trình duyệt. Người dùng chọn ảnh, chọn video local hoặc chủ động bật webcam; sau đó xem snapshot đã phân tích và kết quả tương ứng. Hệ thống cần cho phép dừng xử lý, thay nguồn và nhận biết lỗi mà không giữ kết quả cũ như thể thuộc nguồn mới. Mục tiêu tương tác này dẫn đến yêu cầu quản lý bất đồng bộ và vòng đời media, bên cạnh bài toán học máy.

Ba nhãn nghiệp vụ là `with_mask`, `without_mask` và `mask_worn_incorrectly`. Nhãn thứ ba biểu diễn cách đeo không đúng trong annotation hiện có; nó không thay thế đánh giá y tế về mức bảo vệ của từng loại khẩu trang. Confidence là đầu ra của model và chưa được hiệu chỉnh thành xác suất đúng ngoài thực tế. Báo cáo không sử dụng confidence như bằng chứng chắc chắn về hành vi của một cá nhân. [2]

Ứng dụng không nhận diện danh tính, không theo dõi một người qua nhiều frame và không đếm số người duy nhất. Thống kê chỉ thuộc frame hoặc khoảng lấy mẫu đang xét. Không xây dựng tài khoản, cơ sở dữ liệu, trang quản trị hoặc lịch sử media vì các thành phần này không cần cho mục tiêu kiểm chứng ba luồng. Thiết kế hiện tại hướng tới demo học thuật có giới hạn được công bố.

Kết quả cần đánh giá theo hai trục: phần mềm có xử lý đầu vào, lỗi và cleanup đúng hay không; model có phát hiện đúng từng lớp hay không. Một browser test thành công không đo được recall trên tập test. Ngược lại, metric model không xác nhận thao tác cấp quyền webcam hoặc xử lý seek video đúng. Việc tách hai trục giúp tránh kết luận vượt quá bằng chứng.

<!-- page -->
# 1.2 Mục tiêu và phạm vi thực hiện

Mục tiêu sản phẩm là hỗ trợ ba đầu vào trên cùng một contract ảnh. Ảnh được gửi trực tiếp; video và webcam chỉ gửi frame đã trích tại browser. API trả kích thước ảnh, metadata model, danh sách detections và timing; browser kiểm tra response rồi hiển thị trên snapshot đã gửi. Luồng này tránh việc server phải nhận toàn bộ file video hoặc quản lý phiên streaming. [4,5]

| Nhóm mục tiêu | Điều kiện kiểm chứng | Trạng thái tại P11 |
| --- | --- | --- |
| Ảnh | Upload, lỗi đầu vào, overlay, đổi ảnh | Fixture và đường HTTP local có evidence |
| Video | Lấy mẫu nối tiếp, pause/seek, loại kết quả cũ | Regression và benchmark synthetic đạt sau fix |
| Webcam | Start/stop, quyền, track cleanup | Browser giả lập đạt; chưa camera vật lý |
| Chất lượng | Metric ba lớp trên test đã khóa | Đã đo; chất lượng thấp |
| Hiệu năng | Cold, warm và hai stream 60 giây | Local CPU, workload synthetic |
| Công khai | HTTPS, camera thật, quyền dữ liệu | Chưa đạt, gate đóng |

Budget hiệu năng nội bộ đề xuất warm p95 không quá 1 giây/frame, cold readiness không quá 30 giây và lỗi ngoài dự kiến không quá 1% đầu vào hợp lệ. Đây là tiêu chí demo ban đầu, không phải cam kết dịch vụ hoặc ngưỡng an toàn áp dụng cho mọi thiết bị. Không có mục tiêu mAP được đặt sau khi nhìn kết quả để biến baseline thấp thành đạt yêu cầu. [3,4]

Phạm vi P12 là tổng hợp, giải thích và trình bày bằng chứng đã có. P12 không thay split, không tuning trên test, không train lại hoặc thêm tính năng `uncertain`. Các điều kiện thiếu tiếp tục xuất hiện trong kết luận và slide. Báo cáo dùng từ “đã triển khai” cho hành vi quan sát được trong source, và dùng từ “chưa kiểm chứng” cho môi trường chưa có thử nghiệm phù hợp.

Không đưa media khuôn mặt hoặc checkpoint vào tài liệu phân phối. Ảnh giao diện sử dụng media không có khuôn mặt với response fixture được ghi nhãn. Tính năng hiển thị bbox được minh họa tách biệt với độ đúng của model để người đọc không nhầm ảnh demo thành ví dụ nhận diện chính xác.

<!-- page -->
# 1.3 Phương pháp và tổ chức công việc

Quy trình phát triển chia thành các phiên có đầu ra, PR và handoff: yêu cầu và kiến trúc; audit dữ liệu; baseline; đánh giá; adapter; ba luồng web; kiểm thử tích hợp; benchmark; regression; tài liệu. Các phiên không được đánh dấu hoàn thành chỉ vì đã đến ngày dự kiến. Issue chỉ đóng khi đủ Definition of Done và có nguồn kiểm chứng. [4]

Trong mỗi thay đổi hành vi, kiểm thử nhỏ giúp xác nhận nguyên nhân, sau đó suite liên quan kiểm tra ảnh hưởng. Ví dụ ở P11, test tái hiện video chưa sẵn sàng thất bại trên code cũ, đạt sau sửa; benchmark tiếp tục kiểm tra stream dài. Các run thất bại được giữ nguyên để phản ánh quá trình phát hiện lỗi thay vì chỉ chọn run thành công. [3]

| Vai trò dự kiến trong kế hoạch | Thành viên | Xác nhận đóng góp thực tế |
| --- | --- | --- |
| ML và inference | Nguyễn Đình Luân Kiệt, Bùi Nguyên Hải | Cần bổ sung |
| Web | Phùng Đức Anh, Bùi Ngọc Minh Hoàng | Cần bổ sung |
| Điều phối QA và triển khai | Bùi Ngọc Minh Hoàng | Cần bổ sung |
| Tài liệu và nghiệm thu | Cả nhóm | Cần bổ sung |

Bảng trên chỉ ghi phân công dự kiến theo kế hoạch, không chứng nhận số giờ hoặc phần code từng người thực hiện. Trước khi nộp, nhóm cần xác nhận bằng nhật ký, PR/review và mô tả công việc cụ thể. Việc một tài khoản xuất hiện trong commit không tự chứng minh toàn bộ tác giả hoặc mức đóng góp. Không tự điền phần còn thiếu để làm báo cáo có vẻ hoàn chỉnh.

Các nguồn nội bộ dùng trong báo cáo gồm cards, regression report, config, source và raw artifact ngoài repo. Snapshot ngày 20/10/2026 xác minh PR P11 #39 còn draft và năm job CI đạt. Trạng thái này không thay thế review độc lập, camera thật hoặc nghiệm thu giảng viên. Các số đo được gắn với phiên bản code và checkpoint để người đọc có thể phân biệt sửa tài liệu với thay đổi mô hình.

Chương 2 giải thích thuật ngữ và phương pháp đo. Chương 3 mô tả thiết kế được đối chiếu triển khai. Chương 4 trình bày dữ liệu, baseline và đường xử lý. Chương 5 phân tích kiểm thử, chất lượng và hiệu năng. Kết luận nêu giới hạn còn lại và thứ tự công việc tiếp theo.

<!-- page -->
# Chương 2 Cơ sở lý thuyết và giải pháp
## 2.1 Phát hiện đối tượng và biểu diễn kết quả

Object detection đồng thời dự đoán loại đối tượng và vùng bao trên ảnh. SSD dùng các hộp tham chiếu ở nhiều tỉ lệ để dự đoán điểm lớp và hiệu chỉnh vị trí trong một mạng. Đồ án dùng biến thể SSDLite có sẵn trong TorchVision thay vì triển khai lại thuật toán detector. Không dùng số FPS hoặc mAP công bố của mô hình gốc để thay kết quả đo của checkpoint đồ án. [6]

Bbox trong API biểu diễn bằng hai góc `(x1,y1)` và `(x2,y2)` theo pixel ảnh gốc. Bbox hợp lệ phải hữu hạn, có diện tích dương và nằm trong chiều rộng/chiều cao ảnh. Khi preview thay kích thước, giao diện cần biến đổi vị trí theo vùng ảnh thực hiển thị. Nếu chỉ lấy kích thước khung chứa mà bỏ qua tỉ lệ ảnh, overlay có thể lệch dù tọa độ server đúng. [5]

Confidence giúp sắp thứ tự dự đoán và áp ngưỡng đánh giá. Giá trị cao không bảo đảm đúng với cảnh khác dữ liệu học. Trong model hiện tại, non-maximum suppression giảm các dự đoán chồng lấn trong từng lớp, với IoU 0,55; tối đa 100 detections/ảnh và score floor 0,001. Đây là tham số suy luận của baseline, không phải ngưỡng 0,15 được chọn để báo cáo precision/recall. [2]

| Thành phần | Ý nghĩa trong đồ án |
| --- | --- |
| Vị trí | Bbox xyxy của ảnh gốc, không phải pixel CSS |
| Nhãn | Một trong ba lớp khẩu trang |
| Confidence | Điểm model chưa được calibration ngoài thực tế |
| Model version | SHA-256 checkpoint đã nạp |
| Timing | Preprocess, inference, postprocess phía adapter |

SSDLite320 kết hợp kích thước đầu vào 320×320 với backbone MobileNetV3 Large. Lựa chọn kiến trúc nhỏ cho phép thử nghiệm CPU trong thời gian và tài nguyên hiện có. Tuy nhiên, ảnh có mặt nhỏ hoặc lớp hiếm vẫn cần được đánh giá riêng; kiến trúc nhẹ không tự bảo đảm chất lượng phù hợp mục đích. Báo cáo giữ lựa chọn này như baseline nội bộ, chưa có thực nghiệm đối chứng để tuyên bố tốt hơn các detector khác. [2,7,8]

<!-- page -->
# 2.2 Precision recall F1 và AP

IoU được tính bằng diện tích giao của hai bbox chia diện tích hợp. Ở ngưỡng vận hành P4, prediction được xét theo confidence giảm dần và ghép một đối một với ground truth cùng lớp chưa ghép có IoU cao nhất, nếu IoU ít nhất 0,5. Một prediction ghép đúng là TP; prediction dư là FP; ground truth không được ghép là FN. Cách ghép này cần cố định trước khi so sánh các run. [2]

Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = 2PR/(P+R). Macro lấy trung bình các lớp với trọng số bằng nhau. Điều này giúp lớp ít mẫu vẫn ảnh hưởng đến chỉ số tổng hợp; macro F1 không đồng nhất với F1 tính từ tổng TP/FP/FN của mọi lớp. Báo cáo giữ cả chỉ số theo lớp và macro để tránh lớp đông mẫu che khuất hai lớp còn lại.

AP tóm tắt đường precision–recall qua nhiều mức confidence. Evaluator của đồ án nội suy tại 101 điểm recall. AP50 dùng IoU 0,5; mAP50:95 lấy trung bình qua các mức IoU từ 0,50 đến 0,95, bước 0,05, rồi qua các lớp. AP được tính trước ngưỡng vận hành 0,15 nên không lấy bảng PR/F1 tại một ngưỡng làm AP. [2]

| Số đo | Điều kiện cần ghi kèm | Giới hạn |
| --- | --- | --- |
| PR và F1 | Ngưỡng confidence, IoU, phép ghép | Thay ngưỡng có thể đổi mạnh kết quả |
| Macro | Danh sách lớp được trung bình | Không biểu diễn số người thực tế |
| AP50 | Đường PR và IoU 0,5 | Dễ đạt hơn yêu cầu vị trí chặt |
| mAP50:95 | IoU 0,50–0,95 và nội suy | Evaluator nội bộ chưa gồm area/crowd rules |

Confusion matrix P4 dùng phép ghép không xét lớp tại IoU ít nhất 0,5 để phân tích nhầm nhãn và unmatched. Vì tiêu chí này khác phép ghép cùng lớp của PR/F1, số đường chéo không bắt buộc bằng TP trong bảng vận hành. Cần đọc ma trận theo mục tiêu chẩn đoán, không dùng nó để tính lại PR/F1 theo một định nghĩa khác rồi kết luận artifact mâu thuẫn.

Evaluator hiện tại không phải official COCO evaluator. Kết quả có thể tái lập theo code đã pin nhưng không được gọi là tương đương hoàn toàn với benchmark COCO. Chưa đo khoảng tin cậy hoặc đánh giá domain shift, nên các chênh lệch nhỏ giữa run không đủ để khẳng định cải tiến tổng quát.

<!-- page -->
# 2.3 Lựa chọn giao tiếp và cách đo hiệu năng

Ứng dụng dùng HTTP multipart cho ảnh và từng frame video/webcam. Browser giữ nguồn media và quyết định khi nào capture; server chỉ xử lý ảnh độc lập. Cách này tái sử dụng cùng endpoint, giảm trạng thái server và phù hợp demo CPU. Đồ án chưa có phép so sánh thực nghiệm với WebSocket hoặc giao thức streaming khác nên không tuyên bố HTTP tối ưu cho mọi tải. [4,5]

Sampler đặt nhịp cơ hội lấy mẫu 200 ms. Nếu tác vụ trước còn chờ, nó bỏ cơ hội mới thay vì tạo backlog. Do đó, gần 5 frame/giây là mức gần nhịp sampler trong workload nhẹ, không phải giới hạn FPS suy luận tối đa của model. Khi inference chậm hơn, FPS xử lý giảm và số cơ hội bỏ qua tăng; người dùng vẫn có thể phát video ở tốc độ gốc. [5]

Cold readiness đo thời gian từ khởi tạo process đến khi endpoint ready xác nhận model sẵn sàng. Benchmark không xóa OS cache, vì vậy không gọi đây là cold machine hoặc tải đầu tiên sau cài mới. Warm HTTP đo toàn bộ request–response ở client, khác tổng timing nội bộ của adapter. Capture-to-display là ước lượng phần mềm từ lúc capture đến mẫu hiển thị, chưa phải độ trễ màn hình vật lý. [3]

| Lựa chọn | Lý do trong đồ án | Điều chưa kết luận |
| --- | --- | --- |
| HTTP từng frame | Dùng chung contract và trạng thái đơn giản | Chưa so sánh streaming quy mô lớn |
| Một tác vụ đang chờ | Giới hạn backlog và kết quả lỗi thời | Không đảm bảo hủy computation server |
| Snapshot đã phân tích | Overlay gắn đúng frame được gửi | Không phải overlay đồng bộ frame live |
| CPU hai luồng | Môi trường baseline có thể mô tả rõ | Chưa đại diện mọi máy người dùng |

Webcam yêu cầu quyền người dùng và secure context theo API trình duyệt. Localhost có thể dùng cho phát triển; cần kiểm chứng riêng HTTPS và thiết bị thực khi đưa lên host. Test thay `getUserMedia` không kiểm tra hộp thoại quyền của phần cứng. Tài liệu chuẩn về API này là nguồn tham khảo cho yêu cầu môi trường, không chứng minh ứng dụng đã được triển khai an toàn trên Internet. [9]

<!-- page -->
# Chương 3 Phân tích và thiết kế hệ thống
## 3.1 Yêu cầu và truy vết nghiệm thu

Hệ thống có một actor chính và ba use case đầu vào. Yêu cầu chức năng tập trung vào chọn nguồn, trả detection, quản lý bất đồng bộ và hiển thị trạng thái. Yêu cầu phi chức năng gồm giới hạn payload, privacy, accessibility, khả năng tái lập và hiệu năng. Ma trận dưới đây cập nhật từ evidence P11; tài liệu yêu cầu P1 được giữ như nguồn thiết kế lịch sử. [3,4]

| ID | Yêu cầu | Bằng chứng và phần còn thiếu |
| --- | --- | --- |
| FR01–02 | Ảnh và overlay bbox | Fixture resize; đường model thật với media synthetic |
| FR03 | Video local, pause/seek | Unit, E2E và regression race P11 |
| FR04 | Webcam chủ động, cleanup | Fixture permission/track; camera thật chưa đo |
| FR05 | Không backlog, bỏ response cũ | Sampler tests và browser delayed response |
| FR06 | Lỗi, loading, empty, retry | Unit/E2E và native 503 smoke |
| FR07 | Count, FPS và latency | Benchmark 60 giây; không phải số người duy nhất |
| FR08 | Model/schema/timing | Adapter và contract thật; UI không thay thế readiness probe |

`uncertain` từng được nêu như trạng thái suy ra từ threshold, nhưng hiện API/UI vẫn trả ba nhãn và confidence mà chưa áp ngưỡng 0,15 để chuyển trạng thái này. Báo cáo không đánh dấu chức năng đó hoàn thành. Khi phát triển tiếp cần đặc tả rõ cách hiển thị, contract và kiểm thử quanh ngưỡng; P12 chỉ ghi giới hạn, không sửa sản phẩm. [2]

Đối với NFR, các kiểm tra kỹ thuật về bbox, số hữu hạn và CORS có bằng chứng cục bộ; quyền dữ liệu và scene independence vẫn chưa đạt. Budget latency đạt trên workload nội bộ, nhưng hosted HTTPS, setup máy sạch và camera vật lý chưa có evidence. Kết quả CI Compose không thay thế local Compose smoke có weights thật hoặc nghiệm thu triển khai.

Một yêu cầu chỉ được coi là đủ nghiệm thu khi bằng chứng phù hợp ngữ cảnh sử dụng đã có. Vì vậy, trạng thái P11 là hoàn tất regression nội bộ với giới hạn được ghi nhận, không phải tất cả FR/NFR đã đóng. #24, #25 và #26 vẫn cần được đối chiếu toàn bộ DoD trước khi đóng.

<!-- page -->
# 3.2 Kiến trúc triển khai hiện tại

Browser đảm nhận đọc file local, cấp quyền webcam, capture frame, kiểm tra response và render snapshot. Next.js phục vụ ứng dụng web; browser gọi trực tiếp API theo URL cấu hình lúc build. Không có database, hàng đợi media hoặc dịch vụ nhận dạng danh tính. Phần suy luận nằm trong process FastAPI và nạp checkpoint một lần theo vòng đời dịch vụ. [5]

{{architecture}}

Hình 3.1 Kiến trúc local được đối chiếu từ source P11. HTTP localhost là môi trường đã kiểm chứng; HTTPS công khai còn là mục tiêu. Mũi tên biểu diễn dữ liệu, không khẳng định có reverse proxy hoặc dịch vụ lưu trữ.

API thực hiện kiểm tra MIME cho phép, đọc giới hạn byte, decode ảnh và chuyển RGB. Adapter kiểm checksum, cấu trúc checkpoint, metadata và tensor hữu hạn trước khi dựng model. Nếu startup không nạp model được, process vẫn có health nhưng ready và detect trả 503. Cách này cho phép phân biệt process sống với khả năng cung cấp suy luận. [5]

Ở response, kích thước là ảnh gốc; detector tự resize trong model. Browser không giả định bbox đã ở kích thước preview. Sampler và client loại kết quả thuộc generation cũ khi nguồn thay đổi hoặc bị dừng. Abort ở client làm mất hiệu lực tác vụ đang chờ; nó không phải bằng chứng rằng tính toán phía server đã bị dừng tức thì.

Thiết kế không lưu media thành file lịch sử, nhưng payload vẫn tồn tại tạm trong bộ nhớ để decode và xử lý. Điều này khác với tuyên bố “không xử lý dữ liệu cá nhân”. Cấu hình log, hạ tầng và phạm vi triển khai cần được rà riêng trước sử dụng thực tế; P12 không biến kiến trúc stateless thành chứng nhận privacy cho mọi môi trường.

<!-- page -->
# 3.3 Contract ảnh và xử lý lỗi

Endpoint `POST /api/v1/detect` nhận multipart field `image`. `schema_version` giữ giá trị `1.0`; response có `image`, `model`, `detections` và `timing_ms`. Video/webcam không thêm endpoint mới, không gửi file video nguyên vẹn. Schema và client validation bảo vệ ranh giới giữa API và giao diện. [5]

| Trường | Dữ liệu | Quy tắc cần giữ |
| --- | --- | --- |
| image | width, height | Kích thước gốc đã decode |
| model | name, version | Version là checksum checkpoint |
| detections | class_id, label, confidence, bbox | Nhãn đúng class map; confidence hữu hạn [0,1] |
| bbox | x1, y1, x2, y2 | Diện tích dương, nằm trong ảnh |
| timing_ms | preprocess, inference, postprocess | Timing thật trong adapter |

Giới hạn mặc định là 10 MiB, định dạng cho phép JPEG/PNG/WebP. Server kiểm MIME khai báo và khả năng decode qua Pillow. Source hiện không đối chiếu đầy đủ MIME khai báo với định dạng thực decode; vì vậy không tuyên bố mọi trường hợp MIME giả đều bị từ chối. Response bbox còn được kiểm tra ở adapter và client; box suy biến bị bỏ khỏi đầu ra. [5]

| Mã HTTP | Ý nghĩa | Hành vi giao diện cần phân biệt |
| --- | --- | --- |
| 413 | Payload quá lớn | Báo giới hạn và cho chọn lại |
| 415 | MIME khai báo không hỗ trợ | Báo loại file không hợp lệ |
| 422 | Không decode được ảnh | Báo file lỗi |
| 503 | Model chưa sẵn sàng | Báo lỗi readiness, không coi là không có mặt |
| 500 | Lỗi suy luận | Báo lỗi xử lý, không hiển thị kết quả giả |

Phản hồi thành công với detections rỗng có nghĩa model không trả detection hợp lệ trong lần xử lý đó. Nó không chứng minh không có người trong ảnh, đặc biệt với recall thấp của baseline. Lỗi model không được chuyển thành response rỗng thành công. Timeout hoặc kết quả cũ không được ghi đè nguồn vừa chọn, kể cả khi request cũ hoàn tất sau request mới.

<!-- page -->
# 3.4 Trình tự xử lý ảnh và video

Luồng ảnh bắt đầu khi người dùng chọn file. Browser kiểm loại và kích thước, tạo preview rồi gửi multipart. Khi response hợp lệ trở về, giao diện gắn bbox vào ảnh đúng nguồn; nếu người dùng đổi ảnh trước đó thì kết quả cũ mất hiệu lực. Nút retry phục vụ lỗi có thể thử lại, còn lỗi loại file yêu cầu chọn đầu vào phù hợp. Các trạng thái loading, lỗi và empty có thông điệp riêng. [4,5]

Luồng video bắt đầu bằng object URL từ file local. Sau khi media phát và đủ dữ liệu, sampler capture frame JPEG, gọi API rồi cập nhật snapshot. Video gốc vẫn phát trên browser; frame đã phân tích được trình bày riêng để bbox không bị hiểu là thuộc frame live mới. Pause, seek, thay file hoặc đổi tab làm dừng generation hiện tại và giải phóng snapshot không còn phù hợp.

{{sequence}}

Hình 3.2 Trình tự một frame và nhánh loại response cũ. Sơ đồ mô tả thuật toán đang dùng trong sampler và workspace, không biểu diễn một kết nối streaming liên tục.

Khóa `busy` được giữ đến khi promise cũ settle. Khi stop, generation tăng và AbortController được gọi; một tác vụ mới không được chạy chồng chỉ vì tác vụ cũ đã mất hiệu lực hiển thị. Nếu tick đến trong lúc busy, sampler tăng số cơ hội bỏ qua. Nhờ vậy, việc phát nhanh hoặc thay đổi trạng thái liên tục không tạo hàng đợi request không giới hạn. [5]

P11 phát hiện media có thể tạm chưa sẵn sàng trước event seeking/pause. Nhánh cũ đi vào lỗi và khóa tự restart, dù playback tiếp tục. Bản sửa dừng sampler, hủy generation và giải phóng snapshot rồi chờ playing/seeked. API/decode error thật vẫn đi theo nhánh lỗi có retry. Đây là sửa vòng đời video, không phải thay đổi chất lượng model. [3]

<!-- page -->
# 3.5 Webcam giao diện và khả năng tiếp cận

Webcam chỉ gọi `getUserMedia` sau thao tác bắt đầu. Browser yêu cầu video, không yêu cầu audio; track cần được stop khi người dùng dừng, đổi tab, unmount hoặc khi yêu cầu khởi động cũ không còn phù hợp. Response đến muộn phải bị bỏ nếu phiên camera đã kết thúc. VideoWorkspace và WebcamWorkspace dùng chung sampler nhưng giữ vòng đời nguồn riêng. [5]

{{webcam}}

Hình 3.3 Giao diện webcam với media không khuôn mặt và response fixture do P12 tạo để minh họa overlay. Đây là ảnh chụp giao diện, không phải kết quả model hoặc thử camera vật lý.

Giao diện hiển thị số detection trong frame gần nhất, nhãn/confidence và thống kê lấy mẫu. FPS là đại lượng phụ thuộc khoảng đo, không phải tốc độ cảm biến. Một người xuất hiện trong nhiều frame không được cộng thành nhiều người duy nhất. Các thông điệp lỗi và trạng thái cần đọc được bằng chữ, không chỉ qua màu bbox. [4]

Unit/browser fixture đã kiểm tra thao tác quyền bị từ chối, retry và track cleanup trong môi trường giả lập. Điều này xác nhận logic ứng dụng dưới những tình huống được mô phỏng. Hộp thoại quyền hệ điều hành, driver, camera bị thiết bị khác chiếm và mất kết nối phần cứng vẫn cần kịch bản nghiệm thu trên máy thật. Không mở camera người dùng chỉ để chụp hình báo cáo.

Các control có nhãn và vùng status hỗ trợ người dùng hiểu tình trạng xử lý. P11 có kiểm tra giao diện desktop/mobile trong Chromium, nhưng chưa có audit accessibility độc lập hoặc kiểm chứng tất cả trình đọc màn hình. Báo cáo ghi mức bằng chứng này thay vì gắn nhãn “đạt accessibility” cho toàn ứng dụng.

<!-- page -->
# Chương 4 Xây dựng hệ thống
## 4.1 Dữ liệu và giới hạn quyền sử dụng

Nguồn dữ liệu là Face Mask Detection của uploader andrewmvd/Larxel trên Kaggle, version 1. Bản gốc có 853 PNG và 853 Pascal VOC XML, tổng 4.072 bbox. Uploader công bố Public Domain/CC0; audit đã tìm lại trang MakeML lưu trữ có dẫn dữ liệu. Tuy nhiên, metadata không cung cấp mapping tác giả hoặc consent từng ảnh; một số hình có watermark stock. Không coi license metadata của uploader là xác minh quyền mọi ảnh. [1]

Curated v1 sửa 12 bbox vượt biên trong 11 XML theo mép ảnh, loại cả 10 ảnh của 5 cặp duplicate có annotation xung đột. Bản gốc được giữ nguyên; bản curated không đổi byte ảnh retained. Quyết định này giảm dữ liệu nhưng tránh tự chọn một annotation không có căn cứ chuẩn. Audit kỹ thuật đạt không đồng nghĩa quyền pháp lý hoặc consent đã được giải quyết.

| Phiên bản | Ảnh | Bbox | Vai trò |
| --- | --- | --- | --- |
| Gốc v1 | 853 | 4.072 | Nguồn giữ nguyên để truy vết |
| Curated v1 | 843 | 3.970 | Thí nghiệm nội bộ đã được cho phép |
| Train | 670 | 3.045 | Học tham số |
| Validation | 98 | 565 | Chọn ngưỡng |
| Test | 75 | 360 | Đo sau khi khóa quyết định |

Quyết định ngày 17/10 cho phép thí nghiệm nội bộ trên dữ liệu hiện tại với các giới hạn đã biết. Quyết định đó không cấp quyền phát hành media/weights hoặc triển khai checkpoint. Vì vậy, các cờ `p3_ready=false` và `scene_leakage_verified=false` vẫn được giữ, dù baseline đã train và có metric. Đây là hai loại trạng thái khác nhau: cho phép thử nghiệm có giới hạn và hoàn tất gate dữ liệu. [1,2]

Tài liệu P12 không chứa ảnh dataset. Các minh họa giao diện dùng synthetic không khuôn mặt; bảng chất lượng trích từ report số học. Khi làm tiếp, cần bằng chứng quyền từng nguồn phù hợp hoặc thay nguồn có quyền rõ, rồi thiết kế lại đánh giá nếu thay dữ liệu. Không chỉ đổi mô tả license để vượt gate.

<!-- page -->
# 4.2 Chia tập và khả năng tái lập

Manifest curated cố định seed 42 và gồm hash ảnh/XML/pixel, split, group và annotation. Nhóm được tạo bằng exact pixel, dHash và CSV review scene/source ứng viên. Các nhóm đã ghi không cắt qua split; hai lần audit curated tạo manifest giống từng byte. Tuy nhiên, heuristic có thể bỏ sót ảnh cùng cảnh hoặc gộp nhầm, nên kết quả không chứng minh scene independence tuyệt đối. [1]

CSV review gom 281/843 ảnh vào 38 nhóm; 562 ảnh còn unresolved. Không gán singleton rồi coi là đã xác minh độc lập. Các nhóm lớn bảo thủ có thể làm tỉ lệ split lệch khỏi 70/15/15 kỳ vọng. Manifest thực tế có 670/98/75 ảnh; báo cáo dùng số thực thay vì làm tròn thành tỉ lệ mục tiêu để mô tả dữ liệu. Không chỉnh seed nhằm cải thiện metric.

| Split | with_mask | without_mask | mask_worn_incorrectly |
| --- | --- | --- | --- |
| Train | 2.358 | 594 | 93 |
| Validation | 479 | 72 | 14 |
| Test | 299 | 49 | 12 |
| Tổng | 3.136 | 715 | 119 |

Lớp đeo sai chỉ có 12 bbox trong test. Một thay đổi rất nhỏ về số bbox ghép đúng có thể làm recall thay đổi đáng kể, nên không suy diễn khả năng tổng quát từ một tỷ lệ riêng lẻ. Báo cáo chưa có metadata tin cậy để chia lỗi theo tuổi, giới, địa lý hoặc ánh sáng. Mất cân bằng lớp là điều quan sát được; nguyên nhân đầy đủ của mọi lỗi vẫn chưa được chứng minh. [1,2]

Manifest SHA-256: `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3`.

Hash giúp xác nhận đang dùng cùng artifact, không xác nhận chất lượng nhãn hoặc quyền sử dụng. Khi tái lập, cần cùng config, phiên bản thư viện và checkpoint; không chỉ cùng tên thư mục. Nếu đổi annotation, phải tạo version mới, ghi change log và đánh giá lại theo quy trình khóa test phù hợp. Bộ nguồn trong repo liên kết các artifact ngoài repo thay vì commit dữ liệu lớn. [1,4]

<!-- page -->
# 4.3 Baseline và adapter suy luận

Baseline dùng TorchVision SSDLite320 MobileNetV3 Large, khởi tạo từ đầu với cả `weights=None` và `weights_backbone=None`. Model có bốn class ID gồm background; ba ID nghiệp vụ là 1, 2 và 3. Không tải pretrained weights hoặc dùng metric COCO của thư viện làm kết quả đồ án. Checkpoint giữ epoch 30, không gọi là epoch tốt nhất được chọn từ một cuộc so sánh nhiều checkpoint. [2,7]

| Tham số | Giá trị đã dùng |
| --- | --- |
| Seed | 42 |
| Device và batch | CPU, batch 2 |
| Epoch | 30 |
| Optimizer | SGD, learning rate 0,005; momentum 0,9 |
| Regularization | Weight decay 0,0005 |
| Scheduler | StepLR, step 20; gamma 0,1 |
| Torch và TorchVision | 2.9.0+cpu và 0.24.0+cpu |

Adapter đọc bytes checkpoint, kiểm SHA-256 và deserialize chính bytes đã hash với `weights_only=True`. Nó kiểm schema checkpoint, config hash, class map, kiến trúc và tính hữu hạn của tham số; sau đó load state strict và chuyển model sang eval. Cách kiểm cùng bytes tránh tình huống file bị thay giữa bước hash và deserialize. Checksum vẫn phải do bên tin cậy cung cấp; hash một file không tự biến nó thành nguồn tin cậy. [5]

Ảnh được chuyển RGB, tensor float trong [0,1]; detector tự resize. Suy luận dùng `torch.inference_mode()` và hai CPU threads. Adapter kiểm output shape, class ID, score, bbox hữu hạn và giới hạn ảnh; box không có diện tích dương không được phát ra. Timing chia preprocess, inference và postprocess theo đồng hồ đơn điệu. [5]

Checkpoint SHA-256: `1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.

Nếu checksum sai hoặc load không thành công, startup không gán detector; ready/detect trả 503. Không fallback sang model rỗng để che lỗi. Cần restart process để nạp lại checkpoint; P12 không thêm cơ chế hot reload hoặc thay weights đang được kiểm chứng.

<!-- page -->
# 4.4 Triển khai giao diện và vận hành local

Giao diện có ba workspace dùng lại preview, kết quả, thông báo và thống kê. ImagePreview ghép overlay với kích thước ảnh hiển thị; captureFrame chuyển media element thành ảnh gửi đi; shared sampler quản lý busy, generation, interval và abort. Cấu trúc này tái sử dụng hành vi cần dùng chung mà vẫn tách quyền truy cập camera khỏi file video local. [5]

{{image}}

Hình 4.1 Luồng ảnh với media synthetic không khuôn mặt và response fixture minh họa bbox. Hai nhãn trên hình là dữ liệu kiểm thử, không chứng minh khả năng nhận diện của checkpoint.

Next.js cần URL API lúc build; CORS allowlist nằm phía FastAPI. Với demo local, browser và API chạy hai process riêng. Với Compose, các service có health checks nhưng ready vẫn phụ thuộc checkpoint. Cấu hình hợp lệ chỉ xác nhận tệp Compose được parse, không chứng minh container hoặc model đã chạy. [3,5]

CI có job Compose không weights để kiểm tra đường web/API, CORS và thông báo 503. P11 local không kết nối được Docker Linux engine pipe, nên fallback native chỉ xác minh HTTP/UI/CORS trên process local. Báo cáo giữ cả hai nguồn và ngữ cảnh; không gọi native smoke là local container smoke hoặc dùng CI không weights làm bằng chứng container với checkpoint thật.

Không công bố URL preview HTTPS trong báo cáo vì chưa có URL được kiểm chứng. Demo dự phòng local có thể dùng code/checkpoint đã pin trong phạm vi nội bộ và media synthetic. Các bước rehearsal với camera thật, rollback hosted và clean-machine setup vẫn thuộc nghiệm thu tiếp theo, không được thay bằng ảnh chụp giao diện.

<!-- page -->
# Chương 5 Kiểm thử và thực nghiệm
## 5.1 Chiến lược kiểm chứng phần mềm

Kiểm chứng gồm unit/contract tests, browser fixtures, smoke native và benchmark với model thật. Mỗi tầng trả lời một câu hỏi riêng. Fixture cho phép chủ động tạo lỗi và response muộn; model thật kiểm tra adapter/checkpoint trên workload cụ thể. Không dùng fixture làm bằng chứng độ chính xác model hoặc camera vật lý. [3]

| Suite P11 | Kết quả | Phạm vi |
| --- | --- | --- |
| Frontend unit | 81 tests, 6 files | UI, client, sampler và race video |
| Backend | 24 tests | API/loader/contract, weights synthetic |
| ML | 37 tests | Chuẩn bị dữ liệu, evaluator, trainer self-check |
| Benchmark unit | 3 tests | Percentile, readiness, denominator/memory |
| Browser fixture | 4 tests | Chromium desktop/mobile, ba luồng |
| Native no-model smoke | 1 test | Web/health 200, ready/detect 503 và CORS |

Typecheck, lint và production build đạt trong các lượt release P11. Browser chạy Chromium 156.0.8078.4; desktop 1440×1000 và mobile 390×844, DPR1. Đây là cấu hình browser được mô tả, chưa bao phủ Firefox/WebKit, thiết bị di động thực hoặc màn hình có mọi mức DPR. Các số test là snapshot lịch sử P11, không phải P12 đã chạy lại tất cả suite.

PR #39 tại source HEAD `88687c9` có năm job web, inference, ml, e2e và compose đạt khi xác minh ngày 20/10/2026. CI là evidence tự động trên môi trường workflow; nó không phải review độc lập nội dung báo cáo hoặc nghiệm thu giảng viên. Source benchmark sau sửa thuộc commit `42a0f76`; commit tài liệu tiếp theo không thay model. [3]

P11 chưa xác minh pip integrity cho ML venv vì môi trường không có module pip; ML tests vẫn đạt. Inference `pip check` đạt. Hạn chế môi trường này được giữ trong báo cáo thay vì cài thêm dependency chỉ để thay đổi trạng thái kiểm tra. Kết quả local không được mô tả thành clean install trên máy mới.

<!-- page -->
# 5.2 Chọn ngưỡng và kết quả chất lượng

Validation gồm 98 ảnh và 565 bbox. Grid confidence từ 0,05 đến 0,95, bước 0,05, chọn macro F1 lớn nhất; nếu hòa chọn ngưỡng cao hơn. Ngưỡng 0,15 được khóa trước khi đánh giá test 75 ảnh/360 bbox. P11 không đo lại test, thay split hoặc điều chỉnh threshold; P12 trích đúng kết quả P4. [2]

| Split | Macro precision | Macro recall | Macro F1 | AP50 | mAP50:95 |
| --- | --- | --- | --- | --- | --- |
| Validation | 0,3182 | 0,1560 | 0,1771 | 0,1153 | 0,0495 |
| Test | 0,2393 | 0,1975 | 0,2061 | 0,1792 | 0,0820 |

| Lớp test | Support | Precision | Recall | F1 |
| --- | --- | --- | --- | --- |
| with_mask | 299 | 0,4321 | 0,4682 | 0,4494 |
| without_mask | 49 | 0,1429 | 0,0408 | 0,0635 |
| mask_worn_incorrectly | 12 | 0,1429 | 0,0833 | 0,1053 |

Chỉ có 2/49 bbox `without_mask` và 1/12 bbox `mask_worn_incorrectly` ghép đúng theo phép đo cùng lớp. Hệ thống bỏ sót phần lớn đối tượng của hai lớp này. Vì vậy, latency thấp không đủ để hỗ trợ cảnh báo đáng tin cậy. Dùng một chỉ số trung bình mà bỏ bảng theo lớp sẽ che khuất giới hạn quan trọng nhất của baseline.

| Lớp | AP50 | mAP50:95 |
| --- | --- | --- |
| with_mask | 0,4251 | 0,2034 |
| without_mask | 0,0190 | 0,0086 |
| mask_worn_incorrectly | 0,0936 | 0,0340 |

API/UI hiện không áp ngưỡng 0,15; API dùng score floor 0,001 và trả confidence. Do đó ảnh giao diện hoặc số detection API không thể đọc trực tiếp như kết quả PR/F1 tại ngưỡng vận hành. Muốn so sánh cần dùng đúng hậu xử lý và định nghĩa phép đo, đồng thời không tuning dựa trên test đã mở. [2,5]

<!-- page -->
# 5.3 Phân tích lỗi và regression video

Confusion matrix dưới đây có hàng là truth, cột là prediction; background biểu diễn unmatched. Phép ghép không xét lớp tại IoU ít nhất 0,5 phục vụ chẩn đoán, khác phép ghép cùng lớp của bảng PR/F1. Vì thế hai bảng không có nghĩa vụ có cùng số đường chéo/TP. [2]

| Truth / Prediction | Background | Có khẩu trang | Không khẩu trang | Đeo sai |
| --- | --- | --- | --- | --- |
| Background | 0 | 181 | 13 | 6 |
| Có khẩu trang | 159 | 140 | 0 | 0 |
| Không khẩu trang | 47 | 1 | 0 | 1 |
| Đeo sai | 9 | 2 | 1 | 0 |

Diagnostic report ghi 215 truth bị bỏ sót, 5 nhầm lớp, 94 prediction lỗi định vị và 106 prediction dư. Một lỗi định vị có thể để lại truth bị bỏ sót, nên không cộng bốn số thành số lỗi độc lập. Phân loại này dựa vào bbox/nhãn; chưa có review hình ảnh đủ để quy nguyên nhân cho ánh sáng, góc mặt hoặc mặt nhỏ. Các nguyên nhân đó chỉ nên là giả thuyết cho thực nghiệm sau.

Ở phần mềm, benchmark run 1 ghi complete nhưng video chỉ hiển thị 40 frame trong 60,78 giây. Guard bổ sung yêu cầu có snapshot mới trong mỗi khoảng 5 giây, đồng thời lưu media state và UI alerts. Run 2 fail đúng khi playback vẫn chạy nhưng UI bị khóa ở lỗi “Video chưa sẵn sàng”. Các failed run được giữ để phân biệt lỗi sản phẩm với HTTP error. [3]

Root cause là sampler quan sát media tạm unready trước seeking event; nhánh lỗi khóa restart. Bản sửa dừng/hủy generation và giải phóng snapshot trước khi chờ playing/seeked, giữ nhánh API/decode error thật. Một test tái hiện fail trên code cũ rồi pass sau sửa. Benchmark run 3 kiểm chứng stream dài; fault injection pause có chủ đích khiến guard fail như mong đợi, còn driver tự kiểm tra exit code/message thì pass.

Guard liveness là điều kiện hợp lệ của phép đo, không phải một budget chất lượng model mới. Việc giữ raw thất bại giúp người đọc không hiểu run 3 là kết quả được chọn mà bỏ qua lỗi chưa giải quyết.

<!-- page -->
# 5.4 Hiệu năng local với checkpoint thật

Run 3 P11 chạy Windows 11, Intel Core i5-13500H, RAM khoảng 16,8 GB; Python 3.12.14, Node 24.19.0 và Chromium 156.0.8078.4. Inference dùng CPU hai luồng. CI dùng Node 22 nên không gọi môi trường local giống hệt CI. Media là PNG 320×240 và video/webcam synthetic không khuôn mặt; API nạp checkpoint thật đã pin. [3]

| Phép đo | Mẫu thành công | p50 ms | p95 ms |
| --- | --- | --- | --- |
| Process-cold readiness | 5/5 | 3.549,30 | 3.567,03 |
| Warm API HTTP | 100/100 | 34,50 | 36,89 |
| Browser ảnh HTTP | 1/1 | 41,31 | 41,31 |
| Browser video HTTP | 296/296 | 36,62 | 41,33 |
| Browser webcam HTTP | 302/302 | 35,95 | 40,03 |

| Luồng | Thời lượng s | Snapshot hiển thị | FPS hiển thị | Capture-to-display p95 ms |
| --- | --- | --- | --- | --- |
| Video | 60,31 | 296 | 4,91 | 89,50 |
| Webcam synthetic | 60,37 | 301 | 4,99 | 86,00 |

Webcam có 302 response nhưng chỉ 301 snapshot trong mẫu hiển thị khi phase kết thúc. Báo cáo dùng đúng denominator và không đồng nhất HTTP throughput với displayed FPS. Video có một stop abort được ghi riêng; không có unexpected request failure, UI alert hoặc page error trong run cuối. Một mẫu ảnh chỉ là smoke, không đủ để diễn giải p95 thành một phân bố ổn định.

Peak sampled process-tree working set là 356,83 MiB cho API và 102,09 MiB cho web; page JS heap 7,96 MiB. Working set có thể đếm trùng shared pages; JS heap không phải tổng bộ nhớ Chromium. Poll mỗi giây có thể bỏ lỡ peak ngắn và chưa có memory budget pass/fail. Những số này hỗ trợ mô tả môi trường thử, không dự báo bộ nhớ mọi host.

Warm/cold/error budgets nội bộ đạt với workload đã nêu. Không suy diễn thành chất lượng phát hiện trên người thật, tải đồng thời, camera phần cứng hoặc HTTPS công khai. Gần 5 FPS phản ánh cả nhịp sampler 200 ms; không gọi đó là trần tốc độ của detector.

<!-- page -->
# 5.5 Đối chiếu nghiệm thu và hạn chế

Phần mềm đã có đường ảnh/video/webcam tới adapter thật trong thử nghiệm local với media synthetic. Kiểm thử tự động hỗ trợ xử lý lỗi, overlay và vòng đời; baseline có phép đánh giá test đã khóa. Tuy nhiên, cả chất lượng model lẫn điều kiện sử dụng dữ liệu chưa đủ cho triển khai công khai. Cần đọc kết quả theo ma trận dưới đây thay vì một nhãn “hoàn thành” duy nhất. [1–4]

| Hạng mục | Kết luận có căn cứ | Phần cần làm tiếp |
| --- | --- | --- |
| Ba luồng web | Fixture và model local synthetic có evidence | Camera vật lý, browser khác |
| Model | Test macro F1 0,2061, minority recall thấp | Dữ liệu và baseline tốt hơn theo quy trình mới |
| Dữ liệu | Audit kỹ thuật curated đạt | Quyền từng ảnh, scene independence |
| Hiệu năng | Budget local đạt trên workload synthetic | Tải đại diện và môi trường đích |
| Container | CI no-model Compose đạt | Local runtime/checkpoint và setup độc lập |
| Hosted preview | Chưa kiểm chứng | HTTPS, camera, rollback |
| Tài liệu P12 | Bộ để review, có nguồn | Bìa, đóng góp và review độc lập |

Không dùng test synthetic để nâng trạng thái quyền dữ liệu. Không dùng mAP benchmark của model pretrained để thay baseline scratch. Không dùng Compose config exit 0 hoặc native smoke để khẳng định container đã chạy. Các ranh giới này giúp người đọc hiểu bằng chứng nào còn có thể thiếu ngay cả khi CI xanh.

Đối với nghiên cứu tiếp theo, ưu tiên nguồn dữ liệu có quyền rõ và annotation được review; sau đó thiết kế split và test mới khi có thay đổi dữ liệu đáng kể. Có thể cân nhắc pretrained baseline phù hợp license hoặc huấn luyện tốt hơn, nhưng cần thí nghiệm đối chứng trước khi kết luận. Đây là hướng phát triển, không phải công việc P12 đã thực hiện.

Đối với nghiệm thu phần mềm, cần chạy setup độc lập, kiểm tra camera thật, Docker engine và môi trường HTTPS sau khi các gate dữ liệu/model cho phép. Không tự merge hoặc deploy chỉ vì đã hoàn tất báo cáo. Issue #24/#25/#26 giữ mở khi DoD còn thiếu; trạng thái và liên kết PR phải được cập nhật bằng bằng chứng thay vì tỷ lệ tiến độ dự đoán.

<!-- page -->
# Kết luận và hướng phát triển

Đồ án đã xây dựng được ứng dụng web có ba đầu vào dùng chung contract ảnh, adapter SSDLite thật, kiểm tra checkpoint và các cơ chế quản lý tác vụ bất đồng bộ. Các lớp giao diện, API và ML có kiểm thử riêng; benchmark với checkpoint thật đã phát hiện một race video mà test fixture trước đó chưa bộc lộ. Việc tái hiện, sửa và kiểm chứng lại cho thấy cần kết hợp kiểm thử có kiểm soát với chạy stream dài. [3,5]

Kết quả chất lượng là hạn chế lớn nhất của baseline. Test macro F1 0,2061 và mAP50:95 0,0820 đi cùng recall rất thấp ở hai lớp ít mẫu. Do đó ứng dụng hiện chỉ phù hợp trình diễn kỹ thuật nội bộ trong phạm vi được cho phép. Không có cơ sở đưa vào cảnh báo tự động hoặc quyết định về con người. Confidence hiển thị chưa được calibration và trạng thái `uncertain` chưa triển khai. [2]

Hiệu năng local đạt budget đề xuất, nhưng media synthetic không đại diện đủ phân bố ảnh thực. Quyền từng ảnh và scene independence chưa được xác minh; 562 ảnh retained còn unresolved theo review grouping. Setup máy sạch, camera vật lý, Firefox/WebKit, HTTPS và rollback hosted cũng chưa có evidence. Những giới hạn này tiếp tục giữ deployment gate CLOSED. [1,3]

Hướng phát triển trước hết là hoàn thiện điều kiện dữ liệu, sau đó mới mở rộng thực nghiệm model. Mọi thay đổi split hoặc baseline cần được version hóa, chọn tham số trên validation và giữ một phép đánh giá test phù hợp. Phần mềm cần kiểm chứng thêm các môi trường đích và thao tác phần cứng; các kết quả đó phải được ghi thành bằng chứng mới, không thay ngược lịch sử P4/P11.

Trước khi nộp, nhóm cần bổ sung MSSV, khóa và đóng góp cá nhân, kiểm tra biểu mẫu học phần, review nội dung và rehearsal. Bộ P12 là phiên bản để review có thể chỉnh sửa, không phải biên bản nghiệm thu của giảng viên. Các nguồn, số đo và lệnh tái lập trong phụ lục giúp nhóm kiểm tra lại nội dung khi chuẩn bị bảo vệ.

Cam kết sử dụng trong phạm vi đồ án: không phát hành media khuôn mặt hoặc weights chưa đủ quyền, không khẳng định hiệu quả y tế và không nhận diện danh tính. Không có review độc lập nào được giả định từ việc tài liệu đã render hoặc CI đã đạt.

<!-- page -->
# Tài liệu tham khảo

[1] Nhóm đồ án. Dataset Card và curated audit. Snapshot P11, 20/10/2026. Repo: https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/dataset-card.md. Nguồn audit lịch sử; quyền từng ảnh chưa xác minh.

[2] Nhóm đồ án. Model Card và P4 evaluation report. https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/model-card.md. Report JSON và quyết định validation được định danh trong danh mục evidence P12.

[3] Nhóm đồ án. P11 regression report và PR #39. https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/regression-report.md. https://github.com/anhpd-glinteco/face-mask-detection/pull/39. CI snapshot được ghi ngày 20/10/2026.

[4] Nhóm đồ án. Kế hoạch, yêu cầu và use cases. https://github.com/anhpd-glinteco/face-mask-detection/tree/88687c9/docs/report. Tài liệu P1 là thiết kế mục tiêu; báo cáo này đối chiếu thêm triển khai P11.

[5] Nhóm đồ án. Source web, inference và HTTP frame sampling ADR. https://github.com/anhpd-glinteco/face-mask-detection/tree/88687c9. Các mô tả hành vi được đối chiếu source, không phải cam kết môi trường chưa thử.

[6] Liu, W. và cộng sự. SSD Single Shot MultiBox Detector. ECCV 2016, arXiv:1512.02325. https://arxiv.org/abs/1512.02325. Truy cập 20/10/2026. Dùng làm cơ sở detection, không trích metric bài báo thành metric đồ án.

[7] TorchVision. ssdlite320_mobilenet_v3_large. https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.detection.ssdlite320_mobilenet_v3_large.html. Truy cập 20/10/2026. Trang stable hiện là bản 0.29; thực nghiệm đồ án dùng 0.24.0, cấu hình trong repo là nguồn cho tham số đã chạy.

[8] Howard, A. và cộng sự. Searching for MobileNetV3. ICCV 2019, arXiv:1905.02244. https://arxiv.org/abs/1905.02244. Truy cập 20/10/2026. Cơ sở backbone, chưa có so sánh hiệu năng backbone trong đồ án.

[9] MDN Web Docs. MediaDevices getUserMedia. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia. Truy cập 20/10/2026. Tham khảo quyền camera và secure context.

Nguồn ảnh giao diện: script capture-fixtures.mjs của P12, media synthetic không khuôn mặt và response fixture. Nguồn sơ đồ: source P11, P12 biên tập. Không sử dụng ảnh dataset hoặc hình minh họa nhận diện người thật.

<!-- page -->
# Phụ lục A Tái lập và danh mục evidence

Các lệnh sau minh họa từ repo đã checkout; không tự tải dữ liệu hoặc weights. Dùng môi trường đã pin và checkpoint được cung cấp nội bộ theo đúng quyền. Tạo output mới cho mỗi benchmark để giữ raw run trước. Cần kiểm tra port rảnh và chỉ dừng process do lần chạy tạo ra. [3]

```text
# apps/web
npm ci
npm run test
npm run typecheck
npm run lint
npm run test:e2e

# services/inference, sau khi cài requirements
python -m pytest tests -v

# repo root, môi trường ML và inference tương ứng
python -m unittest discover -s ml/tests -v
python -m unittest discover -s scripts/benchmark -v
python scripts/benchmark/run.py --help
docker compose config --quiet
```

Benchmark cần `--checkpoint`, `--sha256` và `--output` trỏ tới thư mục mới. Full command và runtime nằm trong regression report [3]; không chèn đường dẫn cá nhân thành yêu cầu bắt buộc cho máy khác. Model path và checksum phải cùng artifact; không dùng checkpoint không rõ nguồn. Lệnh tái lập không chứng minh clean-machine setup đã được nghiệm thu.

| Evidence ID | Nguồn | Điều chứng minh |
| --- | --- | --- |
| E01 | P4 validation decision/report | Chọn ngưỡng trước test |
| E02 | P4 test/report.json | PR/F1/AP và confusion test |
| E03 | P11 run 3 api-summary.json | 5 cold, 100 warm |
| E04 | P11 run 3 browser-summary.json | Counts, duration, HTTP/display FPS |
| E05 | P11 memory.json, environment.json | Môi trường và sampled memory |
| E06 | P11 release logs và PR #39 CI | Kiểm thử phần mềm lịch sử |
| E07 | P12 fixture screenshots | Minh họa giao diện, không đo model |

Danh mục evidence đi kèm ghi đường dẫn artifact thực tế, SHA-256 và snapshot remote. Chỉ các file nhỏ cần thiết được lưu cùng bộ P12; dataset, weights và raw browser lớn giữ tại vị trí nội bộ hiện có. Người nhận cần được cấp nguồn phù hợp để tái lập toàn bộ; báo cáo không giả định artifact riêng đã công khai.

<!-- page -->
# Phụ lục B Kịch bản demo và thông tin cần bổ sung

Kịch bản khoảng hai phút trong bài trình bày: mở giao diện và nêu phiên bản nội bộ; chọn ảnh synthetic, chỉ rõ bbox fixture nếu dùng chế độ minh họa; chọn video local để quan sát snapshot và pause/seek; bật webcam giả lập bằng media synthetic nếu không có nghiệm thu camera thật; dừng và giải thích cleanup. Không gọi fixture là model thật hoặc webcam giả lập là camera phần cứng.

{{video}}

Hình B.1 Video local synthetic với response fixture do P12 tạo để minh họa thao tác. Đây là hình phục vụ trình bày giao diện; benchmark checkpoint thật là evidence E03–E05, tách khỏi ảnh này.

Nếu demo checkpoint thật, phải nêu chất lượng baseline thấp và giới hạn quyền; giữ phạm vi nội bộ. Nếu API không sẵn sàng, trình bày lỗi 503 và dùng PDF/video evidence đã có thay vì trả detection giả. Video demo hoàn chỉnh, rehearsal và danh mục release thuộc P13, chưa được báo cáo này tuyên bố hoàn tất.

| Mục trước khi nộp | Trạng thái P12 |
| --- | --- |
| MSSV và khóa đào tạo | Cần bổ sung |
| Đóng góp từng thành viên và xác nhận | Cần bổ sung |
| Mẫu/font/lề chính thức của học phần | Chưa được cung cấp; dùng định dạng đề xuất |
| Review độc lập nội dung và slide | Chưa có minh chứng |
| Camera vật lý, hosted demo và rollback | Chưa kiểm chứng |
| Video demo và rehearsal P13 | Chưa thực hiện trong P12 |

Giữ issue #26 mở cho đến khi toàn bộ thông tin bắt buộc và review phù hợp được ghi nhận. Không ghi chữ ký hoặc xác nhận của giảng viên/nhóm khi chưa được cung cấp. Nội dung có thể chỉnh sửa trong DOCX/PPTX; PDF là bản cố định để đọc và đối chiếu cùng version.
