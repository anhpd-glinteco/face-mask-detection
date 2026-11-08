# LỜI CẢM ƠN

Nhóm xin cảm ơn các thầy cô Trường Công nghệ thông tin và Truyền thông, Đại học Công nghiệp Hà Nội đã giảng dạy những kiến thức giúp nhóm thực hiện đồ án chuyên ngành Kỹ thuật phần mềm. Nhóm cũng xin cảm ơn giảng viên hướng dẫn ThS. Vũ Thị Dương trong quá trình thực hiện đề tài.

Báo cáo trình bày quá trình xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang từ ảnh, video trên máy và webcam. Chất lượng mô hình còn thấp, một số vấn đề về nguồn dữ liệu và điều kiện nghiệm thu chưa được giải quyết. Nhóm trình bày cụ thể những hạn chế này trong phần thực nghiệm và kết luận.

Nhóm mong nhận được góp ý của thầy cô về nội dung và cách trình bày để tiếp tục hoàn thiện đồ án.

Nhóm 1

# TÓM TẮT

Đồ án xây dựng ứng dụng web phát hiện trạng thái đeo khẩu trang từ ảnh, video và webcam. Giao diện Next.js kết nối với API FastAPI và mô hình SSDLite320 MobileNetV3 Large chạy trên CPU. Kết quả gồm vị trí phát hiện, nhãn và điểm tin cậy. Với video và webcam, trình duyệt gửi từng khung hình qua HTTP và chỉ xử lý tiếp khi tác vụ hiện tại hoàn tất. Máy chủ không lưu lịch sử media. [4,5]

Nhóm so sánh mô hình huấn luyện từ đầu với mô hình fine-tune từ trọng số COCO trên cùng cách chia dữ liệu. Sau 30 epoch, checkpoint epoch 10 được chọn bằng validation. Trên tập test, macro F1 tăng từ 0,2061 lên 0,3240 và mAP50:95 tăng từ 0,0820 lên 0,1333. Kết quả từng lớp vẫn chưa đạt mục tiêu; tập test này cũng đã được sử dụng ở thí nghiệm trước. [2,12]

Bản giao diện ngày 05/11 mặc định lọc dự đoán yếu và giữ khung hình cuối khi dừng. Camera laptop được thử trên localhost hơn 60 giây; người vận hành xác nhận đèn tắt sau khi dừng. Các kiểm thử phần mềm, phép đo hiệu năng và điều kiện chạy được trình bày ở chương 5. Quyền sử dụng từng ảnh và tính độc lập giữa các cảnh chưa được xác minh đầy đủ, nên ứng dụng hiện giới hạn ở trình diễn kỹ thuật local. [1,13]

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
| Dữ liệu kiểm thử có kiểm soát | Test fixture | Đầu vào hoặc response kiểm thử có kiểm soát |
| Media tổng hợp | Synthetic media | Media được tạo để kiểm thử, không phải camera vật lý |
| Readiness | Model readiness | Trạng thái model đã nạp để phục vụ |

# DANH MỤC HÌNH VẼ

{{figures}}

# DANH MỤC BẢNG BIỂU

{{tables}}

<!-- body -->

# CHƯƠNG 1 GIỚI THIỆU DỰ ÁN PHẦN MỀM

## 1.1 Lý do chọn đề tài và đối tượng sử dụng

Nhóm chọn bài toán phát hiện trạng thái đeo khẩu trang để kết hợp kiến thức học máy với phát triển ứng dụng web. Bài toán yêu cầu vừa xác định vị trí khuôn mặt, vừa phân loại trạng thái khẩu trang, đồng thời hiển thị kết quả rõ ràng khi đầu vào là ảnh, video hoặc webcam.

Trong một ảnh có thể xuất hiện nhiều người với trạng thái đeo khẩu trang khác nhau. Vì vậy, ứng dụng cần hiển thị kết quả cho từng vùng mà mô hình dự đoán có khuôn mặt. Mỗi kết quả gồm hộp giới hạn (bbox), nhãn và điểm tin cậy (confidence). Tọa độ được trả theo kích thước ảnh gốc để giao diện vẽ hộp đúng vị trí khi ảnh thay đổi kích thước hiển thị. [4]

## 1.2 Mục tiêu và phạm vi áp dụng

Ứng dụng hỗ trợ ba nguồn đầu vào với cùng định dạng yêu cầu phân tích ảnh. Người dùng gửi ảnh trực tiếp; với video và webcam, trình duyệt chỉ gửi khung hình được trích ra. API trả kích thước ảnh, thông tin mô hình, danh sách phát hiện và thời gian xử lý. Trình duyệt kiểm tra phản hồi rồi hiển thị kết quả trên đúng ảnh hoặc khung hình đã gửi. Máy chủ vì thế chỉ xử lý từng ảnh, không cần nhận cả video hay quản lý phiên truyền hình ảnh liên tục. [4,5]

<!-- table: Mục tiêu và điều kiện kiểm chứng -->
| Nhóm mục tiêu | Điều kiện kiểm chứng | Trạng thái kiểm chứng |
| --- | --- | --- |
| Ảnh | Tải ảnh, lỗi đầu vào, vẽ bbox, đổi ảnh | Đã kiểm tra với dữ liệu có kiểm soát và HTTP local |
| Video | Lấy mẫu nối tiếp, pause/seek, loại kết quả cũ | Kiểm thử hồi quy và đo với dữ liệu tổng hợp đạt sau sửa |
| Webcam | Start/stop, quyền, track cleanup | Kiểm thử có kiểm soát tại kiểm thử tích hợp; bổ sung camera thật ngày 05/11 |
| Chất lượng | Metric ba lớp trên test đã khóa | Đã đo; chất lượng thấp |
| Hiệu năng | Cold, warm và hai stream 60 giây | Local CPU, workload tổng hợp |
| Công khai | HTTPS, camera thật, quyền dữ liệu | Chưa đạt điều kiện triển khai |

## 1.3 Khảo sát và cơ sở lựa chọn giải pháp

Nhóm xác định yêu cầu từ ba luồng sử dụng, các tình huống lỗi và tài nguyên sẵn có của dự án. Nhóm chưa thực hiện khảo sát bằng bảng hỏi hoặc phỏng vấn có dữ liệu lưu trữ, nên chưa có kết quả nghiên cứu nhu cầu thực địa. [4]

## 1.4 Quy trình phát triển và phân công công việc

Nhóm thực hiện đồ án theo từng phiên, bắt đầu từ phân tích yêu cầu, thiết kế kiến trúc, kiểm tra dữ liệu rồi huấn luyện và đánh giá baseline. Sau đó, nhóm tích hợp suy luận với ba luồng giao diện, kiểm thử tích hợp và hồi quy, đo hiệu năng, rồi hoàn thiện tài liệu. Mỗi phiên có đầu ra, pull request (PR) và ghi chú bàn giao. Nhóm đối chiếu công việc đã làm với điều kiện hoàn thành và bằng chứng kiểm thử; ngày dự kiến trong kế hoạch chỉ dùng để theo dõi tiến độ. [4]

<!-- table: Phân công công việc trong nhóm -->
| Vai trò | Thành viên | Công việc được phân công |
| --- | --- | --- |
| FE | Phùng Đức Anh | Phụ trách giao diện ảnh, video, webcam, kết nối API, hiển thị kết quả và thống kê theo khung hình. Phối hợp với Hoàng. |
| Phối hợp FE, kiểm thử và triển khai | Bùi Ngọc Minh Hoàng | Phối hợp FE; phụ trách kiểm thử, hiệu năng, Docker và CI. |
| Dữ liệu, ML và inference | Nguyễn Đình Luân Kiệt, Bùi Nguyên Hải | Đồng phụ trách kiểm tra nguồn dữ liệu, chia tập, API contract, FastAPI, cấu hình mô hình, đánh giá và tích hợp trọng số theo phân công trên GitHub. |
| Tài liệu và nghiệm thu | Cả nhóm | Cùng hoàn thiện báo cáo, slide, kiểm thử nghiệm thu và video demo. |

