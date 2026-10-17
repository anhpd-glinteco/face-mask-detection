# Dataset Card

Status: **bản curated pass audit kỹ thuật; chưa duyệt train/deploy hoặc scene independence** — P2, 17/10/2026.

## Nguồn, phiên bản và quyền sử dụng

- Dataset: [Face Mask Detection — Larxel/andrewmvd](https://www.kaggle.com/datasets/andrewmvd/face-mask-detection), version 1,
  phát hành 2020-05-22T07:18:42.22Z. Kaggle ID 667889; tải v1 bằng API công khai.
- Metadata gốc: [view API](https://www.kaggle.com/api/v1/datasets/view/andrewmvd/face-mask-detection)
  và [list API](https://www.kaggle.com/api/v1/datasets/list?search=face-mask-detection&user=andrewmvd).
  Bản chụp ở `D:\Codex\outputs\face-mask-detection\p2\kaggle-{view,list}.json`.
- Uploader công bố Public Domain; list API ghi `CC0: Public Domain`.
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) cho phép tái sử dụng
  quyền tác giả do người cấp từ bỏ, nhưng không loại bỏ quyền riêng tư/hình ảnh.
- Uploader dẫn nguồn MakeML: `https://makeml.app/datasets/mask`. Khi kiểm tra URL
  này hiện là trang domain rao bán, không xác minh được chuỗi quyền từ nguồn gốc.
  Không lấy license code của bản tải lại làm license ảnh.
- Consent từng người, tác giả từng ảnh, tuổi, địa lý và quy trình thu thập: **không
  được cung cấp/xác minh**. Không tuyên bố CC0 là bằng chứng consent.
- Quyết định: chỉ giữ bản cục bộ phục vụ audit trong phiên này. Quyền train và
  triển khai/phân phối cần nhóm xác nhận dựa trên provenance; chưa phê duyệt,
  không tự đóng #2. Nếu không làm rõ được, thay bằng nguồn có quyền dùng phù hợp.

Archive: `D:\Codex\downloads\face-mask-detection\p2\face-mask-detection-v1.zip`,
416,968,083 byte, SHA-256:
`cabae358a60492a1b96da0510c31475414b64100480ae52cadbe00753bbef904`.
Nguồn không cung cấp checksum đối chiếu; đây là fingerprint bản tải, không phải
chứng thực từ tác giả. Data giải nén ở `D:\Codex\work\face-mask-detection\p2\dataset-v1`.

## Annotation và thống kê đo thật

853 PNG + 853 Pascal VOC XML, tổng 4,072 bbox. Giữ tọa độ xyxy gốc; kiểm tra kích
thước ảnh khớp XML, số nguyên, `0 <= xmin < xmax <= width` và tương tự cho y.
Không suy ra VOC 1-based chuẩn nếu dữ liệu không ghi rõ; không clip/tự sửa.
Tên lớp `mask_weared_incorrect` được chuẩn hóa thành `mask_worn_incorrectly`.

| Tập | Ảnh | with_mask | without_mask | mask_worn_incorrectly |
|---|---:|---:|---:|---:|
| Gốc, chưa lọc | 853 | 3,232 | 717 | 123 |
| Train ứng viên | 606 | 2,128 | 539 | 93 |
| Validation ứng viên | 127 | 544 | 77 | 12 |
| Test ứng viên | 109 | 358 | 60 | 16 |

842 ảnh parse/validate thành công, tổng 3,827 bbox. **11 ảnh bị loại khỏi manifest
ứng viên do bbox x=401 vượt ảnh width=400**; giữ nguyên ảnh/XML nguồn để review.
Chi tiết filename/lỗi trong manifest và `ml/reports/p2-audit.json`.
5 cặp ảnh trùng pixel đều có annotation khác nhau: cần adjudication, không tự chọn
annotation. Không gọi manifest hiện tại là dữ liệu đã làm sạch.

## Chia tập và leakage

`ml/src/prepare_dataset.py`, seed 42; hash nhóm ra bucket 70/15/15 nên tỉ lệ thực
không bắt buộc chính xác. Nhóm là connected components của ảnh trùng pixel,
dHash 64 bit cách nhau <=4 bit (grayscale bilinear 9×8) và scene nếu có CSV.
Hiện 824 nhóm từ 842 ảnh: 806 nhóm đơn, 18 nhóm đôi. Các nhóm không cắt qua split.
Thứ tự file được sort; manifest có SHA-256 ảnh/XML/pixel và version Pillow.

Dataset không có mapping scene/video/nguồn ảnh đáng tin cậy. Coverage scene bằng 0;
hash/perceptual hash chỉ là heuristic, có thể bỏ sót crop, cùng người/cảnh khác góc
hoặc nhóm nhầm ảnh tương tự. Chưa xác nhận chống scene leakage theo DoD #3.
CSV review thủ công nếu có: cột `image,group`, ví dụ `images/example.png,scene-001`;
CSV không được chứa image không tồn tại, trùng dòng hoặc group rỗng.

Manifest là một JSON gồm `records` với `split`, `group`, objects/bbox/class và
`distribution`, lỗi, duplicate conflicts. Exit 0 chỉ khi kiểm tra kỹ thuật pass;
exit 2 vẫn xuất manifest ứng viên để review, **không được train**. Phê duyệt nguồn
và review scene là gate riêng, kể cả khi exit 0.

## Bias và điều kiện chuyển P3

Lớp đeo sai hiếm (123/4,072 bbox); validation ứng viên chỉ 12 bbox nên metric dễ dao
động. Phân bố tuổi/giới/địa lý/ánh sáng không có metadata, chưa định lượng bias.
Chưa review chất lượng nhãn bằng mắt toàn bộ, chưa có metric model.

Trước P3: giải quyết 11 annotation lỗi và 5 conflict; tạo bản dữ liệu đã review
riêng với change log/checksum, không sửa bản gốc; bổ sung scene grouping hoặc
quyết định có bằng chứng về giới hạn split; nhóm xác nhận quyền dùng; chạy audit
lại và pin checksum manifest được duyệt. Model/config: [ADR 0002](adr/0002-cpu-baseline.md).

Không commit dataset lớn hoặc hình ảnh khuôn mặt vào repository.

## Review tiếp P2 — curated v1, 17/10/2026

Các số liệu ở trên mô tả **bản gốc và manifest P2 ban đầu**, được giữ làm lịch sử.
Bản curated mới không thay thế hay chỉnh sửa dataset gốc.

- Rà 24 contact sheet của toàn bộ 853 ảnh; xem 21 overlay phóng lớn cho 11 ảnh
  vượt biên và 5 cặp duplicate conflict. Đây là scene triage của Codex, chưa có
  người review độc lập và không phải kiểm định toàn bộ annotation ở mức từng bbox.
- Sửa đúng **12 bbox trong 11 XML**, chỉ `xmax: 401 → 400` tại mép phải bị cắt
  trong ảnh width=400. Không chuyển hệ tọa độ VOC, không sửa nhãn hoặc clip hàng loạt.
- Loại **cả 10 ảnh của 5 cặp conflict** cùng XML tương ứng: overlay khác vị trí/
  độ rộng bbox nhưng không có annotation chuẩn để chọn. Loại 102 bbox; quyết định
  bảo thủ này có thể bỏ dữ liệu hữu ích. Các ảnh được giữ không thay byte ảnh.
- Có 843 ảnh, 3,970 bbox; 600 nhóm cuối sau union scene/pixel/dHash. Quyết định
  từng ảnh, hash nguồn, bbox trước/sau và cơ sở grouping ở
  [review đã pin](../ml/reviews/p2-curation.json),
  [CSV nhóm](../ml/reviews/p2-scene-groups.csv).

| Tập curated | Ảnh | with_mask | without_mask | mask_worn_incorrectly |
|---|---:|---:|---:|---:|
| Train | 670 | 2,358 | 594 | 93 |
| Validation | 98 | 479 | 72 | 14 |
| Test | 75 | 299 | 49 | 12 |

Giữ seed 42 và cách chia bucket cũ; không chỉnh nhóm/seed để ép tỷ lệ hay metric.
CSV gom 281/843 ảnh (33.3%) vào 38 nhóm: 23 nhóm cảnh trùng quan sát được,
12 nhóm cảnh ứng viên và 3 nhóm nguồn ứng viên. Có một nhóm home-photo-series
lớn, gom bảo thủ các chuỗi ảnh với bối cảnh/đạo cụ lặp lại; có thể over-group.
**562 ảnh còn unresolved**, không gán singleton rồi coi là độc lập. 16 nhóm review
cắt qua split ban đầu; ở manifest mới không nhóm review nào cắt qua split.
Không có metadata cảnh/nguồn đáng tin nên `scene_leakage_verified=false` vẫn giữ.

Hai lần audit curated exit 0 và manifest giống từng byte. Không còn bbox lỗi,
orphan, duplicate annotation conflict hoặc split thiếu lớp. Đã assert 0 vi phạm
cross-split cho exact pixel, dHash <=4 và các nhóm CSV. Kiểm tra 1,706 file nguồn
trước/sau khớp nhau **và khớp từng file trong archive đã pin**, không chỉ dựa vào
công cụ copy báo thành công. Báo cáo: [curated audit](../ml/reports/p2-curated-audit.json).

Artifact ngoài repo:

- Curated: `D:\Codex\work\face-mask-detection\p2\dataset-curated-v1`.
- Manifest, log hash trước/sau, scene-review CSV cho từng ảnh, contact sheets,
  overlay trước/sau và verification: `D:\Codex\outputs\face-mask-detection\p2-review`.
- Manifest SHA-256: `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3`.

**P2 chưa đạt gate train**: quyền dùng/provenance/consent vẫn chưa được duyệt;
contact sheets có ảnh mang watermark stock nên không được suy ra quyền dùng từ
CC0 của uploader. Cần nhóm review các nhóm ứng viên và 562 ảnh unresolved, có
bằng chứng hoặc quyết định được ghi rõ về giới hạn scene split; rà chất lượng nhãn
còn lại. Bản curated là ứng viên kỹ thuật, chưa phải manifest được duyệt cho P3.

