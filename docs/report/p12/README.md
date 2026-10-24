# P12 Báo cáo và slide để review

## Bộ đồng bộ uncertainty — 24/10/2026

Đầu ra mới: `D:\Codex\outputs\face-mask-detection\p12-sync-uncertainty-2026-10-24`:
`bao-cao-do-an.docx`, `bao-cao-do-an.pdf` (34 trang theo mẫu),
`slide-thuyet-trinh.pptx`, `slide-thuyet-trinh.pdf` (14 slide, notes 600 giây).
[Manifest mới](sync-uncertainty-manifest.json) ghi hashes và phạm vi kiểm chứng.
Bộ 20/10 bên dưới và manifest cũ giữ nguyên; `bao-cao.md` ở thư mục này là nguồn
27 trang lịch sử. Nguồn báo cáo hiện tại là `../p12-template/bao-cao.md`.

Ảnh `assets/` đã chụp lại từ worktree PR #49, SHA
`a341b6bdc101b09d89fddb713d1158bdf28ab32f` (PR còn draft, chưa merge).
Fixture có confidence 0,98 / 0,15 / 0,149: cả ba workspace giữ 3 detection,
đếm 2 đạt ngưỡng và 1 “Chưa chắc chắn”. Hai điểm cuối cùng đều hiển thị 15%,
nhưng so sánh ngưỡng trước làm tròn. Script assert nhãn/điểm, count và stop tracks;
không dùng model hoặc camera thật. Metrics P4/P11 và API floor 0,001 không đổi.

Tái tạo: chạy web từ đúng snapshot PR #49 trên port riêng (ví dụ 3212), rồi chạy
`capture-fixtures.mjs` với `P12_WEB_URL` trỏ tới web đó. Copy ảnh/capture receipt mới
vào `assets/` trước khi rebuild báo cáo theo `../p12-template/README.md`.
Resolve runtime bằng `load_workspace_dependencies`; đặt `P12_PRESENTATIONS_SKILL`
tới skill hiện tại khi chạy `build_slides.mjs`. Dùng output/work mới, không ghi đè
bộ lịch sử. Sau Word rebuild/verifier, slide finalizer và xuất PDF, chạy:

```powershell
& $runtimePython docs/report/p12/validate_p12.py --output $outputDir --template-report
```

`--template-report` đối chiếu report manifest đã được `verify_report.py` tạo,
hash DOCX/PDF, metrics, notes/chart và fixture receipts. Verifier cũng từ chối
layout warnings, bao gồm lỗi vượt biên slide 11 của bản đang dở.

