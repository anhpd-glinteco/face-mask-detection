# LỜI CẢM ƠN

Nhóm xin trân trọng cảm ơn Trường Công nghệ thông tin và Truyền thông, Đại học Công nghiệp Hà Nội đã tạo môi trường học tập để nhóm thực hiện đồ án chuyên ngành Kỹ thuật phần mềm. Nhóm xin cảm ơn giảng viên hướng dẫn ThS. Vũ Thị Dương và các thầy cô đã truyền đạt kiến thức nền tảng cho quá trình phân tích, xây dựng và kiểm thử hệ thống.

Báo cáo trình bày ứng dụng web phát hiện trạng thái đeo khẩu trang từ ảnh, video local và webcam. Nhóm ghi nhận các giới hạn về chất lượng mô hình, nguồn dữ liệu và điều kiện nghiệm thu còn thiếu. Những kết quả chưa kiểm chứng được nêu rõ để người đọc đánh giá đúng phạm vi thực hiện.

Nhóm mong nhận được ý kiến góp ý về nội dung và hình thức để tiếp tục hoàn thiện đồ án. Phiên bản này chưa có review độc lập; thông tin MSSV, khóa đào tạo và đóng góp từng thành viên đang chờ xác nhận.

Nhóm 1

# TÓM TẮT

Đồ án xây dựng ứng dụng web tiếp nhận ảnh, video trên máy và webcam để hiển thị vùng phát hiện, nhãn trạng thái đeo khẩu trang và độ tin cậy. Hệ thống gồm giao diện Next.js, API FastAPI và bộ suy luận SSDLite320 MobileNetV3 Large trên CPU. Video và webcam dùng chung cơ chế lấy mẫu frame qua HTTP, với tối đa một tác vụ xử lý đang chờ hoàn tất trong mỗi sampler. Media không được lưu thành lịch sử trên server. [1–4]

Phần mềm đã có kiểm chứng tự động cho giao diện, contract, quản lý vòng đời và lỗi; P11 ghi nhận 81 frontend tests, 24 backend tests, 37 ML tests, 3 benchmark self-checks và 4 browser fixture tests. Một race khi video tạm chưa sẵn sàng đã được tái hiện bằng test thất bại trước sửa, sau đó kiểm chứng lại bằng regression và benchmark. Các số đếm này thuộc những suite riêng, không cộng thành thước đo chất lượng model. [3]

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

Người sử dụng cần quan sát các vùng mà mô hình dự đoán có khuôn mặt và trạng thái khẩu trang trong ảnh hoặc luồng hình ảnh. Nếu chỉ hiển thị một nhãn cho cả ảnh, hệ thống không biểu diễn được nhiều người hoặc các trạng thái khác nhau cùng xuất hiện. Vì vậy, đầu ra cần có bbox, nhãn và confidence cho từng detection, đồng thời giữ kích thước ảnh gốc để giao diện đặt overlay đúng vị trí. [4]

## 1.2 Mục tiêu và phạm vi áp dụng

Mục tiêu sản phẩm là hỗ trợ ba đầu vào trên cùng một contract ảnh. Ảnh được gửi trực tiếp; video và webcam chỉ gửi frame đã trích tại browser. API trả kích thước ảnh, metadata model, danh sách detections và timing; browser kiểm tra response rồi hiển thị trên snapshot đã gửi. Luồng này tránh việc server phải nhận toàn bộ file video hoặc quản lý phiên streaming. [4,5]

| Nhóm mục tiêu | Điều kiện kiểm chứng | Trạng thái tại P11 |
| --- | --- | --- |
| Ảnh | Upload, lỗi đầu vào, overlay, đổi ảnh | Fixture và đường HTTP local có evidence |
| Video | Lấy mẫu nối tiếp, pause/seek, loại kết quả cũ | Regression và benchmark synthetic đạt sau fix |
| Webcam | Start/stop, quyền, track cleanup | Browser giả lập đạt; chưa camera vật lý |
| Chất lượng | Metric ba lớp trên test đã khóa | Đã đo; chất lượng thấp |
| Hiệu năng | Cold, warm và hai stream 60 giây | Local CPU, workload synthetic |
| Công khai | HTTPS, camera thật, quyền dữ liệu | Chưa đạt, gate đóng |

## 1.3 Khảo sát và cơ sở lựa chọn giải pháp

Đồ án chưa thực hiện khảo sát người dùng bằng bảng hỏi hoặc phỏng vấn có dữ liệu lưu trữ. Vì vậy, báo cáo không sử dụng biểu đồ khảo sát hoặc tỷ lệ từ đề tài trong mẫu. Phân tích nhu cầu hiện tại dựa trên đặc tả ba luồng, các tình huống xử lý lỗi và ràng buộc tài nguyên của dự án. Đây là cơ sở thiết kế kỹ thuật, chưa thay thế nghiên cứu nhu cầu thực địa. [4]

