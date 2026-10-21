# Báo cáo cuối đồ án — bản làm việc

**21/10/2026:** [Bản báo cáo theo mẫu người dùng, 35 trang](p12-template/README.md)
được xuất riêng; bản P12 cũ và slide giữ nguyên. Chưa có review độc lập/nghiệm thu.

**Cập nhật P12, 20/10/2026:** đã có [báo cáo 27 trang và 14 slide để review](p12/README.md),
nguồn biên soạn, hướng dẫn tái tạo và danh mục evidence. Thông tin bìa/đóng góp
còn thiếu; chưa có review độc lập hoặc nghiệm thu. Các phần P1 bên dưới giữ lịch sử.

Đề tài: **XÂY DỰNG ỨNG DỤNG WEB PHÁT HIỆN TRẠNG THÁI ĐEO KHẨU TRANG**.
Đại học Công nghiệp Hà Nội — Trường Công nghệ thông tin và Truyền thông.
Đồ án chuyên ngành Kỹ thuật phần mềm; GVHD: ThS. Vũ Thị Dương; nhóm 1.
Thành viên: Phùng Đức Anh, Nguyễn Đình Luân Kiệt, Bùi Nguyên Hải,
Bùi Ngọc Minh Hoàng. Lớp học phần theo Sheet: `2026IT6150003`.
MSSV, khóa và thông tin bìa chưa có phải bổ sung trước xuất bản; không tự suy đoán.
Ảnh bìa là tham chiếu hình thức, bỏ dòng “Bài kiểm tra 1” cho báo cáo cuối.

Đây là **bộ tài liệu nguồn**, chưa phải báo cáo nghiệm thu. Không điền metrics,
ảnh kết quả hoặc đóng góp cá nhân bằng dữ liệu giả. Mỗi sơ đồ là thiết kế mục tiêu;
đối chiếu code ở P11/P12 trước khi gọi là kiến trúc đã triển khai.

## Đề cương và thời điểm viết

| Phần | Nội dung | Cập nhật từ phiên |
|---|---|---|
| Đầu báo cáo | Bìa, tóm tắt, mục lục, danh mục hình/bảng/từ viết tắt | P1, hoàn thiện P12 |
| Chương 1 — Tổng quan | Bài toán, người dùng, mục tiêu, phạm vi, khảo sát liên quan, lịch/phân công | P1–P2 |
| Chương 2 — Cơ sở lý thuyết và giải pháp | Detection, bbox/confidence, ba nhãn, metrics; lý do chọn model và HTTP sampling | P2–P4 |
| Chương 3 — Phân tích và thiết kế | FR/NFR, use case, kiến trúc, activity/sequence/state, contract, giao diện | P1, đối chiếu P6–P11 |
| Chương 4 — Xây dựng | Dataset/split/train/adapter, ba input, xử lý lỗi, cấu hình/triển khai, phiên bản | P2–P10 |
| Chương 5 — Kiểm thử và thực nghiệm | Test plan/report, ML theo lớp, benchmark, error analysis, đối chiếu mục tiêu | P4, P9–P11 |
| Kết luận | Đạt/chưa đạt, hạn chế và hướng phát triển | P11–P12 |
| Phụ lục | Hướng dẫn chạy, API, test cases, đóng góp, artifact và nguồn trích dẫn | Theo từng phiên |

Không thêm ERD/database/admin chỉ để tăng số sơ đồ. Tách thử nghiệm fixture/stub
khỏi kiểm chứng weights thật. Mọi kết luận định lượng dẫn tới raw data và môi trường.

## Tài liệu trong bộ nguồn

- [Yêu cầu và ma trận truy vết](requirements.md).
- [Đặc tả ba use case](use-cases.md).
- [Sơ đồ và hướng dẫn xuất](diagrams/README.md).
- [Bằng chứng cần thu thập](evidence.md).
- [Đề cương nội dung ban đầu](manuscript.md).

## Tham chiếu chuẩn đầu ra

[HaUI-SICT — chương trình Kỹ thuật phần mềm](https://sict.haui.edu.vn/vn/html/ky-thuat-phan-mem)
(tham khảo ngày 17/10/2026): SO2 giao tiếp, SO3 làm việc nhóm, SO4 trách nhiệm pháp lý/
đạo đức, SO5 thiết kế và phát triển, SO6 thử nghiệm/phân tích/báo cáo.
Đây là định hướng nội dung, không phải rubric học phần được GVHD xác nhận và không
thay thế mẫu bắt buộc nếu giảng viên cung cấp sau.

| Chuẩn đầu ra tham khảo | Minh chứng của đồ án |
|---|---|
| SO2 | Báo cáo, slide, video và thuyết trình |
| SO3 | Phân công dự kiến so với commit/PR/review và nhật ký thực tế |
| SO4 | Nguồn/license/consent, privacy, bias/limitations và mục đích sử dụng |
| SO5 | Yêu cầu, quyết định thiết kế, sơ đồ, contract và ba luồng chạy thật |
| SO6 | Test cases/results, split/metrics, benchmark và phân tích lỗi |

Xuất DOCX/PDF/slide ở P12 vào `D:\Codex\outputs\face-mask-detection`.
Chưa có mẫu nội dung bắt buộc, tạm dùng heading đánh số, caption/cross-reference,
trích dẫn đánh số và nguồn đầy đủ; không coi font/lề đề xuất là quy định của trường.
