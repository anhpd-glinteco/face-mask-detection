# P12 — báo cáo theo mẫu người dùng

## Bản đồng bộ mới — 24/10/2026

Đầu ra mới: `D:\Codex\outputs\face-mask-detection\p12-sync-uncertainty-2026-10-24`.
DOCX/PDF vẫn 34 trang, 6 hình, 27 bảng và 81 heading/caption/list entries đã refresh;
giữ 15 package parts của mẫu và hashes bốn artifact P12 cũ.
Ảnh mới lấy từ snapshot PR #49 chưa merge, có detection dưới 0,15 được giữ nhãn/score,
đánh dấu “Chưa chắc chắn” và đếm riêng; API floor 0,001 và metrics P4/P11 giữ nguyên.
Các ảnh chỉ là media synthetic/response fixture, không có camera thật.

Đã rebuild bằng Word, chạy verifier và xem đủ 34 trang mới. Review độc lập 21/10
bao phủ bản trước; bản đồng bộ này và 14 slide chưa có review độc lập.
MSSV/khóa/đóng góp giữ “Cần bổ sung”. Issue #26 OPEN, deployment gate CLOSED.
Hashes cùng slide và phạm vi kiểm chứng: [manifest mới](../p12/sync-uncertainty-manifest.json).

```powershell
./docs/report/p12-template/rebuild.ps1 -Output D:/Codex/outputs/face-mask-detection/p12-sync-uncertainty-2026-10-24 -Work D:/Codex/work/face-mask-detection/p12-sync-uncertainty-2026-10-24/report
```

Dùng thư mục mới cho lần tái tạo tiếp theo; hướng dẫn render bên dưới áp dụng
với output mới. Bộ 21/10 và P12 cũ không bị ghi đè.

## Bản trước đồng bộ — 21/10/2026

Bản DOCX/PDF sau rà soát gồm 34 trang (bìa + 6 trang đầu + 27 trang nội dung), 5 chương,
6 hình, 27 bảng. Mẫu chỉ quyết định hình thức; chức năng và tuyên bố của đề tài
trong mẫu không phải yêu cầu của hệ thống khẩu trang. Bản P12 cũ và 14 slide giữ nguyên.

Đầu ra hiện tại: `D:\Codex\outputs\face-mask-detection\p12-report-template-review\final`.
Bản 35 trang trước rà soát giữ tại `D:\Codex\outputs\face-mask-detection\p12-report-template`.
`manifest.json` ghi SHA-256 DOCX/PDF và kết quả đối chiếu; `qa/word-final` chứa 34
ảnh render từ PDF cuối. Nguồn và receipts có bản sao trong `source` và `verification`.

## Nguồn và giới hạn

- `bao-cao.md`: nội dung mới, dùng evidence P4/P11 và nguồn tham khảo đã ghi trong P12.
- Ảnh/sơ đồ dùng lại từ `../p12/assets`; `assets/usecases.png` từ
  `../diagrams/use-cases.svg`, được ghi nhãn thiết kế mục tiêu P1.
- Mẫu ngoài repo: `D:\Nhom1_TTCSN - Copy.docx`, SHA-256
  `7d8b433eefcb6c7d53484370d4e775b88daa60337595afa6ee13a72b7fddde5a`.
  Không sửa hoặc đưa bản mẫu đầy đủ vào Git.
- Giữ khung bìa gốc và 15 package parts ngoài phạm vi biên tập. Nội dung cũ,
  danh mục cũ và các ảnh không dùng được loại theo phạm vi chuyển mẫu.
- Thân bài A4/TNR13/1,5 dòng, lề trên 3 cm, ba lề 2,54 cm; bảng 11 pt và danh mục
  11 pt/đơn để giữ khả năng đọc trong giới hạn trang. URL dài trên 100 ký tự dùng
  8 pt để tránh tràn lề, giữ nguyên chuỗi URL. Heading 14 pt đậm theo mẫu.
- MSSV/khóa/đóng góp chưa xác nhận ghi “Cần bổ sung”. Chưa review độc lập.
  Chất lượng model thấp, quyền từng ảnh và scene independence chưa xác minh;
  deployment gate CLOSED. Không thay API/code sản phẩm/dependencies/slide.

## Tái tạo

Cần Python có python-docx/lxml/pypdf/pdf2image và Microsoft Word desktop.
Không thêm dependencies vào sản phẩm. Từ repo root:

```powershell
./docs/report/p12-template/rebuild.ps1 -Output D:/Codex/outputs/face-mask-detection/p12-report-template-review/final -Work D:/Codex/work/face-mask-detection/p12-template-review-build
```

Có thể truyền `-Reference`, `-Output`, `-Work`, `-Python` cho các đường dẫn khác.
Build mở mẫu gốc, biên tập đúng vùng, Word cập nhật ba TOC cùng SEQ captions,
khôi phục parts cần giữ, rồi Word mở read-only và xuất PDF cuối. Bước cuối kiểm tra
số trang PDF khớp receipt Word, 3 section, font/lề, từng vị trí heading/caption, số trang danh mục,
metric gốc, các relationship, hash mẫu và bốn deliverable P12 cũ.

```powershell
& 'C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' docs/report/p12-template/render_pages.py --output D:/Codex/outputs/face-mask-detection/p12-report-template-review/final --bin C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin
```

Kiểm tra trực quan tất cả ảnh sau mỗi lần biên tập. PDF Word là bản chốt số trang;
LibreOffice từng cho phân trang khác (33 thay vì 35 ở bản trước rà soát) nên không dùng để thay PDF này.
Máy khác/phiên bản Word khác có thể cần refresh fields và kiểm tra lại số trang.
Các câu lệnh phụ lục báo cáo là hướng dẫn tái lập sản phẩm; đợt này không chạy lại
test/benchmark sản phẩm và không train/merge/deploy.
