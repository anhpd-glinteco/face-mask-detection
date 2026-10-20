# P11 — regression và tài liệu nội bộ — 20/10/2026, Asia/Saigon

## Trạng thái và phạm vi

Nhánh `test/p11-internal-regression`, base P10
`cd87d1d0fc972df9e2e16d94e9113c011b35ce02`. Deployment gate **CLOSED**;
không merge/deploy, train lại hoặc phát hành weights/media. #24/#25 giữ mở vì
chưa đạt toàn bộ nghiệm thu. Xem [regression report](../regression-report.md).

Đã đọc plan, handoff P10, test plan, README/cards, workflow CI và DoD #24/#25.
P11 giữ thay đổi người dùng trong `AGENTS.md` ngoài commit; working tree cuối
phiên được phép còn đúng file này, không tuyên bố sạch toàn bộ.

## Kết quả

- Sửa race ở `VideoWorkspace`: media tạm chưa sẵn sàng trước seeking event phải
  dừng/hủy generation hiện tại, giải phóng snapshot và chờ playing/seeked, không
  đi vào lỗi khóa retry. Shared sampler, webcam và lỗi API/decode thật giữ nguyên.
- Thêm một unit test tái hiện: fail trên code cũ rồi pass sau fix. Tất cả callers
  là trang Home và test component; không đổi API, type public, export hoặc config.
- Benchmark lưu media state/UI alerts và guard không có display mới trong 5 giây.
  Run 1 giữ nguyên dù `complete=true` nhưng video dừng sau 40 frame. Run 2 fail
  đúng với guard và bắt được lỗi UI trong khi playback vẫn chạy. Không bỏ các
  failed runs hoặc dùng số đo P10 cũ thay kết quả mới.
- README/cards sửa mô tả stub/hosting/threshold cũ, phân biệt trạng thái lịch sử
  P2 với quyết định thí nghiệm nội bộ. Thêm regression report và liên kết test plan.

## Kiểm chứng và artifact

Evidence root: `D:\Codex\outputs\face-mask-detection\p11-internal-regression`;
commands/cwd/timestamps/exit codes nằm trong từng JSON cùng log. Scripts điều phối
ngoài repo nằm trong `D:\Codex\work\face-mask-detection\p11-*`.

- Backend 24 pytest tests, ML 37 tests, benchmark self-check 3 tests: exit 0.
- Frontend sau fix: 81 tests/6 files đạt; typecheck/lint và production browser
  desktop/mobile được ghi theo từng lượt `*-release` trong regression report.
- Native missing-model browser smoke: health/web 200, ready/detect 503, CORS và
  thông báo UI đạt. Tái dùng test có tên Compose trên native processes; không
  coi đây là container smoke.
- Compose config exit 0, nhưng Docker info/startup exit 1: engine pipe không có.
  Không tạo được container, không chạy local container smoke hoặc xóa volume.
- Dùng lại môi trường cài sẵn. Inference pip check đạt; ML venv không có pip,
  nên package integrity qua pip chưa kiểm chứng, không tự thêm dependency.
- Checkpoint giữ nguyên SHA-256
  `1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
  Không đo lại chất lượng test split; nguồn media regression là synthetic.
- Final real-model run `real-model-run-3`, code `42a0f76`, exit 0: cold p95
  3,567.03 ms (5/5), warm p95 36.89 ms (100/100); video 296 frames/60.31 s
  (4.91 displayed FPS), webcam 302 responses/301 displays trong 60.37 s
  (4.99 displayed FPS). Không có UI alert/page error/unexpected HTTP failure;
  một video stop abort được giữ riêng. Memory tree API/web 356.83/102.09 MiB;
  JS heap 7.96 MiB, không phải tổng browser memory.
- Fault-injection guard self-check đạt: pause video có chủ đích làm benchmark
  exit 1 với đúng lỗi stalled; driver assert và exit 0. Đây là kiểm thử fail-path,
  tách khỏi run hiệu năng. Chromium 156.0.8078.4; 52 local doc links hợp lệ.

## Việc còn lại và rollback

#24 còn thiếu preview/camera nghiệm thu; #25 còn setup độc lập, license chưa
chốt và deployment evidence. #2/#3, `p3_ready=false` giữ nguyên. Chưa có review
độc lập, camera vật lý, Firefox/WebKit, HTTPS công khai hoặc hosted rollback.
Browser binaries dùng cache C: có sẵn; deliverables/logs mới ở D:.

Bước tiếp: P12 báo cáo/slide có thể dùng evidence hiện có và các giới hạn rõ ràng.
Để nghiệm thu rộng hơn, khôi phục Docker engine rồi chạy Compose smoke theo E2E
README; giải quyết dữ liệu/model trước public preview. Không lặp audit provenance,
thay split, tuning trên test hoặc chạy train chỉ để làm đẹp tiến độ.

Rollback bằng revert commit P11 của video/test/benchmark/docs; giữ P10/P4 và
mọi artifact người dùng. Chỉ dừng process do phiên tạo; không đụng dịch vụ khác.
Remote HEAD, draft PR/base, CI và issue states cuối phiên lưu tại evidence root
trong `final-state.json`; trạng thái cuối cùng được bổ sung sau khi push.