## 1.5 Kết luận chương 1

Ứng dụng phục vụ một tác nhân với ba nguồn ảnh, video và webcam, không có tài khoản hoặc cơ sở dữ liệu. Người dùng có thể xem kết quả của từng khung hình và chủ động dừng hoặc đổi nguồn.

# CHƯƠNG 2 PHÂN TÍCH VÀ ĐẶC TẢ YÊU CẦU PHẦN MỀM

## 2.1 Tác nhân và biểu đồ use case

Ứng dụng có một tác nhân nghiệp vụ là người sử dụng trình duyệt. Người dùng chọn ảnh, video hoặc bật webcam, đồng thời có thể dừng và đổi nguồn. Trình duyệt, FastAPI và bộ phát hiện là các thành phần thực hiện chức năng. Hệ thống xử lý ảnh theo từng yêu cầu, không quản lý tài khoản hay lưu lịch sử media. [4,5]

Biểu đồ use case được xây dựng bằng PlantUML. Nhóm mô tả tác nhân, các chức năng và quan hệ bằng mã nguồn UML, sau đó xuất sơ đồ thành hình để chèn vào báo cáo. Tác nhân chính là người sử dụng, với ba chức năng phân tích ảnh, video và webcam, cùng các thao tác xem kết quả và dừng hoặc đổi nguồn. Mã nguồn sơ đồ được lưu trong tệp `docs/report/diagrams/system.puml` của dự án. [11]

{{usecases}}

Hình Biểu đồ use case của ứng dụng

Use case của ứng dụng khẩu trang. Nguồn: Nhóm thực hiện bằng PlantUML, từ sơ đồ P1. Đây là sơ đồ chức năng; các điều kiện nghiệm thu camera thật, dữ liệu và deployment được đánh giá riêng ở chương 5.

## 2.2 Yêu cầu chức năng và truy vết

Ba use case đầu vào mô tả cách người dùng phân tích ảnh, video và webcam. Yêu cầu chức năng tập trung vào chọn nguồn, nhận kết quả phát hiện, quản lý tác vụ bất đồng bộ và hiển thị trạng thái xử lý. Các yêu cầu phi chức năng quy định giới hạn dữ liệu gửi lên, quyền riêng tư, khả năng tiếp cận, tính tái lập và hiệu năng. Ma trận dưới đây đối chiếu với bằng chứng của kiểm thử tích hợp; tài liệu P1 được giữ để truy vết thiết kế ban đầu. [3,4]

<!-- table: Yêu cầu chức năng -->
| ID | Yêu cầu | Bằng chứng và phần còn thiếu |
| --- | --- | --- |
| FR01–02 | Ảnh và overlay bbox | Dữ liệu kiểm thử có kiểm soát resize; đường model thật với media tổng hợp |
| FR03 | Video local, pause/seek | Unit, E2E và regression race kiểm thử tích hợp |
| FR04 | Webcam chủ động, cleanup | Đã kiểm tra quyền, track và camera thật trên localhost |
| FR05 | Không backlog, bỏ response cũ | Sampler tests và browser delayed response |
| FR06 | Lỗi, loading, empty, retry | Unit/E2E và native 503 smoke |
| FR07 | Count, FPS và latency | Benchmark 60 giây; không phải số người duy nhất |
| FR08 | Model/schema/timing | Adapter và contract thật; UI không thay thế readiness probe |

## 2.3 Yêu cầu phi chức năng

<!-- table: Yêu cầu phi chức năng -->
| ID | Yêu cầu | Kiểm chứng và giới hạn |
| --- | --- | --- |
| NFR01 | Không lưu lịch sử media; ghi rõ nguồn/quyền dùng | Kiến trúc stateless; quyền từng ảnh chưa xác minh |
| NFR02 | Giới hạn payload, decode, bbox hữu hạn và CORS | Adapter/client tests; MIME khai báo chưa đối chiếu hoàn toàn định dạng decode |
| NFR03 | Warm p95 ≤ 1 s, cold ready ≤ 30 s, lỗi ≤ 1% | kiểm thử tích hợp đạt trên workload local tổng hợp |
| NFR04 | Điều khiển có nhãn và thông báo lỗi bằng chữ | Unit/browser dùng dữ liệu kiểm thử có kiểm soát; chưa audit độc lập |
| NFR05 | Split, seed, config và checksum tái lập | Kiểm tra hash và kỹ thuật đạt; scene independence chưa xác minh |
| NFR06 | CI, readiness và hướng dẫn cài đặt | CI đạt; cài đặt trên máy sạch chưa nghiệm thu |
| NFR07 | Webcam trong secure context và demo dự phòng | Localhost với camera thật đã kiểm tra; HTTPS công khai chưa kiểm chứng |

Các yêu cầu mới được kiểm thử một phần vẫn được giữ ở trạng thái chưa hoàn tất, kèm phần việc còn thiếu trong bảng.

## 2.4 UC01 Phân tích ảnh

Mục đích: xem trạng thái khẩu trang trong một ảnh được phép sử dụng. Tiền điều kiện: trang đã mở; dịch vụ/model sẵn sàng để nhận kết quả thật. Trigger: người dùng chọn/thay ảnh. Đầu vào: JPEG/PNG/WebP ≤ 10 MiB. Đầu ra: preview, detections hoặc trạng thái lỗi.

<!-- table: Luồng phân tích ảnh -->
| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Người dùng chọn ảnh; browser kiểm tra loại/kích thước, hủy request ảnh trước. |
| 2 | Hệ thống preview ảnh, reset kết quả cũ và thông báo đang phân tích. |
| 3 | Gửi multipart `image`; API kiểm tra dung lượng, decode và readiness. |
| 4 | Model xử lý; API trả bbox theo ảnh gốc, nhãn, confidence, version và timing. |
| 5 | Client validate response, kiểm tra còn đúng nguồn/request, scale bbox để vẽ. |
| 6 | Người dùng xem danh sách/overlay; có thể thay ảnh hoặc retry khi lỗi tạm thời. |

Ngoại lệ: loại/dung lượng sai → không gọi API; ảnh hỏng → 422; model chưa sẵn sàng → 503; mạng/timeout → giữ preview, báo lỗi và cho retry; response sai → không vẽ. Đổi ảnh trong lúc chờ → abort/loại response cũ. Không phát hiện mặt từ model thật là kết quả hợp lệ, tách biệt model lỗi hoặc stub.

Hậu điều kiện: kết quả gắn với ảnh hiện tại, không lưu media; object URL cũ được thu hồi khi thay ảnh/rời trang.

## 2.5 UC02 Phân tích video

Mục đích: xem detection của các frame được xử lý trong video local. Tiền điều kiện: trình duyệt hỗ trợ codec của file; model sẵn sàng. Trigger: chọn video và phát. File ở browser, server chỉ nhận frame ảnh. Đầu ra: preview, frame đã phân tích kèm overlay, thống kê và lỗi nếu có.

<!-- table: Luồng phân tích video -->
| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Chọn video; đọc metadata, tạo preview local; lỗi codec/file phải thông báo. |
| 2 | Khi phát, sampler chỉ capture khi không có request đang chạy. |
| 3 | Capture frame từ nguồn hiện tại và ghi nhận snapshot cùng thời điểm video. |
| 4 | Gửi frame qua detect API, chờ xong trước khi xét frame kế tiếp; không queue. |
| 5 | Chỉ nhận kết quả còn đúng session; hiển thị frame đã phân tích cùng overlay. |
| 6 | Cập nhật thống kê của frame và processed FPS/latency; lặp khi còn phát. |
| 7 | Pause/end giữ snapshot cuối; tua hoặc đổi nguồn xóa snapshot. Mọi thao tác đều dừng lịch và loại response muộn. |