Phiên này Node/Artifact Tool thoát 1 sau dòng export dù receipt hợp lệ; không ghi
bước đó là PASS. Self-check Python độc lập exit 0, PowerPoint 16 mở read-only,
xuất PDF và 14 PNG thành công. PowerPoint COM cần đường dẫn Windows có dấu `\`;
đường dẫn `/` từng làm SaveAs PDF lỗi. Không save lại PPTX bằng PowerPoint.
Đã xem từng trang Word PDF và từng slide PowerPoint; không có lỗi clipping,
chồng lấn hoặc glyph. Đây là QA của phiên biên soạn, chưa là review độc lập bản mới.

Issue #26 giữ OPEN: còn MSSV/khóa/đóng góp và review bản đồng bộ/slide.
Review ngày 21/10 chỉ bao phủ báo cáo trước đồng bộ; không chuyển kết luận đó
sang bản mới. P13, camera vật lý và hosted HTTPS/rollback chưa làm; gate CLOSED.

## Bộ lịch sử — 20/10/2026

Bộ ngày 20/10/2026: **27 trang DOCX/PDF, 14 slide PPTX/PDF**, speaker notes gợi ý
600 giây. Source sản phẩm được đối chiếu tại P11 `88687c9`; metric chất lượng P4,
benchmark P11 run 3 (`42a0f76`). Đây chưa phải bản nghiệm thu của giảng viên.
MSSV, khóa và đóng góp cá nhân ghi “Cần bổ sung”; chưa có review độc lập.

- [Nội dung báo cáo](bao-cao.md): 5 chương, kết luận, 9 tài liệu tham khảo và phụ lục.
- [Nội dung slide và notes](slides.json): có nguồn theo từng slide và thời lượng.
- [Danh mục artifact và SHA-256](artifact-manifest.json): đường dẫn gốc, bản evidence
  nhỏ đi kèm và hashes của bốn file bàn giao. Artifact riêng không mặc nhiên công khai.
- [Kiến trúc hiện tại](architecture-current.svg), [trình tự frame](sequence-current.svg):
  HTTP local đã kiểm chứng; không mô tả HTTPS như kết quả đã có.
- `assets/`: bản chụp synthetic đã dùng để xuất tài liệu; không có ảnh dataset.
  `capture.json` ghi nguồn fixture và kiểm tra tracks đã stop.

Đầu ra: `D:\Codex\outputs\face-mask-detection\p12-report-slides`.
File cuối là `bao-cao-do-an.docx`, `bao-cao-do-an.pdf`,
`slide-thuyet-trinh.pptx`, `slide-thuyet-trinh.pdf`; PNG/log/receipt trong `qa/`
chỉ phục vụ kiểm tra. Không commit binaries Office/PDF, dataset hoặc weights.

## Tái tạo từ nguồn

Không cần chạy ứng dụng nếu dùng lại `assets/` đã lưu. Resolve runtime bằng
Codex `load_workspace_dependencies`; dùng Python có python-docx/pypdf/pdf2image,
Node có `@oai/artifact-tool` và LibreOffice đã cài. Không cài thêm dependencies
vào product. Font chọn cho báo cáo là Times New Roman, slide là Arial;
heading Word có thể kế thừa font heading của template mặc định. Đây là lựa chọn
biên soạn, chưa phải quy định font/lề học phần.

Ví dụ PowerShell từ repo root, thay các đường dẫn runtime nếu bundle thay đổi:

```powershell
$runtimePython = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$runtimeNode = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$runtimePackages = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$outputDir = 'D:\Codex\outputs\face-mask-detection\p12-report-slides'
$buildDir = 'D:\Codex\work\face-mask-detection\p12-build'
$documentSkill = 'C:\Users\ASUS\.codex\plugins\cache\openai-primary-runtime\documents\26.1015.12040\skills\documents'
New-Item -ItemType Directory -Force "$outputDir\assets", $buildDir | Out-Null
Copy-Item docs/report/p12/assets/* "$outputDir\assets"
if (!(Test-Path "$buildDir\node_modules")) {
  New-Item -ItemType Junction -Path "$buildDir\node_modules" -Target $runtimePackages | Out-Null
}
& $runtimePython docs/report/p12/build_report.py --output "$outputDir\bao-cao-do-an.docx" --assets "$outputDir\assets"
& $runtimeNode docs/report/p12/build_slides.mjs $outputDir $buildDir
$env:PATH = 'C:\Program Files\LibreOffice\program;' + $env:PATH
$env:TEMP = $buildDir
$env:TMP = $buildDir
# Add the bundled override/fallback bins to PATH for pdfinfo/pdftoppm as needed.
& $runtimePython "$documentSkill\render_docx.py" "$outputDir\bao-cao-do-an.docx" --output_dir "$outputDir\qa\report" --emit_pdf
Copy-Item "$outputDir\qa\report\bao-cao-do-an.pdf" "$outputDir\bao-cao-do-an.pdf"
& 'C:\Program Files\LibreOffice\program\soffice.exe' "-env:UserInstallation=file:///D:/Codex/work/face-mask-detection/p12-build/lo-slide-profile" --headless --convert-to pdf --outdir $outputDir "$outputDir\slide-thuyet-trinh.pptx"
& $runtimePython docs/report/p12/validate_p12.py --output $outputDir
```

`validate_p12.py` yêu cầu các evidence P4/P11 gốc và snapshot
`p11-remote-snapshot.json` trong output; snapshot lịch sử được lưu cùng artifact.
Tạo snapshot bằng `gh pr view 39 --json url,headRefOid,isDraft,state,baseRefName,statusCheckRollup`.
Nếu PR thay HEAD, giữ snapshot lịch sử và xác minh thay đổi thay vì tự coi là cùng phiên.
Tái chạy self-check sẽ cập nhật timestamp manifest; không tự thay snapshot đã công bố.
Nội dung kiểm tra gồm metric gốc, tiêu đề từng trang PDF, số trang/slide,
speaker notes, native chart data/workbook và hash so với receipt finalizer.

**Lỗi môi trường đã quan sát:** Node/Artifact Tool trên Windows kết thúc với
`0xC0000409` sau dòng `Exported 14 editable slides...`, dù receipt ghi các kiểm tra
package/layout/chart/import đạt và file đã được copy. Không coi exit code này là
thành công. File bàn giao được chấp nhận sau self-check Python độc lập exit 0 và
render/kiểm tra từng slide qua LibreOffice; chưa mở trong PowerPoint. Nếu không có
file/receipt hợp lệ hoặc self-check fail thì phải dừng, không bỏ qua lỗi.
Đặt `P12_PRESENTATIONS_SKILL` và `P12_RUNTIME_PYTHON` khi runtime/skill đổi vị trí.

## Chụp lại hình nếu thay giao diện

Chỉ cần khi UI đổi; ảnh chụp lại có timestamp/frame khác nên hashes cũng đổi.
Build/start web bằng hướng dẫn hiện có, dùng port riêng còn trống (P12 dùng 3212).
`P12_WEB_URL` mặc định là `http://localhost:3212`.

```powershell
& $runtimeNode docs/report/p12/capture-fixtures.mjs "$outputDir\assets"
& $runtimeNode docs/report/p12/render-diagrams.mjs "$outputDir\assets"
```

Script chặn detect bằng fixture và thay getUserMedia bằng video không khuôn mặt;
không dùng API model hoặc mở camera thật. Assert đã có request và tracks kết thúc.
Giữ nhãn nguồn trên report/slide. Dừng đúng process web đã tạo sau khi chụp.

## Kết quả và phần còn thiếu

P12 đã render và kiểm tra từng trang báo cáo, từng slide PDF; các lần sửa layout
được render lại. Kiểm tra font/dấu, tràn chữ, bảng, hình, captions và mục lục;
đối chiếu metric qua assert với JSON gốc. Đây là QA của phiên tạo, không là review
độc lập. Product tests không chạy lại trong P12 vì không đổi product code.

Giữ issue #26 mở: còn bìa/đóng góp, mẫu học phần nếu có và review nội dung.
P13 video/rehearsal chưa làm. Camera vật lý, quyền dữ liệu, chất lượng baseline,
setup máy sạch và hosted HTTPS/rollback tiếp tục là giới hạn riêng; gate CLOSED.
