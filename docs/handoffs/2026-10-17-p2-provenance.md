# P2 tiếp — Provenance và metadata — 17/10/2026

## Kết quả

**Đã hoàn tất lượt tra cứu; chưa đạt gate P2/train.** Nhánh
`codex/p2-data-baseline`, HEAD đầu phiên `1f79004`, working tree đầu phiên sạch.
PR #28 OPEN, CI web/inference SUCCESS ở SHA đó khi kiểm tra đầu phiên. Thay đổi
phiên này chỉ là tài liệu; chưa commit/push, không merge hoặc sửa/đóng issue.

Khôi phục được trang MakeML, bổ sung bằng chứng công bố của nguồn được Kaggle
dẫn, không phải xác nhận quyền sở hữu từng ảnh. Không có bằng chứng mới đủ để
đổi nhóm cảnh. Chi tiết nguồn và phân biệt PDM/CC0 trong
[dataset card](../dataset-card.md#xác-minh-provenance-và-metadata--17102026).

## Bằng chứng và cách kiểm tra

Thư mục: `D:\Codex\outputs\face-mask-detection\p2-provenance`.

| Artifact | Kết quả / giới hạn |
|---|---|
| `source-fetches.json`, `*.body` | URL, thời điểm UTC, HTTP status, SHA-256, raw responses Kaggle/MakeML/CDX/CC0; truy cập 17/10/2026 Asia/Saigon |
| `archive-fetches.json`, `makeml-{2020,2022}.body` | Hai replay `id_` HTTP 200, HTML cùng hash; chỉ khôi phục trang, không xác minh nội dung ZIP gốc |
| `supplemental-fetches.json`, `pdm.body` | PDM deed HTTP 200; HEAD link ZIP MakeML HTTP 404, không tải ZIP |
| `archive-inventory.json` | ZIP Kaggle 1,706 file PNG/XML, không sidecar; hash archive khớp dataset card |
| `per-image-metadata-review.json`, `exif-values.json` | Kiểm tra 853 ảnh; đọc cả EXIF sub-IFD, không tìm mapping source/scene; EXIF chỉ kích thước/ColorSpace |
| `group-metadata-review.json` | 38 nhóm đối chiếu evidence mới, giữ nguyên, không nâng thành verified; 562 retained unresolved vẫn unresolved |
| `input-checksums.json`, `verification.json`, `artifact-checksums.json` | Hash đầu vào giữ nguyên, đối chiếu coverage và quyết định; manifest/split không đổi |
| `inspect_provenance.py` | Script kiểm tra metadata/inventory với assert coverage; dùng Python/Pillow trong venv P0, không thêm dependency |
| `verify_provenance.py` | Assert coverage, EXIF fields, archive/input/manifest hashes; tạo quyết định từng nhóm và checksum artifact |

Web reader không mở được replay Wayback; urllib tải raw replay thành công.
Availability API trả rỗng ở ngày mục tiêu nhưng CDX có captures, nên đã dùng CDX
và đọc HTML trực tiếp. Chỉ mục CDX có các mốc 2020/2021/2022/2024/2025; phiên này
đọc hai capture 2020/2022. Không lấy bài viết/bản tải lại làm nguồn cấp quyền.

Không có per-image source URL, author, consent, timestamp, camera hoặc video ID
trong các trường metadata đã đọc. ICC/sRGB, EXIF kích thước và ZIP timestamps
không được coi là mapping cảnh. Việc review ở phiên này là đối chiếu metadata và
hồ sơ review cũ; không tuyên bố visual review mới hoặc kiểm định từng bbox.

Script metadata đầu tiên gặp lỗi Counter khi nhận mapping giá trị chuỗi; đã sửa
để đếm keys và chạy lại exit 0. Sau đó đọc EXIF sub-IFD và bổ sung kiểm tra cuối;
không dùng lần lỗi làm bằng chứng hoàn tất. Raw network responses được giữ lại.

## Kiểm chứng và phạm vi

- Assert coverage: 853 ảnh, 843 retained, 281 ảnh trong 38 nhóm, 562 unresolved.
- SHA-256 archive Kaggle khớp `cabae358a60492a1b96da0510c31475414b64100480ae52cadbe00753bbef904`.
- CSV nhóm và review curation giữ nguyên hash; không đổi ảnh/XML hoặc split.
- Không chạy lại 12 ML tests/audit hai lần vì không đổi logic hoặc đầu vào audit;
  kết quả 12 tests/audit cũ vẫn thuộc phiên curated, không gán thành test phiên này.
- Chỉ đổi dataset card, evidence và bàn giao/chỉ mục; API/callers/tests/fixtures/
  config/exports không bị tác động. Kiểm tra whitespace và link local ở cuối phiên.
- Kiểm tra cuối: cả hai script exit 0; `git -c core.whitespace=cr-at-eol diff --check`
  pass, 20 link file local tồn tại. Các lệnh Python dùng
  `D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe` với hai script
  trong thư mục artifact; `inspect_provenance.py` dùng lại raw fetch đã lưu khi có.
- Không liên hệ tác giả, không gửi media đến reverse-image search, không train,
  thay dataset, cập nhật Sheet/GitHub, commit/push hoặc đóng issue.

## Blocker và bước tiếp

1. #2 — Kiệt/Hải cần xác nhận phạm vi train/deploy dựa trên bằng chứng nguồn,
   xử lý khoảng trống quyền từng ảnh/consent, đặc biệt watermark stock đã ghi ở
   phiên trước. PDM trên MakeML và CC0 trên Kaggle chưa tự giải quyết khoảng trống.
   Có thể cung cấp bằng chứng bổ sung từ nguồn/chủ sở hữu; không có thì đề xuất
   thay nguồn riêng, chưa tự thay trong phiên này.
2. #3 — Nhóm cần nguồn/metadata bổ sung và review độc lập 38 nhóm (đặc biệt
   candidate/home-photo-series) cùng 562 unresolved, hoặc quyết định có bằng
   chứng về giới hạn split. Không gán singleton rồi tuyên bố scene independence.
3. Giữ `scene_leakage_verified=false`, `p3_ready=false`. Chỉ pin manifest được
   duyệt và chuyển P3 sau khi có quyết định nhóm cùng bằng chứng đáp ứng gate.

Không làm lại curation, tải lại Kaggle hoặc quét lại cùng metadata nếu không có
dữ kiện mới. Artifact có thể chứa metadata/hồ sơ ảnh, giữ ngoài Git; repo chỉ
chứa kết luận và đường dẫn. Hoàn tác phiên này bằng revert các thay đổi tài liệu,
không xóa dataset hoặc output của người dùng.