## 1.4 Mô hình phát triển công nghệ và phân công dự kiến

Quy trình phát triển chia thành các phiên có đầu ra, PR và handoff: yêu cầu và kiến trúc; audit dữ liệu; baseline; đánh giá; adapter; ba luồng web; kiểm thử tích hợp; benchmark; regression; tài liệu. Các phiên không được đánh dấu hoàn thành chỉ vì đã đến ngày dự kiến. Issue chỉ đóng khi đủ Definition of Done và có nguồn kiểm chứng. [4]

| Vai trò dự kiến trong kế hoạch | Thành viên | Xác nhận đóng góp thực tế |
| --- | --- | --- |
| ML và inference | Nguyễn Đình Luân Kiệt, Bùi Nguyên Hải | Cần bổ sung |
| Web | Phùng Đức Anh, Bùi Ngọc Minh Hoàng | Cần bổ sung |
| Điều phối QA và triển khai | Bùi Ngọc Minh Hoàng | Cần bổ sung |
| Tài liệu và nghiệm thu | Cả nhóm | Cần bổ sung |

## 1.5 Kết luận chương 1

Phạm vi gồm một actor và ba nguồn ảnh/video/webcam, không tài khoản hoặc database. Công nghệ và phân công là cơ sở thực hiện; đóng góp cá nhân và nghiệm thu còn chờ xác nhận.

# CHƯƠNG 2 PHÂN TÍCH VÀ ĐẶC TẢ YÊU CẦU PHẦN MỀM

## 2.1 Tác nhân và biểu đồ use case

Actor nghiệp vụ duy nhất là người sử dụng trình duyệt. Browser, FastAPI và detector là thành phần thực hiện, không được đưa thành vai trò người dùng có tài khoản. Người dùng chủ động chọn media và có thể dừng hoặc đổi nguồn. Không có actor quản trị hoặc cơ sở dữ liệu MySQL như đề tài trong mẫu. [4,5]

{{usecases}}

Hình Use case của ứng dụng khẩu trang, biên tập từ sơ đồ P1. Đây là sơ đồ chức năng; các điều kiện nghiệm thu camera thật, dữ liệu và deployment được đánh giá riêng ở chương 5.

## 2.2 Yêu cầu chức năng và truy vết

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

Các yêu cầu là tiêu chí cần đối chiếu bằng evidence phù hợp. Một dòng có test không đồng nghĩa toàn bộ yêu cầu đã hoàn tất. Các mục còn thiếu được giữ mở, không thay bằng tỷ lệ tiến độ theo thời gian.

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

Ngoại lệ: loại/dung lượng sai → không gọi API; ảnh hỏng → 422; model chưa sẵn sàng
→ 503; mạng/timeout → giữ preview, báo lỗi và cho retry; response sai → không vẽ.
Đổi ảnh trong lúc chờ → abort/loại response cũ. Không phát hiện mặt từ model thật
là kết quả hợp lệ, tách biệt model lỗi hoặc stub.

Hậu điều kiện: kết quả gắn với ảnh hiện tại, không lưu media; object URL cũ được
thu hồi khi thay ảnh/rời trang. Issue #11–#14; FR01/02/06/08.


## 2.5 UC02 Phân tích video

Mục đích: xem detection của các frame được xử lý trong video local. Tiền điều kiện: trình duyệt hỗ trợ codec của file; model sẵn sàng. Trigger: chọn video và phát. File ở browser, server chỉ nhận frame ảnh. Đầu ra: preview, frame đã phân tích kèm overlay, thống kê và lỗi nếu có.

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


## 2.6 UC03 Phân tích webcam

Mục đích: xem detection theo frame từ camera do người dùng chủ động bật. Tiền điều kiện: HTTPS hoặc localhost, camera có thể truy cập, browser hỗ trợ
  `getUserMedia`; model sẵn sàng. Trigger: nhấn bật camera. Không mở camera chỉ vì tải trang.

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

Quyết định ngày 17/10 cho phép thí nghiệm nội bộ trên dữ liệu hiện tại với các giới hạn đã biết. Quyết định đó không cấp quyền phát hành media/weights hoặc triển khai checkpoint. Vì vậy, các cờ `p3_ready=false` và `scene_leakage_verified=false` vẫn được giữ, dù baseline đã train và có metric. Đây là hai loại trạng thái khác nhau: cho phép thử nghiệm có giới hạn và hoàn tất gate dữ liệu. [1,2]

Curated v1 sửa 12 bbox trong 11 XML theo mép ảnh, loại cả 10 ảnh của 5 cặp duplicate có annotation xung đột. Giữ nguyên bản gốc và byte ảnh retained; không chọn annotation khi thiếu căn cứ chuẩn. [1]

