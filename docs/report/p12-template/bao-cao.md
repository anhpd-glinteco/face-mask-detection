# LỜI CẢM ƠN

Nhóm xin cảm ơn các thầy cô Trường Công nghệ thông tin và Truyền thông, Đại học Công nghiệp Hà Nội đã giảng dạy những kiến thức giúp nhóm thực hiện đồ án chuyên ngành Kỹ thuật phần mềm. Nhóm cũng xin cảm ơn giảng viên hướng dẫn ThS. Vũ Thị Dương trong quá trình thực hiện đề tài.

Báo cáo trình bày quá trình xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang từ ảnh, video trên máy và webcam. Chất lượng mô hình còn thấp, một số vấn đề về nguồn dữ liệu và điều kiện nghiệm thu chưa được giải quyết. Nhóm trình bày cụ thể những hạn chế này trong phần thực nghiệm và kết luận.

Nhóm mong nhận được góp ý của thầy cô về nội dung và cách trình bày để tiếp tục hoàn thiện đồ án.

Nhóm 1

# TÓM TẮT

Đồ án xây dựng ứng dụng web cho phép người dùng phân tích ảnh, video trên máy và hình ảnh từ webcam. Kết quả gồm vùng phát hiện, nhãn trạng thái đeo khẩu trang và độ tin cậy. Giao diện được xây dựng bằng Next.js, kết nối với API FastAPI và mô hình SSDLite320 MobileNetV3 Large chạy trên CPU. Với video và webcam, trình duyệt lấy mẫu từng khung hình rồi gửi qua HTTP. Mỗi bộ lấy mẫu chờ tác vụ hiện tại hoàn tất trước khi xử lý tiếp; máy chủ không lưu lịch sử ảnh hoặc video. [1–4]

Nhóm đã kiểm thử tự động giao diện, định dạng dữ liệu trao đổi, vòng đời xử lý và các tình huống lỗi. Phiên P11 ghi nhận 81 kiểm thử frontend, 24 kiểm thử backend, 37 kiểm thử ML, 3 kiểm thử công cụ đo hiệu năng và 4 kiểm thử trình duyệt dùng fixture. Khi chạy video, nhóm phát hiện lỗi tranh chấp thời điểm xử lý lúc nguồn phát tạm chưa sẵn sàng. Kiểm thử tái hiện lỗi thất bại trước khi sửa và đạt sau khi sửa; nhóm tiếp tục kiểm tra bằng chạy hồi quy và đo hiệu năng. Những kết quả này phản ánh hoạt động của phần mềm, còn chất lượng nhận diện được đánh giá riêng. [3]

Baseline nội bộ có test macro F1 0,2061 và mAP50:95 0,0820; recall hai lớp ít mẫu thấp. P11 đo warm HTTP p95 36,89 ms, video/webcam hiển thị 4,91/4,99 FPS với checkpoint thật trên media synthetic. Quyền từng ảnh, scene independence và camera vật lý chưa xác minh; deployment gate CLOSED. [1–3]

# MỤC LỤC

{{toc}}

# DANH MỤC THUẬT NGỮ VÀ CHỮ VIẾT TẮT

| Thuật ngữ | Tiếng Anh | Diễn giải |
| --- | --- | --- |
| API | Application Programming Interface | Giao tiếp browser và dịch vụ suy luận |
| Bbox | Bounding box | Hộp giới hạn trong hệ tọa độ ảnh gốc |
| IoU | Intersection over Union | Diện tích giao chia diện tích hợp hai bbox |
| AP | Average Precision | Độ chính xác trung bình theo đường precision–recall |
| mAP | Mean Average Precision | AP trung bình theo lớp và ngưỡng IoU |
| FPS | Frames per second | Frame xử lý/hiển thị mỗi giây trong khoảng đo |
| Fixture | Test fixture | Đầu vào hoặc response kiểm thử có kiểm soát |
| Synthetic | Synthetic media | Media tổng hợp, không phải camera vật lý |
| Readiness | Model readiness | Trạng thái model đã nạp để phục vụ |

# DANH MỤC HÌNH VẼ

{{figures}}

# DANH MỤC BẢNG BIỂU

{{tables}}

<!-- body -->

# CHƯƠNG 1 GIỚI THIỆU DỰ ÁN PHẦN MỀM

## 1.1 Giới thiệu hệ thống và đối tượng sử dụng

Trong một ảnh có thể xuất hiện nhiều người với trạng thái đeo khẩu trang khác nhau. Vì vậy, ứng dụng cần hiển thị kết quả cho từng vùng mà mô hình dự đoán có khuôn mặt. Mỗi kết quả gồm hộp giới hạn (bbox), nhãn và điểm tin cậy (confidence). Tọa độ được trả theo kích thước ảnh gốc để giao diện vẽ hộp đúng vị trí khi ảnh thay đổi kích thước hiển thị. [4]

## 1.2 Mục tiêu và phạm vi áp dụng

Ứng dụng hỗ trợ ba nguồn đầu vào với cùng định dạng yêu cầu phân tích ảnh. Người dùng gửi ảnh trực tiếp; với video và webcam, trình duyệt chỉ gửi khung hình được trích ra. API trả kích thước ảnh, thông tin mô hình, danh sách phát hiện và thời gian xử lý. Trình duyệt kiểm tra phản hồi rồi hiển thị kết quả trên đúng ảnh hoặc khung hình đã gửi. Máy chủ vì thế chỉ xử lý từng ảnh, không cần nhận cả video hay quản lý phiên truyền hình ảnh liên tục. [4,5]

| Nhóm mục tiêu | Điều kiện kiểm chứng | Trạng thái tại P11 |
| --- | --- | --- |
| Ảnh | Upload, lỗi đầu vào, overlay, đổi ảnh | Fixture và đường HTTP local có evidence |
| Video | Lấy mẫu nối tiếp, pause/seek, loại kết quả cũ | Regression và benchmark synthetic đạt sau fix |
| Webcam | Start/stop, quyền, track cleanup | Browser giả lập đạt; chưa camera vật lý |
| Chất lượng | Metric ba lớp trên test đã khóa | Đã đo; chất lượng thấp |
| Hiệu năng | Cold, warm và hai stream 60 giây | Local CPU, workload synthetic |
| Công khai | HTTPS, camera thật, quyền dữ liệu | Chưa đạt, gate đóng |