Không vẽ bbox của frame cũ như thể đúng trên frame live mới: dùng vùng kết quả là snapshot đã phân tích, tách khỏi video preview đang chạy và ghi timestamp của nó. FPS xử lý không phải FPS video. Không cộng detection thành tổng người duy nhất.

Ngoại lệ: API chậm → bỏ lượt capture khi bận, không backlog; timeout/lỗi → dừng sampling và báo lỗi, người dùng chủ động thử lại; seek/pause → hủy/vô hiệu hóa request, không bắt đầu vòng mới trước khi request cũ kết thúc; video không đọc được → không gửi.

Hậu điều kiện: không còn timer/request hữu hiệu của nguồn cũ; thu hồi object URL khi thay file/unmount.

## 2.6 UC03 Phân tích webcam

Mục đích: xem detection theo frame từ camera do người dùng chủ động bật. Tiền điều kiện: HTTPS hoặc localhost, camera có thể truy cập, browser hỗ trợ `getUserMedia`; model sẵn sàng. Trigger: nhấn bật camera. Không mở camera chỉ vì tải trang.

<!-- table: Luồng phân tích webcam -->
| Bước | Người dùng / hệ thống |
|---|---|
| 1 | Người dùng bật camera; browser xin quyền, UI thông báo đang chờ. |
| 2 | Nếu được cấp quyền, gắn MediaStream và phát preview. |
| 3 | Dùng cùng sampler và cách hiển thị snapshot đã phân tích của UC02. |
| 4 | Hiển thị detections, số lượng theo lớp ở frame hiện tại, FPS xử lý và latency. |
| 5 | Dừng mọi track, timer và request. Dừng giữ snapshot cuối; đổi mode hoặc rời trang xóa snapshot. |

Ngoại lệ: từ chối quyền/không camera/camera bận → thông báo riêng, không vòng retry vô hạn; track kết thúc → dừng sampling và báo ngắt; yêu cầu quyền trả về sau khi người dùng đã rời mode → stop ngay stream đến muộn. API lỗi giống UC02; thao tác dừng phải luôn dùng được ngay cả khi request pending.

Hậu điều kiện: đèn camera tắt, không còn stream hoạt động và không vẽ response cũ.

## 2.7 Kết luận chương 2

Ba use case đều gọi API phát hiện ảnh, nhưng xử lý lỗi, hủy yêu cầu và giải phóng tài nguyên theo từng nguồn. Dữ liệu kiểm thử có kiểm soát được dùng để kiểm tra logic; mô hình, camera và môi trường sử dụng cần được kiểm chứng bằng các lượt chạy tương ứng.

# CHƯƠNG 3 DỮ LIỆU VÀ MÔ HÌNH NHẬN DIỆN

## 3.1 Nguồn dữ liệu annotation và quyền sử dụng

Đồ án dùng bộ Face Mask Detection phiên bản 1 do andrewmvd/Larxel đăng trên Kaggle. Bản gốc có 853 PNG và 853 Pascal VOC XML, tổng cộng 4.072 bbox. Người đăng công bố Public Domain/CC0; khi rà soát, nhóm tìm được trang MakeML lưu trữ có dẫn bộ dữ liệu này. Tuy nhiên, thông tin đi kèm chưa xác định tác giả và sự đồng ý cho từng ảnh; một số ảnh có watermark của kho ảnh thương mại. Vì vậy, khai báo giấy phép của người đăng chưa đủ để xác minh quyền sử dụng toàn bộ ảnh. [1]

<!-- table: Quy mô dữ liệu gốc và dữ liệu đã làm sạch -->
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

<!-- table: Phân bố đối tượng theo lớp và tập dữ liệu -->
| Split | with_mask | without_mask | mask_worn_incorrectly |
| --- | --- | --- | --- |
| Train | 2.358 | 594 | 93 |
| Validation | 479 | 72 | 14 |
| Test | 299 | 49 | 12 |
| Tổng | 3.136 | 715 | 119 |

Manifest SHA-256: `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3`.

## 3.3 Cơ sở detector và biểu diễn kết quả

Object detection xác định loại đối tượng và vùng bao của đối tượng trên ảnh. SSD dùng các hộp tham chiếu ở nhiều tỉ lệ để dự đoán điểm lớp và hiệu chỉnh vị trí trong cùng một mạng. Đồ án dùng SSDLite có sẵn trong TorchVision; nhóm không triển khai lại thuật toán detector. FPS và mAP của checkpoint đồ án được đo riêng, không lấy từ kết quả công bố của mô hình gốc. [6]

<!-- table: Các thành phần của kết quả nhận diện -->
| Thành phần | Ý nghĩa trong đồ án |
| --- | --- |
| Vị trí | Bbox xyxy của ảnh gốc, không phải pixel CSS |
| Nhãn | Một trong ba lớp khẩu trang |
| Confidence | Điểm model chưa được calibration ngoài thực tế |
| Model version | SHA-256 checkpoint đã nạp |
| Timing | Preprocess, inference, postprocess phía adapter |

## 3.4 Huấn luyện và tích hợp suy luận

Nhóm thử fine-tune từ trọng số COCO để tận dụng các đặc trưng thị giác đã học thay vì khởi tạo toàn bộ mô hình ngẫu nhiên. Backbone và đầu hồi quy được nạp từ pretrained; đầu phân loại được khởi tạo lại cho ba lớp khẩu trang và lớp nền. Thí nghiệm giữ cùng cách chia dữ liệu để so sánh với mô hình huấn luyện từ đầu. Kết quả được trình bày ở chương 5. [7,12]

Baseline lịch sử huấn luyện từ đầu dùng TorchVision SSDLite320 MobileNetV3 Large, khởi tạo từ đầu với cả `weights=None` và `weights_backbone=None`. Mô hình có bốn class ID: background và ba lớp nghiệp vụ với ID 1, 2 và 3. Lượt này không tải trọng số pretrained hoặc dùng chỉ số COCO của thư viện làm kết quả đồ án. Nhóm giữ checkpoint epoch 30, chưa so sánh nhiều checkpoint để chọn epoch tốt nhất. [2,7]

<!-- table: Cấu hình huấn luyện mô hình từ đầu -->
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

## 3.5 Kết luận chương 3

Dataset và checkpoint được lưu để tái lập thí nghiệm, còn dữ liệu ảnh gửi lên chỉ tồn tại tạm thời trong quá trình xử lý. Mã hash dùng để định danh từng tệp; quyền sử dụng ảnh và scene independence vẫn cần được xác minh riêng.

# CHƯƠNG 4 PHÁT TRIỂN HỆ THỐNG

## 4.1 Kiến trúc các thành phần

Trình duyệt đọc tệp local, xin quyền webcam, trích khung hình và hiển thị kết quả sau khi kiểm tra phản hồi. Next.js phục vụ giao diện; trình duyệt gọi API trực tiếp theo URL được cấu hình lúc build. FastAPI thực hiện suy luận và nạp checkpoint một lần khi dịch vụ khởi động. Hệ thống không có cơ sở dữ liệu, hàng đợi media hoặc dịch vụ nhận dạng danh tính. [5]

{{architecture}}

Hình Kiến trúc ứng dụng trong môi trường local

Kiến trúc local được đối chiếu từ source kiểm thử tích hợp. HTTP localhost là môi trường đã kiểm chứng; HTTPS công khai còn là mục tiêu. Mũi tên biểu diễn dữ liệu trao đổi giữa các thành phần.

## 4.2 Dữ liệu trao đổi và contract API