## 3.2 Chia tập và khả năng tái lập

Manifest curated cố định seed 42, hash ảnh/XML/pixel, split, group và annotation. CSV review gom 281/843 ảnh vào 38 nhóm; 562 ảnh còn unresolved. Nhóm dựa trên exact pixel, dHash và review scene/source, không cắt qua split. Hai lần audit cho manifest giống từng byte; heuristic chưa chứng minh scene independence tuyệt đối. [1]

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

Đây là mô hình dữ liệu trao đổi và trạng thái trong bộ nhớ, không phải các bảng lưu trữ. Hệ thống hiện không có database hoặc migration; không có ERD và không cần bước cài MySQL. Media được decode tạm để xử lý, không được lưu thành lịch sử. Các bảng mô tả ở đây không tạo thêm public API hoặc type mới. [5]

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

Adapter hash và deserialize cùng bytes checkpoint, kiểm config/class map, tensor hữu hạn và load strict. RGB được đổi thành float [0,1]; inference_mode chạy CPU hai luồng. Output kiểm bbox/score/class hợp lệ, đo timing thật. Load lỗi thì ready/detect 503; không fallback rỗng giả. [5]

## 4.4 Giao diện ảnh và tích hợp API

Giao diện có ba workspace dùng lại preview, kết quả, thông báo và thống kê. ImagePreview ghép overlay với kích thước ảnh hiển thị; captureFrame chuyển media element thành ảnh gửi đi; shared sampler quản lý busy, generation, interval và abort. Cấu trúc này tái sử dụng hành vi cần dùng chung mà vẫn tách quyền truy cập camera khỏi file video local. [5]

{{image}}

Hình 4.1 Luồng ảnh với media synthetic không khuôn mặt và response fixture minh họa bbox. Hai nhãn trên hình là dữ liệu kiểm thử, không chứng minh khả năng nhận diện của checkpoint.

## 4.5 Giao diện webcam và khả năng tiếp cận

Webcam chỉ gọi `getUserMedia` sau thao tác bắt đầu. Browser yêu cầu video, không yêu cầu audio; track cần được stop khi người dùng dừng, đổi tab, unmount hoặc khi yêu cầu khởi động cũ không còn phù hợp. Response đến muộn phải bị bỏ nếu phiên camera đã kết thúc. VideoWorkspace và WebcamWorkspace dùng chung sampler nhưng giữ vòng đời nguồn riêng. [5]

{{webcam}}

Hình 3.3 Giao diện webcam với media không khuôn mặt và response fixture do P12 tạo để minh họa overlay. Đây là ảnh chụp giao diện, không phải kết quả model hoặc thử camera vật lý.

## 4.6 Giao diện video và sử dụng chung sampler

{{video}}

Hình Giao diện frame video đã phân tích. Media không khuôn mặt và response fixture; ảnh phục vụ minh họa UI, tách khỏi benchmark checkpoint thật.

VideoWorkspace và WebcamWorkspace dùng chung sampler với cơ hội lấy mẫu mỗi 200 ms. Chỉ một tác vụ đang chờ settle; các cơ hội đến khi bận bị bỏ qua. Pause, seek, stop hoặc đổi nguồn tăng generation để response muộn không ghi đè kết quả hiện tại. Snapshot và object URL không còn dùng được giải phóng. [3,5]

## 4.7 Kết luận chương 4

API thật kiểm checkpoint; ba workspace dùng chung contract/sampler. Ngưỡng 0,15 và uncertain chưa được áp dụng vào UI/API.

# CHƯƠNG 5 TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG

## 5.1 Môi trường và hướng dẫn triển khai local

Môi trường được kiểm chứng là Windows 11, CPU i5-13500H, khoảng 16,8 GB RAM, Python 3.12.14, Node 24.19.0 và Chromium 156.0.8078.4. Inference dùng Torch 2.9.0+cpu/TorchVision 0.24.0+cpu, hai CPU threads. Đây là cấu hình đã chạy, không phải minimum hardware đã benchmark trên nhiều máy. CI dùng Node 22. [3]

## 5.2 Kiểm thử phần mềm và CI

Kiểm chứng gồm unit/contract tests, browser fixtures, smoke native và benchmark với model thật. Mỗi tầng trả lời một câu hỏi riêng. Fixture cho phép chủ động tạo lỗi và response muộn; model thật kiểm tra adapter/checkpoint trên workload cụ thể. Không dùng fixture làm bằng chứng độ chính xác model hoặc camera vật lý. [3]

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

