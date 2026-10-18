# Face Mask Detection

Ứng dụng Computer Vision phát hiện trạng thái đeo khẩu trang từ ảnh, video tải lên và webcam. Đây là dự án học tập của nhóm 4 sinh viên; hệ thống không nhận diện danh tính và không được dùng để xử phạt hoặc đưa ra quyết định tự động về con người.

## MVP

- Ảnh tải lên, video tải lên và webcam.
- Bounding box, nhãn và confidence.
- Ba lớp: `with_mask`, `without_mask`, `mask_worn_incorrectly`.
- `uncertain` được suy ra từ confidence threshold, không phải lớp train.
- Thống kê theo frame; không tài khoản, database hoặc lịch sử.
- Không lưu ảnh/video và không ghi media vào log.

## Architecture

`Browser media → Next.js frame sampling → FastAPI → preprocessing → detector → JSON detections → Canvas/statistics`

Video và webcam dùng HTTP frame sampling có backpressure. MVP không upload toàn bộ video và không dùng WebSocket.

## Tech stack

- Next.js, TypeScript, Tailwind CSS, Canvas 2D.
- Python, FastAPI, Pydantic, Pillow/OpenCV.
- PyTorch + SSDLite320 MobileNetV3: baseline nội bộ đã train/đánh giá; chất lượng thấp, quyền ảnh/scene chưa xác minh. Xem [model card](docs/model-card.md).
- Vitest/React Testing Library, Pytest và Playwright.
- GitHub Actions, Docker Compose và Vercel.

## Repository structure

```text
apps/web                 Next.js frontend
services/inference       FastAPI inference service
ml                       Training, evaluation and reports
packages/contracts       Shared JSON/OpenAPI contracts
tests/fixtures           Fixed regression fixtures
docs                     ADRs, dataset/model cards and test plan
```

## Local development

### Frontend

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

### Inference API

```bash
cd services/inference
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Hoặc chạy cả hai service:

```bash
docker compose up --build
```

Compose builds the browser API URL (`http://localhost:8000`) into the web bundle;
changing it requires rebuilding the web image. Open web at `http://localhost:3000`.
No weights are included: health returns 200 while readiness/detection return 503.
Web startup health does not certify model readiness. See the reproducible
[browser and Compose checks](apps/web/e2e/README.md), including teardown and CI evidence.

## API contract

- `POST /api/v1/detect`: nhận một ảnh qua multipart field `image`.
- `GET /api/v1/health`: process health.
- `GET /api/v1/ready`: model readiness.

Schema chuẩn nằm tại `packages/contracts/detection.schema.json`. API có adapter SSDLite CPU;
chưa cấu hình weights hợp lệ thì `/ready` và detect ảnh hợp lệ trả **503**.
`/health` vẫn trả 200. Không còn fallback stub. Xem [cấu hình inference](services/inference/README.md).

## Training and evaluation

- Ghi nguồn, phiên bản và license dataset trong `docs/dataset-card.md`.
- Chia train/validation/test theo video hoặc scene; không chia ngẫu nhiên các frame cùng video.
- Lưu config, seed, code version, weight checksum và metric đo thật.
- Báo cáo precision, recall, F1, mAP/confusion matrix phù hợp và error analysis.
- Không tuyên bố chỉ số chưa được đo.

## Team

- Người 1: Frontend — Next.js.
- Người 2: ML/Data.
- Người 3: Backend/Inference.
- Người 4: Integration/QA/DevOps & Documentation.

## Git workflow

`main` được bảo vệ. Dùng branch `feat/...`, `fix/...`, `docs/...`, `test/...`; PR nhỏ, ít nhất một reviewer, CI bắt buộc và squash merge.

## Milestones

Kế hoạch theo phiên đến 27/10/2026: [docs/plan.md](docs/plan.md).
Trước khi tiếp tục công việc, đọc [bàn giao gần nhất](docs/handoffs/README.md).
Bộ [yêu cầu, use case và báo cáo nguồn](docs/report/README.md) phân biệt thiết kế
mục tiêu với tính năng đã kiểm chứng; không coi sơ đồ là bằng chứng hoàn thành.

- Sprint 1: scope, contract, dataset và baseline/mocks.
- Sprint 2: model, API, ba input flow và integration.
- Sprint 3: deploy, benchmark, QA, docs và demo.

## Deployment

Web và inference được thử deploy thành hai Vercel projects từ cùng monorepo. Nếu inference không đạt performance budget, chỉ backend model được chuyển sang container host; API contract giữ nguyên.

## Privacy and responsible use

- Không nhận diện hoặc lưu danh tính.
- Không lưu upload trong MVP.
- Chỉ dùng dữ liệu có quyền sử dụng và consent phù hợp.
- Kết quả có thể sai do ánh sáng, góc, che khuất, domain shift và confidence threshold.
- Không dùng cho giám sát cưỡng chế hay quyết định ảnh hưởng tới cá nhân.

## Licenses

- Repository license: `TBD`.
- Dataset license: `TBD`.
- Model/code license: `TBD`.
- Pretrained weights license: `TBD`.