## 1.3 Khảo sát và cơ sở lựa chọn giải pháp

Nhóm chưa thực hiện khảo sát người dùng bằng bảng hỏi hoặc phỏng vấn có dữ liệu lưu trữ. Việc phân tích nhu cầu dựa trên đặc tả ba luồng sử dụng, các tình huống lỗi và tài nguyên sẵn có của dự án. Báo cáo không đưa vào các biểu đồ hay tỷ lệ khảo sát từ đề tài trong mẫu. Cơ sở lựa chọn giải pháp hiện mới dừng ở yêu cầu kỹ thuật, chưa có kết quả nghiên cứu nhu cầu thực địa. [4]

## 1.4 Quy trình phát triển và phân công công việc

Nhóm chia công việc thành các phiên, bắt đầu từ phân tích yêu cầu và kiến trúc, kiểm tra dữ liệu, huấn luyện baseline rồi đánh giá mô hình. Các phiên tiếp theo xây dựng bộ tích hợp suy luận và ba luồng giao diện, sau đó kiểm thử tích hợp, đo hiệu năng, kiểm thử hồi quy và hoàn thiện tài liệu. Mỗi phiên có đầu ra, pull request (PR) và ghi chú bàn giao. Trạng thái hoàn thành được xác định theo điều kiện kết thúc và bằng chứng thực hiện, không theo ngày dự kiến trong kế hoạch. [4]

| Vai trò theo kế hoạch nhóm | Thành viên | Công việc được phân công |
| --- | --- | --- |
| ML và inference | Nguyễn Đình Luân Kiệt, Bùi Nguyên Hải | Kiệt chuẩn bị, kiểm tra và chia dữ liệu; Hải cấu hình huấn luyện, đánh giá baseline và tích hợp suy luận. Hai bạn cùng rà kết quả và model card. |
| Web | Phùng Đức Anh, Bùi Ngọc Minh Hoàng | Anh xây dựng giao diện ảnh và kết nối API; Hoàng phụ trách video, webcam và bộ lấy mẫu khung hình. Hai bạn phối hợp xử lý lỗi và kiểm thử giao diện. |
| Điều phối QA và triển khai | Bùi Ngọc Minh Hoàng | Tổng hợp kiểm thử, CI, Docker và benchmark; theo dõi lỗi môi trường và ghi điều kiện nghiệm thu còn thiếu. |
| Tài liệu và nghiệm thu | Cả nhóm | Anh tổng hợp báo cáo, slide và hồ sơ tuần; Kiệt, Hải rà dữ liệu và số đo model; Hoàng rà số liệu kiểm thử, hướng dẫn chạy và kịch bản demo. |

## 1.5 Kết luận chương 1

Ứng dụng phục vụ một tác nhân với ba nguồn ảnh, video và webcam, không có tài khoản hoặc cơ sở dữ liệu. Bảng phân công mô tả trách nhiệm của từng thành viên theo kế hoạch nhóm; kết quả thực hiện được đối chiếu với tài liệu và bằng chứng ở các chương sau.

# CHƯƠNG 2 PHÂN TÍCH VÀ ĐẶC TẢ YÊU CẦU PHẦN MỀM

## 2.1 Tác nhân và biểu đồ use case

Ứng dụng có một tác nhân nghiệp vụ là người sử dụng trình duyệt. Người dùng chọn ảnh, video hoặc bật webcam, đồng thời có thể dừng và đổi nguồn. Trình duyệt, FastAPI và bộ phát hiện là các thành phần thực hiện chức năng. Trong phạm vi đồ án, hệ thống không có tài khoản, vai trò quản trị hay cơ sở dữ liệu MySQL; những thành phần này trong đề tài mẫu không được đưa vào thiết kế. [4,5]

Biểu đồ use case được xây dựng bằng PlantUML. Nhóm mô tả tác nhân, các chức năng và quan hệ bằng mã nguồn UML, sau đó xuất sơ đồ thành hình để chèn vào báo cáo. Tác nhân chính là người sử dụng, với ba chức năng phân tích ảnh, video và webcam, cùng các thao tác xem kết quả và dừng hoặc đổi nguồn. Mã nguồn sơ đồ được lưu trong tệp `docs/report/diagrams/system.puml` của dự án. [11]

{{usecases}}

Hình Use case của ứng dụng khẩu trang. Nguồn: Nhóm thực hiện bằng PlantUML, từ sơ đồ P1. Đây là sơ đồ chức năng; các điều kiện nghiệm thu camera thật, dữ liệu và deployment được đánh giá riêng ở chương 5.

## 2.2 Yêu cầu chức năng và truy vết

Ba use case đầu vào mô tả cách người dùng phân tích ảnh, video và webcam. Yêu cầu chức năng tập trung vào chọn nguồn, nhận kết quả phát hiện, quản lý tác vụ bất đồng bộ và hiển thị trạng thái xử lý. Các yêu cầu phi chức năng quy định giới hạn dữ liệu gửi lên, quyền riêng tư, khả năng tiếp cận, tính tái lập và hiệu năng. Ma trận dưới đây đối chiếu với bằng chứng của P11; tài liệu P1 được giữ để truy vết thiết kế ban đầu. [3,4]

| ID | Yêu cầu | Bằng chứng và phần còn thiếu |
| --- | --- | --- |
| FR01–02 | Ảnh và overlay bbox | Fixture resize; đường model thật với media synthetic |
| FR03 | Video local, pause/seek | Unit, E2E và regression race P11 |
| FR04 | Webcam chủ động, cleanup | Fixture permission/track; camera thật chưa đo |
| FR05 | Không backlog, bỏ response cũ | Sampler tests và browser delayed response |
| FR06 | Lỗi, loading, empty, retry | Unit/E2E và native 503 smoke |
| FR07 | Count, FPS và latency | Benchmark 60 giây; không phải số người duy nhất |
| FR08 | Model/schema/timing | Adapter và contract thật; UI không thay thế readiness probe |

## 2.3 Yêu cầu phi chức năng

