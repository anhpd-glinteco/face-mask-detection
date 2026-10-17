# P<N> — <mục tiêu> — <YYYY-MM-DD, Asia/Saigon>

## Trạng thái

- Đạt / chưa đạt / bị chặn (chọn một); issue liên quan:
- Branch và base SHA:
- Commit/PR: chưa tạo thì ghi chưa tạo, không dùng base SHA làm commit kết quả.
- Đầu vào đã đọc và phụ thuộc đã xác minh:

## Kết quả và phạm vi thay đổi

- File/caller/test/fixture/config/export bị ảnh hưởng:
- API hoặc kiểu dữ liệu đổi; tương thích và rủi ro:
- Artifact, vị trí và SHA-256 (nếu có):
- Ruling: <quyết định khác kế hoạch> — <lý do> — <chi phí nếu sai>.

## Kiểm chứng

| Lệnh/kịch bản | Môi trường | Exit code/kết quả | Giới hạn |
|---|---|---|---|
| Chưa chạy | Chưa có | Chưa xác minh | Không suy ra pass từ việc có test |

## Còn lại và điểm bắt đầu tiếp

- Blocker, điều kiện giải quyết, issue còn thiếu DoD:
- Bước tiếp theo cụ thể (lệnh/file và kết quả mong đợi):
- Không lặp lại:
- Rollback: file/commit cần revert; tuyệt đối không xóa dữ liệu người dùng.
