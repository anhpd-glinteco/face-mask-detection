# P12 — đồng bộ uncertainty, 24/10/2026

Nhánh `docs/p12-sync-uncertainty`, stacked trên `docs/p12-report-template`
(`699fcf5`). Issue #26, phụ trách cả nhóm. Phiên này hoàn thiện phần tài liệu
đang dở; không thay code sản phẩm, API, dependencies, model hoặc checkpoint.

## Kết quả

Output mới: `D:\Codex\outputs\face-mask-detection\p12-sync-uncertainty-2026-10-24`.
Giữ nguyên các bộ 20–22/10; không commit Office/PDF binaries hoặc weights/media dataset.

- DOCX/PDF 34 trang theo mẫu, 6 hình, 27 bảng, 81 mục danh mục cập nhật bằng Word.
- PPTX/PDF 14 slide, speaker notes 600 giây; bảng và chart/workbook vẫn editable.
- Ngưỡng UI `<0,15` chỉ đánh dấu/đếm “Chưa chắc chắn”, giữ nhãn và score;
  đúng `0,15` đạt ngưỡng. API floor `0,001`, contract ba lớp và số đo P4/P11 giữ nguyên.
- Khôi phục nội dung bài toán, kiểm thử P11 và demo bị thay nhầm trong diff đang dở;
  slide 11 hết lỗi vượt biên sau khi trả phần body về đúng hai dòng của nó.
- Sửa câu cũ “UI chưa áp ngưỡng”, mã tham khảo trùng và vị trí nguồn PR #49.

## Bằng chứng và giới hạn

Web phục vụ từ worktree PR #49 tại `a341b6bdc101b09d89fddb713d1158bdf28ab32f`,
không từ nhánh tài liệu chưa có code uncertainty. PR #49 vẫn draft/OPEN;
5 CI jobs SUCCESS được đọc lại ngày 24/10, không phải tests chạy mới trong P12.

Script fixture mới assert cả ba workspace: confidence `0,98 / 0,15 / 0,149`,
3 detection, 2 đạt ngưỡng, 1 chưa chắc chắn. Hai score cuối cùng đều làm tròn 15%
nhưng có trạng thái khác nhau. Media không khuôn mặt, response fixture;
11 requests trong lần chụp này, tất cả webcam tracks đã stop.
Không gọi API model hay camera thật; ảnh UI không là bằng chứng chất lượng detector.

PASS: Word rebuild/report verifier exit 0; giữ 15 parts mẫu và hashes bốn artifact
P12 lịch sử. Combined verifier `--template-report` exit 0 kiểm report manifest/hash,
metric gốc, 14 slide/notes, native chart/workbook, source refs và capture receipt.
Layout receipt có 0 findings, 0 warnings. Đã xem riêng đủ 34 trang Word PDF và
14 slide PowerPoint PNG: không clipping/chồng lấn ngoài ý muốn/glyph hỏng.

NONZERO: Node/Artifact Tool exit 1 sau dòng export. Không tính riêng bước này PASS;
chỉ chấp nhận file sau self-check độc lập và PowerPoint 16 mở read-only, xuất đủ
PDF/PNG. PowerPoint SaveAs PDF ban đầu lỗi khi dùng slash path; native Windows
backslash path thành công. Không save lại source PPTX bằng PowerPoint.

Receipts: `manifest.json`, `evidence-manifest.json`, `qa/slides-validation.json`,
`verification/visual-review.json`, `verification/build-status.json`, Word receipts
và `verification/powerpoint-export.json` trong output. Manifest tổng hợp có bản
trong repo: `docs/report/p12/sync-uncertainty-manifest.json`.

Đây là QA của phiên biên soạn, không phải review độc lập. Review ngày 21/10 chỉ
bao phủ báo cáo trước đồng bộ; không áp dụng kết luận đó cho nội dung mới/slide.
Issue #26 giữ OPEN: còn MSSV/khóa/đóng góp và review bản mới/slide.
NOT_RUN: toàn bộ suite sản phẩm, training/evaluation/benchmark lại, camera vật lý,
setup máy sạch, hosted HTTPS/rollback, P13. Deployment gate CLOSED.

## Kết phiên

Commit/push task-only và draft PR nhắm `docs/p12-report-template`; không merge/deploy.
Trạng thái PR/CI/issue cuối phiên ghi trong `verification/final-state.json` ở output.
Thay đổi có sẵn của `AGENTS.md` giữ nguyên, không stage; working tree task phải sạch.
Thông tin remote sau công bố được cập nhật ở đây trước khi kết thúc.