| ID | Yêu cầu | Kiểm chứng và giới hạn |
| --- | --- | --- |
| NFR01 | Không lưu lịch sử media; ghi rõ nguồn/quyền dùng | Kiến trúc stateless; quyền từng ảnh chưa xác minh |
| NFR02 | Giới hạn payload, decode, bbox hữu hạn và CORS | Adapter/client tests; MIME khai báo chưa đối chiếu hoàn toàn định dạng decode |
| NFR03 | Warm p95 ≤ 1 s, cold ready ≤ 30 s, lỗi ≤ 1% | P11 đạt trên workload local synthetic |
| NFR04 | Control có nhãn và thông báo lỗi bằng chữ | Unit/browser fixtures; chưa audit độc lập |
| NFR05 | Split, seed, config và checksum tái lập | Hash/technical audit đạt; scene independence chưa chốt |
| NFR06 | CI, readiness và hướng dẫn cài đặt | CI đạt; setup máy sạch chưa nghiệm thu |
| NFR07 | Webcam trong secure context và demo dự phòng | Localhost/synthetic; HTTPS công khai và camera thật chưa kiểm chứng |

Mỗi yêu cầu được đối chiếu với bằng chứng phù hợp trong bảng. Khi kiểm thử mới bao phủ một phần, nhóm vẫn ghi rõ phần còn thiếu và giữ trạng thái chưa hoàn tất.

## 2.4 UC01 Phân tích ảnh

Mục đích: xem trạng thái khẩu trang trong một ảnh được phép sử dụng. Tiền điều kiện: trang đã mở; dịch vụ/model sẵn sàng để nhận kết quả thật. Trigger: người dùng chọn/thay ảnh. Đầu vào: JPEG/PNG/WebP ≤ 10 MiB. Đầu ra: preview, detections hoặc trạng thái lỗi.

| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Người dùng chọn ảnh; browser kiểm tra loại/kích thước, hủy request ảnh trước. |
| 2 | Hệ thống preview ảnh, reset kết quả cũ và thông báo đang phân tích. |
| 3 | Gửi multipart `image`; API kiểm tra dung lượng, decode và readiness. |
| 4 | Model xử lý; API trả bbox theo ảnh gốc, nhãn, confidence, version và timing. |
| 5 | Client validate response, kiểm tra còn đúng nguồn/request, scale bbox để vẽ. |
| 6 | Người dùng xem danh sách/overlay; có thể thay ảnh hoặc retry khi lỗi tạm thời. |

Ngoại lệ: loại/dung lượng sai → không gọi API; ảnh hỏng → 422; model chưa sẵn sàng → 503; mạng/timeout → giữ preview, báo lỗi và cho retry; response sai → không vẽ. Đổi ảnh trong lúc chờ → abort/loại response cũ. Không phát hiện mặt từ model thật là kết quả hợp lệ, tách biệt model lỗi hoặc stub.

Hậu điều kiện: kết quả gắn với ảnh hiện tại, không lưu media; object URL cũ được thu hồi khi thay ảnh/rời trang. Issue #11–#14; FR01/02/06/08.

 ## 2.5 UC02 Phân tích video

Mục đích: xem detection của các frame được xử lý trong video local. Tiền điều kiện: trình duyệt hỗ trợ codec của file; model sẵn sàng. Trigger: chọn video và phát. File ở browser, server chỉ nhận frame ảnh. Đầu ra: preview, frame đã phân tích kèm overlay, thống kê và lỗi nếu có.

| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Chọn video; đọc metadata, tạo preview local; lỗi codec/file phải thông báo. |
| 2 | Khi phát, sampler chỉ capture khi không có request đang chạy. |
| 3 | Capture frame từ nguồn hiện tại và ghi nhận snapshot cùng thời điểm video. |
| 4 | Gửi frame qua detect API, chờ xong trước khi xét frame kế tiếp; không queue. |
| 5 | Chỉ nhận kết quả còn đúng session; hiển thị frame đã phân tích cùng overlay. |
| 6 | Cập nhật thống kê của frame và processed FPS/latency; lặp khi còn phát. |
| 7 | Pause/seek/end/đổi mode/file: dừng lịch, vô hiệu hóa kết quả cũ, cleanup. |

Không vẽ bbox của frame cũ như thể đúng trên frame live mới: dùng vùng kết quả là snapshot đã phân tích, tách khỏi video preview đang chạy và ghi timestamp của nó. FPS xử lý không phải FPS video. Không cộng detection thành tổng người duy nhất.

Ngoại lệ: API chậm → bỏ lượt capture khi bận, không backlog; timeout/lỗi → dừng sampling và báo lỗi, người dùng chủ động thử lại; seek/pause → hủy/vô hiệu hóa request, không bắt đầu vòng mới trước khi request cũ kết thúc; video không đọc được → không gửi.

Hậu điều kiện: không còn timer/request hữu hiệu của nguồn cũ; thu hồi object URL khi thay file/unmount. Issue #15/#17/#18; FR02/03/05/06/07/08.

 ## 2.6 UC03 Phân tích webcam

Mục đích: xem detection theo frame từ camera do người dùng chủ động bật. Tiền điều kiện: HTTPS hoặc localhost, camera có thể truy cập, browser hỗ trợ `getUserMedia`; model sẵn sàng. Trigger: nhấn bật camera. Không mở camera chỉ vì tải trang.

| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Người dùng bật camera; browser xin quyền, UI thông báo đang chờ. |
| 2 | Nếu được cấp quyền, gắn MediaStream và phát preview. |
| 3 | Dùng cùng sampler và cách hiển thị snapshot đã phân tích của UC02. |
| 4 | Hiển thị detections, số lượng theo lớp ở frame hiện tại, FPS xử lý và latency. |
| 5 | Người dùng dừng/đổi mode hoặc rời trang: stop mọi track, timer và request. |

Ngoại lệ: từ chối quyền/không camera/camera bận → thông báo riêng, không vòng retry vô hạn; track kết thúc → dừng sampling và báo ngắt; yêu cầu quyền trả về sau khi người dùng đã rời mode → stop ngay stream đến muộn. API lỗi giống UC02; thao tác dừng phải luôn dùng được ngay cả khi request pending.

Hậu điều kiện: đèn camera tắt, không còn stream hoạt động và không vẽ response cũ. Issue #16–#18; FR02/04/05/06/07/08.

## 2.7 Kết luận chương 2

Ba use case dùng chung detect API, có ngoại lệ/cancel/cleanup riêng. Fixture kiểm tra logic; model, camera và môi trường đích cần evidence phù hợp.

# CHƯƠNG 3 MÔ HÌNH HÓA DỮ LIỆU

## 3.1 Nguồn dữ liệu annotation và quyền sử dụng