Endpoint `POST /api/v1/detect` nhận multipart field `image`. `schema_version` giữ giá trị `1.0`; response có `image`, `model`, `detections` và `timing_ms`. Video/webcam không thêm endpoint mới, không gửi file video nguyên vẹn. Schema và client validation bảo vệ ranh giới giữa API và giao diện. [5]

<!-- table: Cấu trúc phản hồi của API nhận diện -->
| Trường | Dữ liệu | Quy tắc cần giữ |
| --- | --- | --- |
| image | width, height | Kích thước gốc đã decode |
| model | name, version | Version là checksum checkpoint |
| detections | class_id, label, confidence, bbox | Nhãn đúng class map; confidence hữu hạn [0,1] |
| bbox | x1, y1, x2, y2 | Diện tích dương, nằm trong ảnh |
| timing_ms | preprocess, inference, postprocess | Timing thật trong adapter |

<!-- table: Mã phản hồi HTTP và cách xử lý trên giao diện -->
| Mã HTTP | Ý nghĩa | Hành vi giao diện cần phân biệt |
| --- | --- | --- |
| 413 | Payload quá lớn | Báo giới hạn và cho chọn lại |
| 415 | MIME khai báo không hỗ trợ | Báo loại file không hợp lệ |
| 422 | Không decode được ảnh | Báo file lỗi |
| 503 | Model chưa sẵn sàng | Báo lỗi readiness, không coi là không có mặt |
| 500 | Lỗi suy luận | Báo lỗi xử lý, không hiển thị kết quả giả |

## 4.3 Mô hình dữ liệu xử lý trong bộ nhớ

<!-- table: Các cấu trúc dữ liệu và vòng đời xử lý -->
| Cấu trúc | Thành phần chính | Quan hệ và vòng đời |
| --- | --- | --- |
| DetectionResponse | schema_version, image, model, detections, timing_ms | Một response cho một ảnh/frame |
| Detection | class_id, label, confidence, bbox | Nhiều detection trong một response |
| BoundingBox | x1, y1, x2, y2 | Tọa độ pixel ảnh gốc, diện tích dương |
| FrameSnapshot | Ảnh frame, result và thời điểm media | Gắn kết quả với frame đã gửi |
| FrameStatistics | processed, skipped, fps, latencyMs | Thống kê trong vòng lấy mẫu |
| Checkpoint | config, metadata, model tensors và checksum | Nạp khi process inference khởi động |

Hệ thống xử lý dữ liệu trao đổi và trạng thái phiên trong bộ nhớ. Ảnh được giải mã tạm thời để phân tích, không lưu thành lịch sử. Do ứng dụng không dùng cơ sở dữ liệu nên không cần cài MySQL, thiết kế ERD hay chuyển đổi lược đồ (migration). Các cấu trúc được liệt kê ở trên là cấu trúc đang dùng, không phải API công khai hoặc kiểu dữ liệu mới. [5]

## 4.4 Biểu đồ trình tự và quản lý dữ liệu frame

Luồng ảnh bắt đầu khi người dùng chọn file. Browser kiểm loại và kích thước, tạo preview rồi gửi multipart. Khi response hợp lệ trở về, giao diện gắn bbox vào ảnh đúng nguồn; nếu người dùng đổi ảnh trước đó thì kết quả cũ mất hiệu lực. Nút retry phục vụ lỗi có thể thử lại, còn lỗi loại file yêu cầu chọn đầu vào phù hợp. Các trạng thái loading, lỗi và empty có thông điệp riêng. [4,5]

{{sequence}}

Hình Trình tự xử lý một khung hình

Trình tự một frame và nhánh loại response cũ. Sơ đồ mô tả thuật toán đang dùng trong sampler và workspace, không biểu diễn một kết nối streaming liên tục.

## 4.5 Giao diện ảnh và tích hợp API

Ba khu vực ảnh, video và webcam dùng lại các thành phần xem trước, kết quả, thông báo và thống kê. ImagePreview đặt lớp vẽ kết quả theo kích thước ảnh hiển thị; captureFrame trích ảnh từ phần tử media để gửi đến API. Bộ lấy mẫu dùng chung quản lý trạng thái bận, phiên xử lý, chu kỳ lấy mẫu và hủy yêu cầu. Việc xin quyền camera vẫn nằm riêng trong luồng webcam, còn luồng video chỉ đọc tệp trên máy. [5]

{{image}}

Hình Giao diện phân tích ảnh

Giao diện phân tích ảnh với dữ liệu tổng hợp không có khuôn mặt. Các bbox và nhãn lấy từ phản hồi kiểm thử có kiểm soát, dùng để minh họa giao diện và không đo chất lượng checkpoint.

## 4.6 Giao diện webcam và khả năng tiếp cận

Webcam chỉ gọi `getUserMedia` khi người dùng bấm bắt đầu. Trình duyệt yêu cầu hình ảnh và không thu âm. Các track camera được dừng khi người dùng dừng, đổi chế độ, rời thành phần giao diện hoặc khi yêu cầu khởi động đã hết hiệu lực. Phản hồi đến sau khi phiên camera kết thúc bị bỏ qua. VideoWorkspace và WebcamWorkspace dùng chung bộ lấy mẫu, còn việc mở và giải phóng nguồn được quản lý riêng. [5]

{{webcam}}

Hình Giao diện phân tích webcam

Giao diện webcam với media không có khuôn mặt và phản hồi kiểm thử có kiểm soát. Ảnh minh họa cách vẽ bbox, không dùng để đánh giá mô hình hoặc camera vật lý.

## 4.7 Giao diện video và sử dụng chung sampler

{{video}}

Hình Giao diện phân tích video

Giao diện khung hình video đã phân tích. Media không có khuôn mặt và phản hồi kiểm thử có kiểm soát được dùng để minh họa giao diện; hiệu năng checkpoint thật được đo ở lượt riêng.

VideoWorkspace và WebcamWorkspace cùng xét lấy mẫu mỗi 200 ms. Nếu tác vụ trước chưa kết thúc, lượt lấy mẫu mới được bỏ qua. Khi tạm dừng, tua, dừng hoặc đổi nguồn, mã phiên xử lý được tăng để phản hồi muộn không ghi đè kết quả hiện tại. Khi dừng webcam, tạm dừng hoặc kết thúc video, giao diện giữ frame cuối đã phân tích cùng timestamp và thống kê. Bắt đầu phiên webcam mới, đổi nguồn, tua video hoặc rời thành phần sẽ xóa kết quả cũ và giải phóng object URL. Phản hồi đến muộn bị bỏ qua. [3,5]

## 4.8 Kết luận chương 4

Ba luồng dùng chung định dạng dữ liệu và bộ lấy mẫu. Giao diện chỉ vẽ và liệt kê detection đạt 0,15 mặc định; nhóm “Xem dự đoán chưa chắc chắn” mở cả danh sách và box yếu. So sánh dùng confidence gốc trước khi làm tròn, đúng 0,15 được tính đạt ngưỡng. API giữ score tối thiểu 0,001 và schema cũ; dữ liệu gốc còn trong bộ nhớ để đối chiếu. [10]

# CHƯƠNG 5 TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG

## 5.1 Môi trường và hướng dẫn triển khai local

Môi trường được kiểm chứng là Windows 11, CPU i5-13500H, khoảng 16,8 GB RAM, Python 3.12.14, Node 24.19.0 và Chromium 156.0.8078.4. Phần suy luận dùng Torch 2.9.0+cpu/TorchVision 0.24.0+cpu với hai luồng CPU. Nhóm chưa đo trên nhiều máy để xác định cấu hình tối thiểu. CI dùng Node 22. [3]

## 5.2 Kiểm thử phần mềm và CI

