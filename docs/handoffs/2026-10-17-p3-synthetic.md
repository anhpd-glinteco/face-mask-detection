# Chuẩn bị trainer synthetic — 17/10/2026

## Kết quả và giới hạn

Đã triển khai phần lõi trainer, checkpoint/resume và kiểm thử synthetic theo yêu
cầu. **Baseline dữ liệu thật chưa train; P2 và P3 vẫn chưa đạt gate.** Không đọc
dataset khuôn mặt, không đổi quyền dùng, scene groups, manifest, class map hoặc
`ml/configs/baseline.json`. Không chọn checkpoint theo mAP hay tích hợp inference.

Nhánh `codex/synthetic-trainer`, tạo từ `3d76452fc29276eee1d04fdfd9aad271d3396798`;
working tree đầu phiên sạch. Tại cuối lượt triển khai ban đầu, thay đổi chưa
commit/push hoặc cập nhật issue/Sheet. SHA trong checkpoint là base commit; trainer source SHA-256 ghi riêng
để nhận diện mã chưa commit đã chạy.

## Thay đổi

- `ml/src/train.py`: CLI chỉ nhận synthetic smoke, config/output/resume. Scratch
  SSDLite320, CPU batch 2, SGD/StepLR theo config; không tải pretrained weights.
- Checkpoint cuối epoch có model/optimizer/scheduler/RNG Python/NumPy/Torch,
  config/hash, code SHA/source hash, runtime, synthetic identity, loss/time.
  Ghi tạm rồi replace; từ chối config/data/runtime không khớp. Epoch dở chạy lại.
- `ml/tests/test_train.py`: 9 tests gồm detector thật trên ảnh synthetic, resume
  qua gián đoạn, CLI từ chối dữ liệu thật và các failure paths.
- `ml/requirements.txt`: dependencies CPU riêng. Job CI ML chạy toàn bộ ML tests;
  job inference giữ 12 dataset tests bằng pattern `test_*dataset.py`, không kéo Torch.
- README ML bổ sung setup, smoke/resume và phân biệt synthetic với baseline thật.
  Web/API/backend dependencies/fixtures/exports không đổi.

## Môi trường và bằng chứng

Python 3.12.14 tại `D:\Codex\work\python`, venv
`D:\Codex\work\face-mask-detection\p3-venv`, uv cache tại
`D:\Codex\work\uv-cache`. Torch 2.9.0+cpu, TorchVision 0.24.0+cpu,
NumPy 2.3.3, Pillow 11.3.0; Windows CPU. Không cài ML vào backend/P0 venv.

| Check | Lệnh / kết quả |
|---|---|
| Dependencies | `uv pip check --python D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe`: exit 0, 13 packages compatible |
| ML suite | Python venv P3 `-m unittest discover -s ml/tests -v`: exit 0, 21 tests pass, gồm 12 dataset + 9 trainer; 11.874 s |
| Audit-only discovery | Python venv P0 `-m unittest discover -s ml/tests -p "test_*dataset.py" -v`: exit 0, 12 tests pass, không cần Torch |
| CLI smoke | Python venv P3 `ml/src/train.py --synthetic-smoke --output D:\Codex\outputs\face-mask-detection\p3-synthetic\smoke-v1`: exit 0 |
| CLI resume | Cùng output, thêm `--resume ...\smoke-v1\checkpoint.pt`: exit 0, checkpoint hash không đổi; đây là load/resume smoke đã hoàn tất, không phải epoch mới |

CLI dùng `OMP_NUM_THREADS=2`, `MKL_NUM_THREADS=2`. Smoke thực hiện 5 train batches
và 2 inference batches, batch 2. Epoch ghi 1.398 s (không gồm khởi động/import);
đây không phải benchmark ảnh thật hoặc bằng chứng accuracy. Kiểm tra finite
loss/gradient/parameters và thay đổi parameters chạy trong trainer; inference
kiểm tra bbox về ảnh gốc và nhãn/score hợp lệ.

Artifact ngoài Git:
`D:\Codex\outputs\face-mask-detection\p3-synthetic\smoke-v1`:

- `checkpoint.pt`: synthetic-only, next_epoch=1;
  SHA-256 `acc2a9b897f1f617709e20fd2a303f4a50b27a4b985257b51e692b951e11d692`.
- `synthetic-report.json`: loss từng batch, epoch time, runtime/provenance,
  checksum checkpoint, `p3_ready=false` và limitations.

Trainer SHA-256 đã chạy:
`4c5e83de58cd419c05655c150d2c63e238e51d6e880302d8e30d21130f67c18b`.
`git -c core.whitespace=cr-at-eol diff --check` exit 0; kiểm tra thêm whitespace
và link Markdown local trên cả 7 file thay đổi/thêm đều pass.

Unit test resume dùng model nhỏ: chạy hai epoch liên tục so với gián đoạn giữa
epoch hai rồi khôi phục checkpoint epoch một; so sánh weights, momentum, scheduler,
learning rate, loss và ba RNG states. Không lấy test này làm bằng chứng hai epoch
SSDLite thật hoặc notebook/cloud/GPU đã kiểm chứng.

## Bước tiếp

Hoàn tất quyền dùng ảnh và scene/source grouping P2 như bàn giao provenance.
Sau gate mới mở đường dữ liệu thật, smoke train trên manifest được duyệt và
baseline, rồi validation mAP/checkpoint selection ở P4. Không thêm cờ bỏ qua gate.

Tại cuối lượt triển khai ban đầu chưa chạy GitHub Actions trên Linux, train dữ
liệu thật, GPU, mAP, web/backend regression hoặc deploy. Synthetic smoke chỉ kiểm
chứng pipeline; các mục dữ liệu chưa xác minh ở #2/#3 vẫn còn trước khi train thật.
Đây là trạng thái bằng chứng dữ liệu, không phải thiếu quyền thao tác repo; người
dùng đã cho phép push, tạo PR và đóng các task đã đủ đầu ra. Kiến trúc/config #7
đã có ADR, config và smoke model thật; phần synthetic của #8 đã hoàn thành, còn
dataset adapter/baseline weights dữ liệu thật chưa thực hiện.
