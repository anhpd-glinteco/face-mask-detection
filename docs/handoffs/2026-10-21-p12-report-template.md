# P12 — chuyển báo cáo theo mẫu, 21/10/2026

Nhánh `docs/p12-report-template` từ P12 `d5126de`; PR draft nhắm
`docs/p12-report-slides`. Không merge/deploy. Issue #26 giữ mở.
Draft PR: https://github.com/anhpd-glinteco/face-mask-detection/pull/41.

## Artifact và nguồn

- `D:\Codex\outputs\face-mask-detection\p12-report-template\bao-cao-do-an.docx`
- `D:\Codex\outputs\face-mask-detection\p12-report-template\bao-cao-do-an.pdf`
- Nguồn: [p12-template](../report/p12-template/README.md), có lệnh tái tạo bằng Word.
- `manifest.json`: checksum, đối chiếu metric/TOC/parts; `verification`: receipts và QA.
- Bản mới 35 trang, 5 chương, 6 hình, 27 bảng; bìa có khung gốc, tách lời cảm ơn.
  Mục lục/danh mục tự động có số trang roman phần đầu và Arabic phần nội dung.

## Kiểm chứng

Microsoft Word 16 cập nhật 3 TOC và captions, rồi mở final DOCX read-only để xuất
PDF chốt. Raster toàn bộ 35 trang và kiểm tra trực quan từng trang: tiếng Việt,
khung bìa, bảng/hình/caption, số trang; không phát hiện clipping/overlap hoặc nội dung
UniLend. Bảng qua trang có lặp header; một số chương kết thúc ngắn do tách đầu chương.

Assert-based verifier đối chiếu từng heading/caption với trang PDF và cached list,
font/lề, P4 PR/F1/AP, P11 latency/FPS/duration, các giới hạn, relationship targets,
15 parts giữ nguyên từ mẫu và hash bốn deliverable P12 cũ. Mẫu gốc không đổi.
Liên kết tham khảo arXiv/TorchVision/MDN mở được; đường dẫn GitHub snapshot
`88687c9` đối chiếu tree. Không coi nguồn stable mới là phiên bản thực nghiệm.

## Giới hạn và việc còn lại

MSSV, khóa, đóng góp cá nhân chưa xác nhận; chưa có review độc lập. Quyền từng ảnh,
scene independence (562 ảnh unresolved), camera thật, setup độc lập, HTTPS và
rollback hosted chưa nghiệm thu. Baseline test macro F1 0,2061/mAP50:95 0,0820;
benchmark checkpoint thật chạy trên media synthetic. Deployment gate CLOSED.

Chỉ thay tài liệu và công cụ biên soạn; không chạy lại local product tests/benchmark,
không đổi API/code/dependencies/slides, không train. LibreOffice phân trang khác,
PDF Word là bản chốt; mở bằng renderer khác cần kiểm tra lại. AGENTS.md có thay đổi
sẵn của người dùng, được giữ nguyên và không commit. Trạng thái remote/CI chốt
được ghi trong `verification/final-state.json` ở output và comment issue #26.