Nguồn dữ liệu là Face Mask Detection của uploader andrewmvd/Larxel trên Kaggle, version 1. Bản gốc có 853 PNG và 853 Pascal VOC XML, tổng 4.072 bbox. Uploader công bố Public Domain/CC0; audit đã tìm lại trang MakeML lưu trữ có dẫn dữ liệu. Tuy nhiên, metadata không cung cấp mapping tác giả hoặc consent từng ảnh; một số hình có watermark stock. Không coi license metadata của uploader là xác minh quyền mọi ảnh. [1]

| Phiên bản | Ảnh | Bbox | Vai trò |
| --- | --- | --- | --- |
| Gốc v1 | 853 | 4.072 | Nguồn giữ nguyên để truy vết |
| Curated v1 | 843 | 3.970 | Thí nghiệm nội bộ đã được cho phép |
| Train | 670 | 3.045 | Học tham số |
| Validation | 98 | 565 | Chọn ngưỡng |
| Test | 75 | 360 | Đo sau khi khóa quyết định |

Ngày 17/10, nhóm được phép thực hiện thí nghiệm nội bộ trên bộ dữ liệu hiện tại với các giới hạn đã biết. Phạm vi này chưa bao gồm phát hành ảnh, trọng số hoặc triển khai checkpoint. Dù baseline đã huấn luyện và có kết quả đo, các cờ `p3_ready=false` và `scene_leakage_verified=false` vẫn được giữ vì quyền dữ liệu và tính độc lập giữa các cảnh chưa được xác minh đầy đủ. [1,2]

Ở bản curated v1, nhóm sửa 12 bbox trong 11 tệp XML để tọa độ nằm trong mép ảnh, đồng thời loại cả 10 ảnh thuộc 5 cặp trùng lặp có nhãn chú thích xung đột. Bản dữ liệu gốc và nội dung byte của những ảnh được giữ lại không thay đổi. Với các cặp xung đột, nhóm không tự chọn một bộ chú thích khi chưa có căn cứ xác định bản đúng. [1]

## 3.2 Chia tập và khả năng tái lập

Manifest của bản curated ghi cố định seed 42, mã hash của ảnh, XML và pixel, cùng tập dữ liệu, nhóm và chú thích tương ứng. Tệp CSV rà soát đã gom 281/843 ảnh vào 38 nhóm; 562 ảnh còn chưa xác định được nhóm. Việc gom nhóm dựa trên pixel trùng khớp, dHash và rà soát cảnh hoặc nguồn; các ảnh cùng nhóm không bị chia sang những tập khác nhau. Hai lần kiểm tra tạo ra manifest giống từng byte. Tuy vậy, phương pháp này chưa chứng minh đầy đủ rằng các cảnh giữa các tập là độc lập. [1]

| Split | with_mask | without_mask | mask_worn_incorrectly |
| --- | --- | --- | --- |
| Train | 2.358 | 594 | 93 |
| Validation | 479 | 72 | 14 |
| Test | 299 | 49 | 12 |
| Tổng | 3.136 | 715 | 119 |

Manifest SHA-256: `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3`.

## 3.3 Dữ liệu trao đổi và contract API

Endpoint `POST /api/v1/detect` nhận multipart field `image`. `schema_version` giữ giá trị `1.0`; response có `image`, `model`, `detections` và `timing_ms`. Video/webcam không thêm endpoint mới, không gửi file video nguyên vẹn. Schema và client validation bảo vệ ranh giới giữa API và giao diện. [5]

| Trường | Dữ liệu | Quy tắc cần giữ |
| --- | --- | --- |
| image | width, height | Kích thước gốc đã decode |
| model | name, version | Version là checksum checkpoint |
| detections | class_id, label, confidence, bbox | Nhãn đúng class map; confidence hữu hạn [0,1] |
| bbox | x1, y1, x2, y2 | Diện tích dương, nằm trong ảnh |
| timing_ms | preprocess, inference, postprocess | Timing thật trong adapter |

| Mã HTTP | Ý nghĩa | Hành vi giao diện cần phân biệt |
| --- | --- | --- |
| 413 | Payload quá lớn | Báo giới hạn và cho chọn lại |
| 415 | MIME khai báo không hỗ trợ | Báo loại file không hợp lệ |
| 422 | Không decode được ảnh | Báo file lỗi |
| 503 | Model chưa sẵn sàng | Báo lỗi readiness, không coi là không có mặt |
| 500 | Lỗi suy luận | Báo lỗi xử lý, không hiển thị kết quả giả |

## 3.4 Mô hình dữ liệu xử lý trong bộ nhớ

| Cấu trúc | Thành phần chính | Quan hệ và vòng đời |
| --- | --- | --- |
| DetectionResponse | schema_version, image, model, detections, timing_ms | Một response cho một ảnh/frame |
| Detection | class_id, label, confidence, bbox | Nhiều detection trong một response |
| BoundingBox | x1, y1, x2, y2 | Tọa độ pixel ảnh gốc, diện tích dương |
| FrameSnapshot | Ảnh frame, result và thời điểm media | Gắn kết quả với frame đã gửi |
| FrameStatistics | processed, skipped, fps, latencyMs | Thống kê trong vòng lấy mẫu |
| Checkpoint | config, metadata, model tensors và checksum | Nạp khi process inference khởi động |

Các cấu trúc trên mô tả dữ liệu trao đổi và trạng thái trong bộ nhớ. Hệ thống không có cơ sở dữ liệu, bước chuyển đổi lược đồ (migration) hay ERD, vì vậy không cần cài MySQL. Ảnh được giải mã tạm thời để xử lý và không lưu thành lịch sử. Các bảng trong phần này chỉ giải thích cấu trúc đang dùng, không bổ sung API công khai hoặc kiểu dữ liệu mới. [5]

## 3.5 Biểu đồ trình tự và quản lý dữ liệu frame

Luồng ảnh bắt đầu khi người dùng chọn file. Browser kiểm loại và kích thước, tạo preview rồi gửi multipart. Khi response hợp lệ trở về, giao diện gắn bbox vào ảnh đúng nguồn; nếu người dùng đổi ảnh trước đó thì kết quả cũ mất hiệu lực. Nút retry phục vụ lỗi có thể thử lại, còn lỗi loại file yêu cầu chọn đầu vào phù hợp. Các trạng thái loading, lỗi và empty có thông điệp riêng. [4,5]

{{sequence}}