Nhóm kiểm tra từng phần bằng kiểm thử đơn vị, kiểm tra định dạng dữ liệu và kiểm thử trình duyệt với dữ liệu có kiểm soát. Cách này giúp chủ động tạo lỗi và phản hồi muộn. Nhóm cũng kiểm tra khởi động local và đo hiệu năng với checkpoint thật trên tải thử cụ thể. Độ chính xác của mô hình và hoạt động của camera vật lý được kiểm tra riêng, vì dữ liệu có kiểm soát chỉ phản ánh logic phần mềm. [3]

<!-- table: Kết quả kiểm thử phần mềm ở lượt tích hợp -->
| Suite kiểm thử tích hợp | Kết quả | Phạm vi |
| --- | --- | --- |
| Frontend unit | 81 tests, 6 files | UI, client, sampler và race video |
| Backend | 24 tests | API/loader/contract, weights tổng hợp |
| ML | 37 tests | Chuẩn bị dữ liệu, evaluator, trainer self-check |
| Benchmark unit | 3 tests | Percentile, readiness, denominator/memory |
| Browser dữ liệu kiểm thử có kiểm soát | 4 tests | Chromium desktop/mobile, ba luồng |
| Native no-model smoke | 1 test | Web/health 200, ready/detect 503 và CORS |

## 5.3 Phương pháp đánh giá chất lượng

IoU được tính bằng diện tích giao của hai bbox chia diện tích hợp. Ở ngưỡng vận hành huấn luyện từ đầu, prediction được xét theo confidence giảm dần và ghép một đối một với ground truth cùng lớp chưa ghép có IoU cao nhất, nếu IoU ít nhất 0,5. Một prediction ghép đúng là TP; prediction dư là FP; ground truth không được ghép là FN. Cách ghép này cần cố định trước khi so sánh các run. [2]

Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = 2PR/(P+R). Macro lấy trung bình các lớp với trọng số bằng nhau. Điều này giúp lớp ít mẫu vẫn ảnh hưởng đến chỉ số tổng hợp; macro F1 không đồng nhất với F1 tính từ tổng TP/FP/FN của mọi lớp. Báo cáo giữ cả chỉ số theo lớp và macro để tránh lớp đông mẫu che khuất hai lớp còn lại.

<!-- table: Các chỉ số đánh giá và điều kiện áp dụng -->
| Số đo | Điều kiện cần ghi kèm | Giới hạn |
| --- | --- | --- |
| PR và F1 | Ngưỡng confidence, IoU, phép ghép | Thay ngưỡng có thể đổi mạnh kết quả |
| Macro | Danh sách lớp được trung bình | Không biểu diễn số người thực tế |
| AP50 | Đường PR và IoU 0,5 | Dễ đạt hơn yêu cầu vị trí chặt |
| mAP50:95 | IoU 0,50–0,95 và nội suy | Evaluator nội bộ chưa gồm area/crowd rules |

AP nội suy 101 điểm recall; AP50 dùng IoU 0,5, mAP50:95 trung bình IoU 0,50–0,95 bước 0,05 và các lớp. AP tính trước ngưỡng vận hành 0,15. Evaluator nội bộ chưa gồm area/crowd rules và không tương đương hoàn toàn official COCO evaluator. Chưa có khoảng tin cậy hoặc domain-shift test. [2]

## 5.4 Kết quả mô hình huấn luyện từ đầu

Validation gồm 98 ảnh và 565 bbox. Grid confidence từ 0,05 đến 0,95, bước 0,05, chọn macro F1 lớn nhất; nếu hòa chọn ngưỡng cao hơn. Ngưỡng 0,15 được khóa trước khi đánh giá test 75 ảnh/360 bbox. kiểm thử tích hợp không đo lại test, thay split hoặc điều chỉnh threshold; báo cáo trích đúng kết quả huấn luyện từ đầu. [2]

<!-- table: Kết quả mô hình huấn luyện từ đầu trên validation và test -->
| Split | Macro precision | Macro recall | Macro F1 | AP50 | mAP50:95 |
| --- | --- | --- | --- | --- | --- |
| Validation | 0,3182 | 0,1560 | 0,1771 | 0,1153 | 0,0495 |
| Test | 0,2393 | 0,1975 | 0,2061 | 0,1792 | 0,0820 |

<!-- table: Precision, recall và F1 của mô hình huấn luyện từ đầu -->
| Lớp test | Support | Precision | Recall | F1 |
| --- | --- | --- | --- | --- |
| with_mask | 299 | 0,4321 | 0,4682 | 0,4494 |
| without_mask | 49 | 0,1429 | 0,0408 | 0,0635 |
| mask_worn_incorrectly | 12 | 0,1429 | 0,0833 | 0,1053 |

Theo phép đo ghép cùng lớp, mô hình chỉ phát hiện đúng 2/49 bbox `without_mask` và 1/12 bbox `mask_worn_incorrectly`. Phần lớn đối tượng của hai lớp này bị bỏ sót. Đây là hạn chế chính của baseline, được thể hiện rõ hơn ở bảng theo lớp so với chỉ số trung bình. Dù thời gian xử lý thấp, kết quả nhận diện hiện chưa đủ tin cậy để dùng cho cảnh báo.

<!-- table: AP theo lớp của mô hình huấn luyện từ đầu -->
| Lớp | AP50 | mAP50:95 |
| --- | --- | --- |
| with_mask | 0,4251 | 0,2034 |
| without_mask | 0,0190 | 0,0086 |
| mask_worn_incorrectly | 0,0936 | 0,0340 |

API vẫn dùng score floor 0,001 và trả confidence; UI dùng mốc 0,15 để đánh dấu, mặc định ẩn detection thấp, cho phép mở nhóm chưa chắc chắn. [10] Do đó ảnh giao diện hoặc số detection API không thể đọc trực tiếp như kết quả PR/F1 tại ngưỡng vận hành. Muốn so sánh cần dùng đúng hậu xử lý và định nghĩa phép đo, đồng thời không tuning dựa trên test đã mở. [2,5]

## 5.5 Thí nghiệm fine-tune từ pretrained COCO ngày 05/11

Thí nghiệm bổ sung dùng SSDLite320 MobileNetV3 Large COCO_V1 chính thức của TorchVision 0.24.0. Mô hình bốn lớp được dựng trước, sau đó nạp 428 tensor backbone và hồi quy vị trí từ weights COCO. Toàn bộ 48 tensor đầu phân loại được khởi tạo mới cho background và ba trạng thái khẩu trang. SHA-256 của weights được kiểm tra và lưu cùng cấu hình. Việc dùng weights pretrained được tách rõ khỏi baseline khởi tạo ngẫu nhiên huấn luyện từ đầu. [12]

Dữ liệu curated và split 670/98/75 được giữ nguyên. Cấu hình dùng CPU hai luồng, batch 2, seed 42, SGD với learning rate 0,001, momentum 0,9, weight decay 0,0005. Learning rate giảm còn 0,0001 sau epoch 20. Đã chạy đủ 30 epoch và chọn checkpoint theo validation mAP50:95 từng epoch; checkpoint tốt nhất là epoch 10. Tổng thời gian ghi nhận trong lịch sử epoch là 12.813,99 giây, bao gồm một lần máy ngủ trong epoch 13. Trung vị thời gian mỗi epoch là 399,69 giây; tổng thời gian cần được xem cùng tình trạng máy trong lúc huấn luyện.

Ngưỡng đánh giá 0,25 được chọn bằng macro F1 trên validation theo cùng grid của huấn luyện từ đầu rồi khóa trước lượt test của thí nghiệm. Ngưỡng trình bày giao diện vẫn là 0,15. Tập test đã từng được đánh giá ở huấn luyện từ đầu, nên đây là phép so sánh trên tập đã sử dụng; kết quả chưa phải đánh giá trên một tập giữ kín mới. Mô hình không được điều chỉnh theo kết quả test của lượt này.

