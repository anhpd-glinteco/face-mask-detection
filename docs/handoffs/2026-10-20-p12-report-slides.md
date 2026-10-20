# P12 Báo cáo và slide để review

Ngày 20/10/2026, Asia/Saigon. Nhánh `docs/p12-report-slides`, base P11
`88687c935f8cfe94036fb81bd4fb924fadd04776`, PR nhắm `test/p11-internal-regression`.
Không đổi product code/API/dependencies/config, không train/merge/deploy.
Giữ thay đổi người dùng ở `AGENTS.md` ngoài commit; SHA-256
`b8cce059b0616eab2a249c7c2c15ac4b92939b1982183107a3848edc4e390a52`.

## Đầu ra

- Báo cáo tiếng Việt 27 trang, 5 chương, kết luận, 9 nguồn tham khảo và phụ lục.
- 14 slide chỉnh sửa được, native tables/chart và workbook data, notes có nguồn,
  tổng thời lượng gợi ý 600 giây.
- Bốn file `bao-cao-do-an.docx`, `bao-cao-do-an.pdf`, `slide-thuyet-trinh.pptx`,
  `slide-thuyet-trinh.pdf` tại `D:\Codex\outputs\face-mask-detection\p12-report-slides`.
- [Nguồn và tái tạo](../report/p12/README.md),
  [manifest và hashes](../report/p12/artifact-manifest.json).
  Nguồn gồm Markdown, JSON slide/notes, builders, assert self-check,
  sơ đồ SVG và snapshot UI synthetic không khuôn mặt.
- Output `evidence-manifest.json`, `evidence/`, `qa/` giữ bản số liệu nhỏ,
  raw path/hash, snapshot P11 remote, PNG và receipt; không có weights/dataset.

## Nội dung và nguồn

Đối chiếu requirements/use cases, cards, ADR, config, source adapter/sampler/
workspaces, P4 validation/test JSON, P11 run 3 API/browser/memory/environment.
P11 PR #39 HEAD `88687c9` có 5 checks SUCCESS khi chụp snapshot; vẫn draft/open.
Tham khảo trực tiếp SSD/MobileNetV3 papers, TorchVision và MDN camera.
TorchVision stable hiện 0.29 được ghi tách khỏi runtime 0.24.0 đã chạy.

Giữ macro F1 test 0,2061, mAP50:95 0,0820; warm p95 36,89 ms, cold p95
3.567,03 ms; video/webcam hiển thị 4,91/4,99 FPS. Khác biệt confidence 0,15
đánh giá với score floor API 0,001, `uncertain` chưa triển khai, minority recall
thấp, quyền/scene unverified và gate CLOSED đều có trong report/slide.
Ảnh giao diện dùng response fixture, không đại diện model đúng hoặc camera thật.

## Kiểm chứng

- `build_report.py`: exit 0. `render_docx.py` + LibreOffice: exit 0;
  PDF 27 trang, tiêu đề từng trang khớp source page delimiters/mục lục.
- `capture-fixtures.mjs`: exit 0; có request count và stop tracks assert.
  `render-diagrams.mjs`: exit 0.
- PPTX finalizer ghi package integrity pass, layout 0 findings, native chart/
  workbook và Artifact Tool re-import đạt; receipt hash khớp file cuối.
- LibreOffice xuất PPTX thành PDF 14 trang và rasterize PDF thành PNG: đạt.
  Đã xem từng slide cuối qua PDF, từng trang báo cáo qua PNG; sửa title border,
  kích thước ảnh, cột bảng, hash/reference alignment và render lại phần bị ảnh hưởng.
- `validate_p12.py`: exit 0, assert metric P4/P11 gốc, số trang/slide, notes,
  chart cached values/workbook, hash, fixture cleanup và local sources.
- Đây là QA của phiên tạo. Chưa review độc lập, chưa mở PowerPoint;
  không chạy lại product suites hoặc benchmark trong P12.

**Lỗi công cụ:** Node/Artifact Tool trên Windows exit `-1073740791`
(`0xC0000409`) sau khi xuất xong và ghi dòng hoàn tất. Không ghi builder exit 0;
đã kiểm file/receipt/hash và self-check Python độc lập exit 0 trước chấp nhận.
Log ở `D:\Codex\work\face-mask-detection\p12-build\slides-build-final.log`;
receipt trong output `qa/slides-validation.json`. Không sửa dependency/runtime.
Runtime/font/browser có sẵn trên C:, deliverables/build mới ở D:; lượt render đầu
dùng TEMP C: hệ thống, các lượt sau đặt TEMP/TMP ở D:.

## Còn thiếu và bước tiếp

#26 giữ OPEN: MSSV, khóa, đóng góp cá nhân, mẫu học phần nếu được cung cấp và
review phù hợp chưa hoàn tất. Không xác nhận đóng góp từ phân công kế hoạch.
#2/#3/#24/#25 giữ nguyên. Camera vật lý, chất lượng model, quyền ảnh,
setup độc lập và hosted deployment còn thiếu; gate CLOSED.

Bước kế P13: video ba luồng, rehearsal, fallback local và danh mục bàn giao.
Chưa coi P13 xong bằng kịch bản trong slide. Khi có thông tin nhóm hoặc review,
sửa nguồn rồi tái xuất, kiểm trang/slide và cập nhật hashes; giữ phiên bản trước.

## Remote và kết phiên

Draft [PR #40](https://github.com/anhpd-glinteco/face-mask-detection/pull/40)
nhắm `test/p11-internal-regression`. Commit nội dung `df5f248`; commit bổ sung
liên kết PR không thay artifact. Theo dõi CI tại HEAD cuối của PR, không lấy CI
P11 hoặc commit trước làm kết quả cho HEAD mới.

PR/CI/issue snapshots, remote HEAD equality, dirty state và port cleanup được
ghi ở `final-state.json` trong output sau push; đó là trạng thái thực tế cuối.
Working tree không sạch toàn bộ: dự kiến chỉ còn `AGENTS.md` của người dùng.
Không close #26, merge hoặc deploy. Rollback bằng revert commit P12,
không đụng thay đổi người dùng hoặc xóa artifact P4/P11.