Hình 3.2 Trình tự một frame và nhánh loại response cũ. Sơ đồ mô tả thuật toán đang dùng trong sampler và workspace, không biểu diễn một kết nối streaming liên tục.

## 3.6 Kết luận chương 3

Dataset, checkpoint và payload tạm có vòng đời khác nhau. Hash định danh artifact, không xác minh quyền ảnh hoặc scene independence.

# CHƯƠNG 4 PHÁT TRIỂN HỆ THỐNG

## 4.1 Kiến trúc các thành phần

Browser đảm nhận đọc file local, cấp quyền webcam, capture frame, kiểm tra response và render snapshot. Next.js phục vụ ứng dụng web; browser gọi trực tiếp API theo URL cấu hình lúc build. Không có database, hàng đợi media hoặc dịch vụ nhận dạng danh tính. Phần suy luận nằm trong process FastAPI và nạp checkpoint một lần theo vòng đời dịch vụ. [5]

{{architecture}}

Hình 3.1 Kiến trúc local được đối chiếu từ source P11. HTTP localhost là môi trường đã kiểm chứng; HTTPS công khai còn là mục tiêu. Mũi tên biểu diễn dữ liệu, không khẳng định có reverse proxy hoặc dịch vụ lưu trữ.

## 4.2 Cơ sở detector và biểu diễn kết quả

Object detection đồng thời dự đoán loại đối tượng và vùng bao trên ảnh. SSD dùng các hộp tham chiếu ở nhiều tỉ lệ để dự đoán điểm lớp và hiệu chỉnh vị trí trong một mạng. Đồ án dùng biến thể SSDLite có sẵn trong TorchVision thay vì triển khai lại thuật toán detector. Không dùng số FPS hoặc mAP công bố của mô hình gốc để thay kết quả đo của checkpoint đồ án. [6]

| Thành phần | Ý nghĩa trong đồ án |
| --- | --- |
| Vị trí | Bbox xyxy của ảnh gốc, không phải pixel CSS |
| Nhãn | Một trong ba lớp khẩu trang |
| Confidence | Điểm model chưa được calibration ngoài thực tế |
| Model version | SHA-256 checkpoint đã nạp |
| Timing | Preprocess, inference, postprocess phía adapter |

## 4.3 Huấn luyện baseline và adapter suy luận

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