<!-- table: So sánh mô hình huấn luyện từ đầu và fine-tune -->
| Split và mô hình | Macro precision | Macro recall | Macro F1 | AP50 | mAP50:95 |
| --- | --- | --- | --- | --- | --- |
| Validation huấn luyện từ đầu | 0,3182 | 0,1560 | 0,1771 | 0,1153 | 0,0495 |
| Validation fine-tune | 0,5742 | 0,2586 | 0,3351 | 0,3047 | 0,1460 |
| Test huấn luyện từ đầu | 0,2393 | 0,1975 | 0,2061 | 0,1792 | 0,0820 |
| Test fine-tune | 0,5159 | 0,2696 | 0,3240 | 0,2684 | 0,1333 |

<!-- table: Precision, recall và F1 của mô hình fine-tune -->
| Lớp test | Support | Precision | Recall | F1 |
| --- | --- | --- | --- | --- |
| with_mask | 299 | 0,5978 | 0,5418 | 0,5684 |
| without_mask | 49 | 0,4500 | 0,1837 | 0,2609 |
| mask_worn_incorrectly | 12 | 0,5000 | 0,0833 | 0,1429 |

<!-- table: AP theo lớp của mô hình fine-tune -->
| Lớp | AP50 huấn luyện từ đầu | AP50 fine-tune | AP50:95 huấn luyện từ đầu | AP50:95 fine-tune |
| --- | --- | --- | --- | --- |
| with_mask | 0,4251 | 0,5514 | 0,2034 | 0,2931 |
| without_mask | 0,0190 | 0,2016 | 0,0086 | 0,0941 |
| mask_worn_incorrectly | 0,0936 | 0,0520 | 0,0340 | 0,0127 |

Ở ngưỡng 0,25, lớp with_mask có TP/FP/FN là 162/109/137; without_mask là 9/11/40; mask_worn_incorrectly là 1/1/11. Đây là phép ghép cùng lớp để tính precision/recall/F1, khác quy tắc phân tích lỗi bên dưới.

Macro F1 và AP tăng so với baseline, nhưng AP của lớp đeo sai giảm. Mục tiêu validation macro F1 và precision/recall từng lớp đạt 0,80 vẫn chưa đạt. Lớp đeo sai chỉ phát hiện đúng 1/14 bbox validation và 1/12 bbox test. Confidence hiển thị 100% là điểm dự đoán sau làm tròn, chưa chứng minh xác suất dự đoán đúng 100% trong thực tế.

Phân tích lỗi test của bản fine-tune ghi 185 đối tượng bị bỏ sót, 4 nhầm lớp, 57 dự đoán sai vị trí và 61 dự đoán dư. Các nhóm dùng quy tắc ghép riêng trong bộ đánh giá và có thể chồng lấn. Báo cáo giữ cả kết quả theo lớp và số lượng mẫu để thể hiện hạn chế của hai lớp ít mẫu. [12]

## 5.6 Phân tích lỗi baseline và hồi quy video

Ma trận nhầm lẫn dưới đây có hàng là nhãn thực tế, cột là nhãn dự đoán; background biểu diễn đối tượng không ghép được. Để phân tích lỗi, phép ghép trong ma trận chỉ yêu cầu IoU ít nhất 0,5 và không xét lớp. Cách ghép này khác bảng PR/F1, nơi nhãn phải cùng lớp, nên tổng đường chéo của ma trận có thể khác số TP trong bảng đó. [2]

<!-- table: Ma trận nhầm lẫn của mô hình huấn luyện từ đầu -->
| Truth / Prediction | Background | Có khẩu trang | Không khẩu trang | Đeo sai |
| --- | --- | --- | --- | --- |
| Background | 0 | 181 | 13 | 6 |
| Có khẩu trang | 159 | 140 | 0 | 0 |
| Không khẩu trang | 47 | 1 | 0 | 1 |
| Đeo sai | 9 | 2 | 1 | 0 |

Phân tích trên tập test ghi nhận 215 đối tượng thực bị bỏ sót, 5 trường hợp nhầm lớp, 94 dự đoán sai vị trí và 106 dự đoán dư. Các nhóm này có thể chồng lấn nên không cộng thành tổng số lỗi độc lập. Nhóm chưa rà soát đủ ảnh để kết luận lỗi do ánh sáng hay góc mặt. [2]

Khi kiểm thử hồi quy kiểm thử tích hợp, lượt chạy 1 báo hoàn tất dù bộ đếm video dừng ở 40 frame. Nhóm bổ sung kiểm tra khoảng 5 giây không có khung hình mới; nhờ đó, lượt chạy 2 phát hiện lỗi lấy mẫu khi media chưa sẵn sàng trước thao tác tua. Nhóm sửa bằng cách kết thúc phiên xử lý cũ, giải phóng snapshot và chờ sự kiện playing/seeked. Bài kiểm thử tái hiện lỗi thất bại trước khi sửa và đạt sau khi sửa. Ở lượt chạy 3, luồng chạy trên 60 giây đạt; khi chủ động gây lỗi bằng thao tác pause, bước kiểm tra phát hiện thất bại như dự kiến. Log của các lượt thất bại được lưu riêng. [3]

## 5.7 Phương pháp đo hiệu năng

Ứng dụng gửi ảnh và từng khung hình video/webcam qua HTTP multipart. Trình duyệt giữ nguồn media và quyết định thời điểm trích ảnh; máy chủ xử lý từng ảnh độc lập. Cách làm này dùng lại cùng endpoint và giảm trạng thái phải quản lý trên máy chủ, phù hợp với bản demo chạy CPU. Nhóm chưa so sánh thực nghiệm với WebSocket hay giao thức streaming khác, nên chưa kết luận cách nào tối ưu cho các mức tải khác nhau. [4,5]

<!-- table: Lựa chọn kỹ thuật lấy mẫu và giới hạn -->
| Lựa chọn | Lý do trong đồ án | Điều chưa kết luận |
| --- | --- | --- |
| HTTP từng frame | Dùng chung contract và trạng thái đơn giản | Chưa so sánh streaming quy mô lớn |
| Một tác vụ đang chờ | Giới hạn backlog và kết quả lỗi thời | Không đảm bảo hủy computation server |
| Snapshot đã phân tích | Overlay gắn đúng frame được gửi | Không phải overlay đồng bộ frame live |
| CPU hai luồng | Môi trường baseline có thể mô tả rõ | Chưa đại diện mọi máy người dùng |

## 5.8 Kết quả hiệu năng local

Run 3 kiểm thử tích hợp chạy Windows 11, Intel Core i5-13500H, RAM khoảng 16,8 GB; Python 3.12.14, Node 24.19.0 và Chromium 156.0.8078.4. Phần suy luận chạy trên CPU hai luồng. CI dùng Node 22, khác phiên bản Node trên máy local. Đầu vào gồm PNG 320×240 và video/webcam tổng hợp không có khuôn mặt; API dùng checkpoint thật đã được cố định phiên bản. [3]

<!-- table: Độ trễ HTTP và thời gian sẵn sàng ở lượt tích hợp -->
| Phép đo | Mẫu thành công | p50 ms | p95 ms |
| --- | --- | --- | --- |
| Process-cold readiness | 5/5 | 3.549,30 | 3.567,03 |
| Warm API HTTP | 100/100 | 34,50 | 36,89 |
| Browser ảnh HTTP | 1/1 | 41,31 | 41,31 |
| Browser video HTTP | 296/296 | 36,62 | 41,33 |
| Browser webcam HTTP | 302/302 | 35,95 | 40,03 |