Chỉ có 2/49 bbox `without_mask` và 1/12 bbox `mask_worn_incorrectly` ghép đúng theo phép đo cùng lớp. Hệ thống bỏ sót phần lớn đối tượng của hai lớp này. Vì vậy, latency thấp không đủ để hỗ trợ cảnh báo đáng tin cậy. Dùng một chỉ số trung bình mà bỏ bảng theo lớp sẽ che khuất giới hạn quan trọng nhất của baseline.

| Lớp | AP50 | mAP50:95 |
| --- | --- | --- |
| with_mask | 0,4251 | 0,2034 |
| without_mask | 0,0190 | 0,0086 |
| mask_worn_incorrectly | 0,0936 | 0,0340 |

API/UI hiện không áp ngưỡng 0,15; API dùng score floor 0,001 và trả confidence. Do đó ảnh giao diện hoặc số detection API không thể đọc trực tiếp như kết quả PR/F1 tại ngưỡng vận hành. Muốn so sánh cần dùng đúng hậu xử lý và định nghĩa phép đo, đồng thời không tuning dựa trên test đã mở. [2,5]

## 5.5 Phân tích lỗi và hồi quy video

Confusion matrix dưới đây có hàng là truth, cột là prediction; background biểu diễn unmatched. Phép ghép không xét lớp tại IoU ít nhất 0,5 phục vụ chẩn đoán, khác phép ghép cùng lớp của bảng PR/F1. Vì thế hai bảng không có nghĩa vụ có cùng số đường chéo/TP. [2]

| Truth / Prediction | Background | Có khẩu trang | Không khẩu trang | Đeo sai |
| --- | --- | --- | --- | --- |
| Background | 0 | 181 | 13 | 6 |
| Có khẩu trang | 159 | 140 | 0 | 0 |
| Không khẩu trang | 47 | 1 | 0 | 1 |
| Đeo sai | 9 | 2 | 1 | 0 |

Diagnostic test ghi 215 truth bỏ sót, 5 nhầm lớp, 94 prediction lỗi định vị và 106 prediction dư. Các nhóm có thể chồng lấn, không cộng thành lỗi độc lập; chưa đủ review ảnh để kết luận nguyên nhân ánh sáng/góc mặt. [2]

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

## 5.9 Kết luận chương 5

Kiểm thử phần mềm và latency local không khắc phục minority recall thấp. Gate đóng; quyền ảnh, setup độc lập, camera và HTTPS chưa đủ nghiệm thu.

# KẾT LUẬN

Đồ án đã xây dựng được ứng dụng web có ba đầu vào dùng chung contract ảnh, adapter SSDLite thật, kiểm tra checkpoint và các cơ chế quản lý tác vụ bất đồng bộ. Các lớp giao diện, API và ML có kiểm thử riêng; benchmark với checkpoint thật đã phát hiện một race video mà test fixture trước đó chưa bộc lộ. Việc tái hiện, sửa và kiểm chứng lại cho thấy cần kết hợp kiểm thử có kiểm soát với chạy stream dài. [3,5]

Kết quả chất lượng là hạn chế lớn nhất của baseline. Test macro F1 0,2061 và mAP50:95 0,0820 đi cùng recall rất thấp ở hai lớp ít mẫu. Do đó ứng dụng hiện chỉ phù hợp trình diễn kỹ thuật nội bộ trong phạm vi được cho phép. Không có cơ sở đưa vào cảnh báo tự động hoặc quyết định về con người. Confidence hiển thị chưa được calibration và trạng thái `uncertain` chưa triển khai. [2]

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

Nguồn ảnh giao diện: script capture-fixtures.mjs của P12, media synthetic không khuôn mặt và response fixture. Nguồn sơ đồ: source P11, P12 biên tập. Không sử dụng ảnh dataset hoặc hình minh họa nhận diện người thật.

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

# PHỤ LỤC B THÔNG TIN CẦN BỔ SUNG

Kịch bản demo: ảnh synthetic, video local pause/seek, webcam giả lập start/stop; nêu rõ response fixture. Nếu dùng checkpoint thật, giữ phạm vi nội bộ và công bố giới hạn chất lượng. P13 video/rehearsal chưa được thực hiện trong đợt chỉnh báo cáo.

| Mục trước khi nộp | Trạng thái |
| --- | --- |
| MSSV, khóa đào tạo và đóng góp cá nhân | Cần bổ sung và xác nhận |
| Mẫu trình bày | Theo file tham chiếu được cung cấp; không coi là rubric học phần đã xác nhận |
| Review độc lập | Chưa có minh chứng |
| Camera vật lý, HTTPS và rollback hosted | Chưa kiểm chứng |
| Video demo và rehearsal P13 | Chưa thực hiện |

Giữ issue #26 mở khi thông tin bắt buộc và review còn thiếu. Không thêm chữ ký hoặc nghiệm thu của giảng viên khi chưa có xác nhận.