Checkpoint SHA-256: `1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.

Bộ tích hợp suy luận tính hash và giải tuần tự từ cùng nội dung byte của checkpoint, sau đó kiểm tra cấu hình, ánh xạ lớp và tính hữu hạn của tensor. Trọng số được nạp ở chế độ strict. Ảnh RGB được chuyển sang số thực trong khoảng [0,1]; suy luận chạy bằng inference_mode trên CPU hai luồng. Trước khi trả kết quả, bộ tích hợp kiểm tra bbox, điểm số và lớp, đồng thời đo thời gian xử lý thực tế. Nếu nạp mô hình thất bại, ready/detect trả 503 thay vì trả danh sách rỗng làm người dùng hiểu là không phát hiện đối tượng. [5]

## 4.4 Giao diện ảnh và tích hợp API

Ba khu vực ảnh, video và webcam dùng lại các thành phần xem trước, kết quả, thông báo và thống kê. ImagePreview đặt lớp vẽ kết quả theo kích thước ảnh hiển thị; captureFrame trích ảnh từ phần tử media để gửi đến API. Bộ lấy mẫu dùng chung quản lý trạng thái bận, phiên xử lý, chu kỳ lấy mẫu và hủy yêu cầu. Việc xin quyền camera vẫn nằm riêng trong luồng webcam, còn luồng video chỉ đọc tệp trên máy. [5]

{{image}}

Hình 4.1 Luồng ảnh với media synthetic không khuôn mặt và response fixture minh họa bbox. Ba nhãn trên hình là dữ liệu kiểm thử, không chứng minh khả năng nhận diện của checkpoint.

## 4.5 Giao diện webcam và khả năng tiếp cận

Webcam chỉ gọi `getUserMedia` khi người dùng bấm bắt đầu. Trình duyệt yêu cầu hình ảnh và không thu âm. Các track camera được dừng khi người dùng dừng, đổi chế độ, rời thành phần giao diện hoặc khi yêu cầu khởi động đã hết hiệu lực. Phản hồi đến sau khi phiên camera kết thúc bị bỏ qua. VideoWorkspace và WebcamWorkspace dùng chung bộ lấy mẫu, còn việc mở và giải phóng nguồn được quản lý riêng. [5]

{{webcam}}

Hình 3.3 Giao diện webcam với media không khuôn mặt và response fixture do P12 tạo để minh họa overlay. Đây là ảnh chụp giao diện, không phải kết quả model hoặc thử camera vật lý.

## 4.6 Giao diện video và sử dụng chung sampler

{{video}}

Hình Giao diện frame video đã phân tích. Media không khuôn mặt và response fixture; ảnh phục vụ minh họa UI, tách khỏi benchmark checkpoint thật.

VideoWorkspace và WebcamWorkspace cùng xét lấy mẫu mỗi 200 ms. Nếu tác vụ trước chưa kết thúc, lượt lấy mẫu mới được bỏ qua. Khi tạm dừng, tua, dừng hoặc đổi nguồn, mã phiên xử lý được tăng để phản hồi muộn không ghi đè kết quả hiện tại. Ảnh chụp khung hình và object URL được giải phóng khi không còn sử dụng. [3,5]

## 4.7 Kết luận chương 4

API thật kiểm checkpoint; ba workspace dùng chung contract/sampler. Ở snapshot PR #49 (chưa merge), confidence dưới 0,15 được giữ nguyên nhãn và điểm số, đồng thời đánh dấu “Chưa chắc chắn” và đếm riêng. Mốc 0,15 là ngưỡng trình bày; API vẫn nhận score từ 0,001 và không thêm lớp hay trường trạng thái vào contract. Đúng 0,15 được xem là đạt ngưỡng; so sánh trước khi làm tròn. [10]

# CHƯƠNG 5 TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG

## 5.1 Môi trường và hướng dẫn triển khai local

Môi trường được kiểm chứng là Windows 11, CPU i5-13500H, khoảng 16,8 GB RAM, Python 3.12.14, Node 24.19.0 và Chromium 156.0.8078.4. Inference dùng Torch 2.9.0+cpu/TorchVision 0.24.0+cpu, hai CPU threads. Đây là cấu hình đã chạy, không phải minimum hardware đã benchmark trên nhiều máy. CI dùng Node 22. [3]

## 5.2 Kiểm thử phần mềm và CI

Nhóm kiểm tra phần mềm bằng kiểm thử đơn vị và định dạng dữ liệu, fixture trên trình duyệt, kiểm tra khởi động native và đo hiệu năng với mô hình thật. Fixture giúp tạo có chủ đích các tình huống lỗi hoặc phản hồi muộn. Những lần chạy checkpoint thật dùng để kiểm tra bộ tích hợp suy luận trên tải thử cụ thể. Kết quả fixture không được dùng để kết luận độ chính xác của mô hình hay khả năng hoạt động của camera vật lý. [3]

| Suite P11 | Kết quả | Phạm vi |
| --- | --- | --- |
| Frontend unit | 81 tests, 6 files | UI, client, sampler và race video |
| Backend | 24 tests | API/loader/contract, weights synthetic |
| ML | 37 tests | Chuẩn bị dữ liệu, evaluator, trainer self-check |
| Benchmark unit | 3 tests | Percentile, readiness, denominator/memory |
| Browser fixture | 4 tests | Chromium desktop/mobile, ba luồng |
| Native no-model smoke | 1 test | Web/health 200, ready/detect 503 và CORS |

## 5.3 Phương pháp đánh giá chất lượng

IoU được tính bằng diện tích giao của hai bbox chia diện tích hợp. Ở ngưỡng vận hành P4, prediction được xét theo confidence giảm dần và ghép một đối một với ground truth cùng lớp chưa ghép có IoU cao nhất, nếu IoU ít nhất 0,5. Một prediction ghép đúng là TP; prediction dư là FP; ground truth không được ghép là FN. Cách ghép này cần cố định trước khi so sánh các run. [2]

Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = 2PR/(P+R). Macro lấy trung bình các lớp với trọng số bằng nhau. Điều này giúp lớp ít mẫu vẫn ảnh hưởng đến chỉ số tổng hợp; macro F1 không đồng nhất với F1 tính từ tổng TP/FP/FN của mọi lớp. Báo cáo giữ cả chỉ số theo lớp và macro để tránh lớp đông mẫu che khuất hai lớp còn lại.

| Số đo | Điều kiện cần ghi kèm | Giới hạn |
| --- | --- | --- |
| PR và F1 | Ngưỡng confidence, IoU, phép ghép | Thay ngưỡng có thể đổi mạnh kết quả |
| Macro | Danh sách lớp được trung bình | Không biểu diễn số người thực tế |
| AP50 | Đường PR và IoU 0,5 | Dễ đạt hơn yêu cầu vị trí chặt |
| mAP50:95 | IoU 0,50–0,95 và nội suy | Evaluator nội bộ chưa gồm area/crowd rules |

AP nội suy 101 điểm recall; AP50 dùng IoU 0,5, mAP50:95 trung bình IoU 0,50–0,95 bước 0,05 và các lớp. AP tính trước ngưỡng vận hành 0,15. Evaluator nội bộ chưa gồm area/crowd rules và không tương đương hoàn toàn official COCO evaluator. Chưa có khoảng tin cậy hoặc domain-shift test. [2]

## 5.4 Kết quả đánh giá mô hình

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

Theo phép đo ghép cùng lớp, mô hình chỉ phát hiện đúng 2/49 bbox `without_mask` và 1/12 bbox `mask_worn_incorrectly`. Phần lớn đối tượng của hai lớp này bị bỏ sót. Đây là hạn chế chính của baseline, được thể hiện rõ hơn ở bảng theo lớp so với chỉ số trung bình. Dù thời gian xử lý thấp, kết quả nhận diện hiện chưa đủ tin cậy để dùng cho cảnh báo.

| Lớp | AP50 | mAP50:95 |
| --- | --- | --- |
| with_mask | 0,4251 | 0,2034 |
| without_mask | 0,0190 | 0,0086 |
| mask_worn_incorrectly | 0,0936 | 0,0340 |

API vẫn dùng score floor 0,001 và trả confidence; UI dùng mốc 0,15 để đánh dấu, không loại detection thấp. [10] Do đó ảnh giao diện hoặc số detection API không thể đọc trực tiếp như kết quả PR/F1 tại ngưỡng vận hành. Muốn so sánh cần dùng đúng hậu xử lý và định nghĩa phép đo, đồng thời không tuning dựa trên test đã mở. [2,5]

## 5.5 Phân tích lỗi và hồi quy video

Ma trận nhầm lẫn dưới đây có hàng là nhãn thực tế, cột là nhãn dự đoán; background biểu diễn đối tượng không ghép được. Để phân tích lỗi, phép ghép trong ma trận chỉ yêu cầu IoU ít nhất 0,5 và không xét lớp. Cách ghép này khác bảng PR/F1, nơi nhãn phải cùng lớp, nên tổng đường chéo của ma trận có thể khác số TP trong bảng đó. [2]

| Truth / Prediction | Background | Có khẩu trang | Không khẩu trang | Đeo sai |
| --- | --- | --- | --- | --- |
| Background | 0 | 181 | 13 | 6 |
| Có khẩu trang | 159 | 140 | 0 | 0 |
| Không khẩu trang | 47 | 1 | 0 | 1 |
| Đeo sai | 9 | 2 | 1 | 0 |

Phân tích trên tập test ghi nhận 215 đối tượng thực bị bỏ sót, 5 trường hợp nhầm lớp, 94 dự đoán sai vị trí và 106 dự đoán dư. Các nhóm này có thể chồng lấn nên không cộng thành tổng số lỗi độc lập. Nhóm chưa rà soát đủ ảnh để kết luận lỗi do ánh sáng hay góc mặt. [2]

Regression P11: run 1 video dừng counter ở 40 frame dù báo complete. Guard 5 giây không có display mới giúp run 2 phát hiện race media unready trước seeking. Fix dừng generation/giải phóng snapshot và chờ playing/seeked; test fail trước sửa rồi pass. Run 3 stream trên 60 giây đạt; fault injection pause làm guard fail như mong đợi. Giữ raw failed runs riêng. [3]

## 5.6 Phương pháp đo hiệu năng

Ứng dụng dùng HTTP multipart cho ảnh và từng frame video/webcam. Browser giữ nguồn media và quyết định khi nào capture; server chỉ xử lý ảnh độc lập. Cách này tái sử dụng cùng endpoint, giảm trạng thái server và phù hợp demo CPU. Đồ án chưa có phép so sánh thực nghiệm với WebSocket hoặc giao thức streaming khác nên không tuyên bố HTTP tối ưu cho mọi tải. [4,5]

| Lựa chọn | Lý do trong đồ án | Điều chưa kết luận |
| --- | --- | --- |
| HTTP từng frame | Dùng chung contract và trạng thái đơn giản | Chưa so sánh streaming quy mô lớn |
| Một tác vụ đang chờ | Giới hạn backlog và kết quả lỗi thời | Không đảm bảo hủy computation server |
| Snapshot đã phân tích | Overlay gắn đúng frame được gửi | Không phải overlay đồng bộ frame live |
| CPU hai luồng | Môi trường baseline có thể mô tả rõ | Chưa đại diện mọi máy người dùng |

## 5.7 Kết quả hiệu năng local

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

## 5.8 Đối chiếu nghiệm thu và hạn chế

Trong thử nghiệm local, ba luồng ảnh, video và webcam đã kết nối đến bộ tích hợp suy luận thật với media tổng hợp. Kiểm thử tự động bao phủ xử lý lỗi, lớp vẽ kết quả và vòng đời tác vụ; baseline cũng đã được đánh giá trên tập test sau khi khóa ngưỡng. Chất lượng mô hình và điều kiện sử dụng dữ liệu vẫn chưa đáp ứng việc triển khai công khai. Bảng dưới đây tổng hợp kết quả và phần còn thiếu của từng hạng mục. [1–4]

| Hạng mục | Kết luận có căn cứ | Phần cần làm tiếp |
| --- | --- | --- |
| Ba luồng web | Fixture và model local synthetic có evidence | Camera vật lý, browser khác |
| Model | Test macro F1 0,2061, minority recall thấp | Dữ liệu và baseline tốt hơn theo quy trình mới |
| Dữ liệu | Audit kỹ thuật curated đạt | Quyền từng ảnh, scene independence |
| Hiệu năng | Budget local đạt trên workload synthetic | Tải đại diện và môi trường đích |
| Container | CI no-model Compose đạt | Local runtime/checkpoint và setup độc lập |
| Hosted preview | Chưa kiểm chứng | HTTPS, camera, rollback |
| Tài liệu P12 | Bộ đồng bộ để review, có nguồn | Thông tin nhóm và review bản mới/slide |

## 5.9 Kết luận chương 5

Kiểm thử phần mềm và latency local không khắc phục minority recall thấp. Gate đóng; quyền ảnh, setup độc lập, camera và HTTPS chưa đủ nghiệm thu.

# KẾT LUẬN

Đồ án đã xây dựng được ứng dụng web có ba đầu vào dùng chung contract ảnh, adapter SSDLite thật, kiểm tra checkpoint và các cơ chế quản lý tác vụ bất đồng bộ. Các lớp giao diện, API và ML có kiểm thử riêng; benchmark với checkpoint thật đã phát hiện một race video mà test fixture trước đó chưa bộc lộ. Việc tái hiện, sửa và kiểm chứng lại cho thấy cần kết hợp kiểm thử có kiểm soát với chạy stream dài. [3,5]

Kết quả chất lượng là hạn chế lớn nhất của baseline. Test macro F1 0,2061 và mAP50:95 0,0820 đi cùng recall rất thấp ở hai lớp ít mẫu. Đây là kết quả lịch sử của checkpoint và split P4, không phải đánh giá lại sau thay đổi UI. Do đó ứng dụng hiện chỉ phù hợp trình diễn kỹ thuật nội bộ trong phạm vi được cho phép. Không có cơ sở đưa vào cảnh báo tự động hoặc quyết định về con người. Confidence chưa được calibration; nhãn “Chưa chắc chắn” chỉ hỗ trợ trình bày, không khẳng định xác suất đúng. [2,10]

# TÀI LIỆU THAM KHẢO

[1] Nhóm đồ án. Dataset Card và curated audit. Snapshot P11, 20/10/2026. Repo: https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/dataset-card.md. Nguồn audit lịch sử; quyền từng ảnh chưa xác minh.

[2] Nhóm đồ án. Model Card và P4 evaluation report. https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/model-card.md. Report JSON và quyết định validation được định danh trong danh mục evidence P12.

[3] Nhóm đồ án. P11 regression report và PR #39. https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/regression-report.md. https://github.com/anhpd-glinteco/face-mask-detection/pull/39. CI snapshot được ghi ngày 20/10/2026.

[4] Nhóm đồ án. Kế hoạch, yêu cầu và use cases. https://github.com/anhpd-glinteco/face-mask-detection/tree/88687c9/docs/report. Tài liệu P1 là thiết kế mục tiêu; báo cáo này đối chiếu thêm triển khai P11.

[5] Nhóm đồ án. Source web, inference và HTTP frame sampling ADR. https://github.com/anhpd-glinteco/face-mask-detection/tree/88687c9. Các mô tả hành vi được đối chiếu source, không phải cam kết môi trường chưa thử.

[6] Liu, W. và cộng sự. SSD Single Shot MultiBox Detector. ECCV 2016, arXiv:1512.02325. https://arxiv.org/abs/1512.02325. Truy cập 20/10/2026. Dùng làm cơ sở detection, không trích metric bài báo thành metric đồ án.

[7] TorchVision. ssdlite320_mobilenet_v3_large. https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.detection.ssdlite320_mobilenet_v3_large.html. Truy cập 20/10/2026. Trang stable hiện là bản 0.29; thực nghiệm đồ án dùng 0.24.0, cấu hình trong repo là nguồn cho tham số đã chạy.

[8] Howard, A. và cộng sự. Searching for MobileNetV3. ICCV 2019, arXiv:1905.02244. https://arxiv.org/abs/1905.02244. Truy cập 20/10/2026. Cơ sở backbone, chưa có so sánh hiệu năng backbone trong đồ án.

[9] MDN Web Docs. MediaDevices getUserMedia. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia. Truy cập 20/10/2026. Tham khảo quyền camera và secure context.

[10] Nhóm đồ án. UI uncertainty presentation, PR #49, HEAD `a341b6bdc101b09d89fddb713d1158bdf28ab32f`; CI 5/5 SUCCESS. https://github.com/anhpd-glinteco/face-mask-detection/pull/49. Snapshot 21/10/2026. Ngưỡng 0,15 áp dụng ở lớp trình bày; API floor 0,001 và schema không đổi.

[11] PlantUML. Use case Diagram syntax and features. https://plantuml.com/use-case-diagram. Truy cập 01/11/2026.

Nguồn ảnh giao diện: script capture-fixtures.mjs của P12 chạy trên snapshot PR #49 ngày 24/10/2026, media synthetic không khuôn mặt và response fixture. Nguồn sơ đồ: source P11, P12 biên tập. Không sử dụng ảnh dataset hoặc hình minh họa nhận diện người thật.

# PHỤ LỤC A TÁI LẬP VÀ DANH MỤC EVIDENCE

Tái lập bằng môi trường đã pin và checkpoint đúng checksum, output mới; không chạy benchmark đồng thời suite/build khác. Full command, --checkpoint/--sha256/--output và quy tắc cleanup ở regression report [3]. Chưa nghiệm thu setup máy sạch.

| Thư mục và môi trường | Lệnh kiểm tra |
| --- | --- |
| apps/web, Node đã cài dependencies | npm test; npm run typecheck; npm run lint; npm run test:e2e |
| services/inference, venv inference | python -m pytest tests -v |
| Repo root, venv ML | python -m unittest discover -s ml/tests -v |
| Repo root, venv inference | python -m unittest discover -s scripts/benchmark -v |
| Repo root, Docker engine hoạt động | docker compose config --quiet |

| Evidence ID | Nguồn | Điều chứng minh |
| --- | --- | --- |
| E01 | P4 validation decision/report | Chọn ngưỡng trước test |
| E02 | P4 test/report.json | PR/F1/AP và confusion test |
| E03 | P11 run 3 api-summary.json | 5 cold, 100 warm |
| E04 | P11 run 3 browser-summary.json | Counts, duration, HTTP/display FPS |
| E05 | P11 memory.json, environment.json | Môi trường và sampled memory |
| E06 | P11 release logs và PR #39 CI | Kiểm thử phần mềm lịch sử |
| E07 | P12 fixture screenshots | Minh họa giao diện, không đo model |

Để chỉnh sơ đồ use case, mở tệp `docs/report/diagrams/system.puml` bằng trình soạn thảo văn bản và sửa khối từ `@startuml use-cases` đến `@enduml`. Các từ khóa `actor`, `usecase` và `rectangle` lần lượt mô tả tác nhân, chức năng và biên hệ thống. Từ thư mục gốc dự án, chạy lệnh sau bằng Java và PlantUML JAR đã cài:

```powershell
java -Xmx256m -Djava.awt.headless=true -jar D:\Codex\downloads\face-mask-detection\tools\plantuml.jar -charset UTF-8 -tsvg docs/report/diagrams/system.puml
```

Lệnh xuất các sơ đồ trong tệp thành SVG. Sơ đồ use case nằm trong `docs/report/diagrams/use-cases.svg`; bản PNG dùng chèn báo cáo nằm trong `docs/report/p12-template/assets/usecases.png`. Khi sửa nguồn, cần xuất lại SVG và PNG trước khi tạo lại báo cáo.

# PHỤ LỤC B THÔNG TIN CẦN BỔ SUNG

Kịch bản kiểm thử trước đây dùng ảnh synthetic, video local pause/seek và webcam giả lập start/stop. Ngày 02/11/2026, nhóm bổ sung chạy camera tích hợp laptop USB2.0 HD UVC WebCam với checkpoint thật trên phiên bản PR #49. Camera trả hình 640×480, cấu hình nguồn 30 FPS, chạy liên tục 60,39 giây. Các bước từ chối rồi cấp lại quyền, dừng, bật lại và đổi chế độ đều đạt kiểm tra trạng thái track; chưa quan sát đèn camera hoặc thử ngắt thiết bị vật lý.

Lượt chạy bổ sung có 63 request webcam thành công, gồm cả thao tác bật lại sau khoảng đo liên tục. HTTP p50 là 258,96 ms, p95 là 1.390,75 ms; video smoke có p95 1.266,98 ms trên 5 request thành công. Cả hai p95 vượt mục tiêu 1.000 ms, nên kết quả nghiệm thu mới chỉ đạt một phần. Camera FPS là cấu hình nguồn, không phải FPS xử lý. Các request bị hủy khi dừng được giữ trong log, không loại khỏi hồ sơ để làm đẹp kết quả. Không có ảnh hoặc video camera được lưu; các số đo P4/P11 trong chương 5 vẫn là kết quả lịch sử, không được thay bằng lượt đo này.

Ảnh và video tổng hợp đã kiểm tra đường browser đến checkpoint thật; video có lượt chạy riêng ít nhất 60 giây, cùng kiểm tra tạm dừng, tua và phát tiếp. Hồ sơ mới được lưu tại `D:/Codex/outputs/face-mask-detection/submission-2026-11-02/verification`, gồm raw logs, acceptance-summary.json và kết quả từng lượt thất bại. P13 chưa có video demo được ghi hình; phạm vi sử dụng checkpoint vẫn là trình diễn nội bộ với giới hạn chất lượng đã nêu.

| Mục trước khi nộp | Trạng thái |
| --- | --- |
| Thông tin nhóm | MSSV và lớp đã đối chiếu ảnh danh sách ngày 02/11/2026; khóa đào tạo chưa xác nhận. Phân công được tổng hợp theo kế hoạch nhóm. |
| Mẫu trình bày | Theo file tham chiếu được cung cấp; không coi là rubric học phần đã xác nhận |
| Review độc lập | Agent đã review báo cáo theo mẫu 34 trang trên snapshot 21/10/2026; phạm vi không gồm slide hoặc nội dung cập nhật sau đó |
| Camera vật lý, HTTPS và rollback hosted | Camera laptop đã chạy 60,39 giây; chức năng/track cleanup đạt, latency vượt mục tiêu. HTTPS và rollback hosted chưa kiểm chứng. |
| Video demo và rehearsal P13 | Đã chạy thử ba luồng local; chưa ghi video demo, chưa xác nhận nghiệm thu đầy đủ. |

Giữ issue #26 mở khi thông tin bắt buộc và review còn thiếu. Không thêm chữ ký hoặc nghiệm thu của giảng viên khi chưa có xác nhận.