<!-- table: Tốc độ hiển thị và độ trễ theo luồng -->
| Luồng | Thời lượng s | Snapshot hiển thị | FPS hiển thị | Capture-to-display p95 ms |
| --- | --- | --- | --- | --- |
| Video | 60,31 | 296 | 4,91 | 89,50 |
| Webcam tổng hợp | 60,37 | 301 | 4,99 | 86,00 |

Luồng webcam nhận 302 phản hồi, trong đó 301 snapshot được hiển thị khi giai đoạn đo kết thúc. Số phản hồi HTTP và số khung hình hiển thị được dùng với mẫu số tương ứng khi tính tốc độ. Luồng video có một yêu cầu chủ động hủy khi dừng, được ghi riêng; lượt chạy cuối không có yêu cầu thất bại ngoài dự kiến, thông báo lỗi giao diện hoặc lỗi trang. Phép đo ảnh chỉ có một mẫu thử nhanh, chưa đủ để xem p95 là kết quả ổn định.

Giá trị working set cao nhất ghi nhận trên cây tiến trình là 356,83 MiB cho API và 102,09 MiB cho web; JS heap của trang là 7,96 MiB. Working set có thể tính trùng vùng nhớ dùng chung, còn JS heap chỉ phản ánh một phần bộ nhớ Chromium. Việc lấy mẫu mỗi giây có thể bỏ qua đỉnh ngắn, và nhóm chưa đặt ngưỡng đạt/không đạt cho bộ nhớ. Các số đo này chỉ mô tả máy thử nghiệm, chưa dùng để dự báo trên máy khác.

## 5.9 Đối chiếu nghiệm thu và hạn chế

Ở mốc kiểm thử tích hợp, ba luồng ảnh, video và webcam đã kết nối đến bộ tích hợp suy luận thật với media tổng hợp. Kiểm thử tự động bao phủ xử lý lỗi, lớp vẽ kết quả và vòng đời tác vụ; baseline cũng đã được đánh giá trên tập test sau khi khóa ngưỡng. Chất lượng mô hình và điều kiện sử dụng dữ liệu vẫn chưa đáp ứng việc triển khai công khai. Bảng dưới đây tổng hợp kết quả và phần còn thiếu của từng hạng mục. [1–4]

<!-- table: Kết quả nghiệm thu và công việc còn lại -->
| Hạng mục | Kết luận có căn cứ | Phần cần làm tiếp |
| --- | --- | --- |
| Ba luồng web | Kiểm thử có kiểm soát và camera laptop thật trên local | Nghiệm thu đầy đủ trên các trình duyệt đích |
| Model | Fine-tune test macro F1 0,3240; huấn luyện từ đầu lịch sử 0,2061 | Chất lượng theo lớp và dữ liệu đại diện |
| Dữ liệu | Audit kỹ thuật curated đạt | Quyền từng ảnh, scene independence |
| Hiệu năng | Đạt mục tiêu hiệu năng local trên tải thử tổng hợp | Tải đại diện và môi trường đích |
| Container | CI no-model Compose đạt | Local runtime/checkpoint và setup độc lập |
| Hosted preview | Chưa kiểm chứng | HTTPS, camera, rollback |
| Tài liệu báo cáo | Đã đồng bộ tài liệu và ghi nguồn tham khảo | Duy trì hướng dẫn và hồ sơ thực nghiệm |

## 5.10 Kiểm chứng bản giao diện ngày 05/11

Bản cập nhật ngày 05/11 đạt 87 kiểm thử đơn vị frontend và 8 kiểm thử trình duyệt trên desktop/mobile; typecheck, lint và build production đều đạt. Hộp chọn tệp được kiểm tra bằng click, Enter và Space tại cả vùng giữa màn hình lẫn nút phía dưới. Với 100 detection gồm 2 đạt ngưỡng và 98 dự đoán yếu, giao diện mặc định có 2 dòng kết quả cùng bbox. Khi mở nhóm yếu, số lượng hiển thị tăng lên 100; đóng lại còn 2. Nhóm cũng kiểm tra việc giữ kết quả sau pause/ended và dừng webcam, bỏ phản hồi muộn, tua, đổi nguồn và giải phóng tài nguyên. [13]

<!-- table: Độ trễ local với checkpoint fine-tune ngày 05/11 -->
| Luồng local với checkpoint fine-tune | Khoảng chạy | Request thành công trong phase | HTTP p95 |
| --- | --- | --- | --- |
| Video dữ liệu kiểm thử | Trên 60 giây | 299 | 175,68 ms |
| Webcam laptop thật | Trên 60 giây | 220, gồm bật lại | 204,48 ms |

Camera USB2.0 HD UVC WebCam trả hình 640×480 với cấu hình nguồn 30 FPS. Các bước từ chối/cấp lại quyền, dừng, bật lại và đổi chế độ đạt kiểm tra trạng thái track; snapshot cuối còn hiển thị sau Dừng. Người vận hành xác nhận đèn camera tắt sau lượt thử. Chưa kiểm tra rút thiết bị camera tích hợp hoặc đủ các tổ hợp đeo đúng, không đeo và đeo sai theo ánh sáng/khoảng cách. Không lưu media khuôn mặt. Các request chủ động bị hủy trong thao tác điều khiển được ghi riêng trong log.

Các số đo này thuộc lượt chạy local ngày 05/11. Kết quả kiểm thử tích hợp trước đó được đo trên media tổng hợp. Do tải thử và thời điểm đo khác nhau, nhóm chưa thể quy toàn bộ chênh lệch độ trễ cho việc dùng trọng số pretrained. Ảnh giao diện trong báo cáo dùng dữ liệu kiểm thử có kiểm soát; camera vật lý được kiểm tra ở lượt riêng.

## 5.11 Kết luận chương 5

Recall ở hai lớp ít mẫu vẫn thấp dù phần mềm đã được kiểm thử và có số đo độ trễ local. Nhóm còn cần xác minh quyền ảnh, scene independence, cài đặt trên máy mới và HTTPS. Camera laptop đã chạy thử local; việc đánh giá chất lượng theo lớp trong các điều kiện ánh sáng và khoảng cách khác nhau vẫn chưa hoàn tất.

# KẾT LUẬN

Nhóm đã xây dựng ứng dụng phân tích ảnh, video và webcam với giao diện Next.js, API FastAPI và mô hình SSDLite. Người dùng xem vùng phát hiện và trạng thái khẩu trang của từng khung hình, đồng thời có thể dừng để đọc lại kết quả. Camera laptop đã được chạy thử trên môi trường local. [5,13]

Fine-tune từ trọng số COCO giúp test macro F1 tăng từ 0,2061 lên 0,3240 và mAP50:95 tăng từ 0,0820 lên 0,1333 so với huấn luyện từ đầu. Mức cải thiện tổng hợp chưa khắc phục được chất lượng thấp ở các lớp ít mẫu. Tập test đã được sử dụng trước đó, vì vậy kết quả này là phép so sánh nội bộ trên tập dữ liệu hiện có. [2,12]

Confidence chưa được hiệu chuẩn thành xác suất đúng trong thực tế. Ngưỡng trình bày 0,15 giúp người dùng đọc kết quả, còn thí nghiệm fine-tune chọn ngưỡng đánh giá 0,25 trên validation. Mô hình chưa đủ cơ sở dùng cho cảnh báo tự động hoặc quyết định về con người. [10,12]

Hướng tiếp theo là rà soát các trường hợp bỏ sót và nhầm lớp, bổ sung dữ liệu đại diện cho lớp ít mẫu sau khi xác minh quyền sử dụng, rồi đánh giá trên tập kiểm thử độc lập. Phần mềm còn cần được nghiệm thu trên máy mới và các trình duyệt đích. Nhóm giữ ứng dụng trong phạm vi trình diễn kỹ thuật local cho đến khi các điều kiện này được giải quyết.

# TÀI LIỆU THAM KHẢO

[1] Nhóm đồ án. Dataset Card và curated audit. Snapshot kiểm thử tích hợp, 20/10/2026. Repo: https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/dataset-card.md. Nguồn audit lịch sử; quyền từng ảnh chưa xác minh.

[2] Nhóm đồ án. Model Card và huấn luyện từ đầu evaluation report. https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/model-card.md. Report JSON và quyết định validation được định danh trong danh mục evidence báo cáo.

[3] Nhóm đồ án. kiểm thử tích hợp regression report và PR #39. https://github.com/anhpd-glinteco/face-mask-detection/blob/88687c9/docs/regression-report.md. https://github.com/anhpd-glinteco/face-mask-detection/pull/39. CI snapshot được ghi ngày 20/10/2026.

[4] Nhóm đồ án. Kế hoạch, yêu cầu và use cases. https://github.com/anhpd-glinteco/face-mask-detection/tree/88687c9/docs/report. Tài liệu P1 là thiết kế mục tiêu; báo cáo này đối chiếu thêm triển khai kiểm thử tích hợp.

[5] Nhóm đồ án. Source web, inference và HTTP frame sampling ADR. https://github.com/anhpd-glinteco/face-mask-detection/tree/88687c9. Mã nguồn và quyết định kiến trúc của hệ thống.

[6] Liu, W. và cộng sự. SSD Single Shot MultiBox Detector. ECCV 2016, arXiv:1512.02325. https://arxiv.org/abs/1512.02325. Truy cập 20/10/2026. Dùng làm cơ sở detection, cơ sở phương pháp phát hiện đối tượng.

[7] TorchVision. ssdlite320_mobilenet_v3_large. https://docs.pytorch.org/vision/0.24/models/generated/torchvision.models.detection.ssdlite320_mobilenet_v3_large.html. Truy cập 20/10/2026. Thực nghiệm đồ án dùng 0.24.0; cấu hình trong repo là nguồn cho tham số đã chạy.

[8] Howard, A. và cộng sự. Searching for MobileNetV3. ICCV 2019, arXiv:1905.02244. https://arxiv.org/abs/1905.02244. Truy cập 20/10/2026. Cơ sở backbone, chưa có so sánh hiệu năng backbone trong đồ án.

[9] MDN Web Docs. MediaDevices getUserMedia. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia. Truy cập 20/10/2026. Tham khảo quyền camera và secure context.

[10] Nhóm đồ án. UI uncertainty presentation, PR #49, HEAD `a341b6bdc101b09d89fddb713d1158bdf28ab32f`; CI 5/5 SUCCESS. https://github.com/anhpd-glinteco/face-mask-detection/pull/49. Snapshot 21/10/2026. Ngưỡng 0,15 áp dụng ở lớp trình bày; API floor 0,001 và schema không đổi.

[11] PlantUML. Use case Diagram syntax and features. https://plantuml.com/use-case-diagram. Truy cập 01/11/2026.

Nguồn ảnh giao diện: dữ liệu kiểm thử có kiểm soát và media tổng hợp không khuôn mặt, chụp trên phiên bản frontend 84758d8 ngày 06/11/2026 để minh họa hành vi ngày 05/11. Ảnh chỉ minh họa giao diện, không phải phép đo chất lượng model hoặc camera vật lý. Nguồn sơ đồ: mã nguồn kiểm thử tích hợp và sơ đồ đã biên tập của nhóm. Không sử dụng ảnh dataset hoặc hình nhận diện người thật.

[12] Nhóm đồ án. Thí nghiệm SSDLite COCO fine-tune ngày 05/11/2026. https://github.com/anhpd-glinteco/face-mask-detection/pull/54. Model card ghi checkpoint, cấu hình và kết quả validation/test.

[13] Nhóm đồ án. Bản giao diện lọc detection và giữ snapshot ngày 05/11/2026. https://github.com/anhpd-glinteco/face-mask-detection/pull/55. Phiên bản mã nguồn được định danh trong file hướng dẫn chương trình.

# PHỤ LỤC A TÁI LẬP VÀ DANH MỤC MINH CHỨNG

Để tái lập, dùng môi trường đã cố định phiên bản, checkpoint đúng checksum và thư mục kết quả mới. Khi đo hiệu năng, không chạy đồng thời bộ kiểm thử hoặc build khác. Các lệnh đầy đủ, tham số --checkpoint/--sha256/--output và cách giải phóng tài nguyên được ghi trong regression report [3]. Nhóm chưa nghiệm thu cài đặt trên máy sạch.

<!-- table: Lệnh kiểm tra theo môi trường -->
| Thư mục và môi trường | Lệnh kiểm tra |
| --- | --- |
| apps/web, Node đã cài dependencies | npm test; npm run typecheck; npm run lint; npm run test:e2e |
| services/inference, venv inference | python -m pytest tests -v |
| Repo root, venv ML | python -m unittest discover -s ml/tests -v |
| Repo root, venv inference | python -m unittest discover -s scripts/benchmark -v |
| Repo root, Docker engine hoạt động | docker compose config --quiet |

<!-- table: Danh mục minh chứng thực nghiệm -->
| Evidence ID | Nguồn | Điều chứng minh |
| --- | --- | --- |
| E01 | P4 validation decision/report | Chọn ngưỡng trước test |
| E02 | P4 test/report.json | PR/F1/AP và confusion test |
| E03 | P11 run 3 api-summary.json | 5 cold, 100 warm |
| E04 | P11 run 3 browser-summary.json | Counts, duration, HTTP/display FPS |
| E05 | P11 memory.json, environment.json | Môi trường và sampled memory |
| E06 | P11 release logs và PR #39 CI | Kiểm thử phần mềm lịch sử |
| E07 | P12 dữ liệu kiểm thử có kiểm soát screenshots | Minh họa giao diện, không đo model |

# PHỤ LỤC B KIỂM THỬ CAMERA NGÀY 02/11/2026

Kịch bản kiểm thử trước đây dùng ảnh tổng hợp, video local pause/seek và webcam giả lập start/stop. Ngày 02/11/2026, nhóm bổ sung chạy camera tích hợp laptop USB2.0 HD UVC WebCam với checkpoint thật trên phiên bản PR #49. Camera trả hình 640×480, cấu hình nguồn 30 FPS, chạy liên tục 60,39 giây. Các bước từ chối rồi cấp lại quyền, dừng, bật lại và đổi chế độ đều đạt kiểm tra trạng thái track; chưa quan sát đèn camera hoặc thử ngắt thiết bị vật lý.

Lượt chạy bổ sung có 63 request webcam thành công, gồm cả thao tác bật lại sau khoảng đo liên tục. HTTP p50 là 258,96 ms, p95 là 1.390,75 ms; video smoke có p95 1.266,98 ms trên 5 request thành công. Cả hai p95 vượt mục tiêu 1.000 ms, nên kết quả nghiệm thu mới chỉ đạt một phần. Camera FPS là cấu hình nguồn, không phải FPS xử lý. Các yêu cầu bị hủy khi dừng được ghi riêng trong log. Không có ảnh hoặc video camera được lưu; các số đo P4/P11 trong chương 5 vẫn là kết quả lịch sử, không được thay bằng lượt đo này.

Ảnh và video tổng hợp đã kiểm tra đường browser đến checkpoint thật; video có lượt chạy riêng ít nhất 60 giây, cùng kiểm tra tạm dừng, tua và phát tiếp. Hồ sơ mới được lưu tại thư mục minh chứng local của lượt chạy ngày 02/11, gồm raw logs, acceptance-summary.json và kết quả từng lượt thất bại. Phạm vi sử dụng checkpoint vẫn là trình diễn nội bộ với giới hạn chất lượng đã nêu.
