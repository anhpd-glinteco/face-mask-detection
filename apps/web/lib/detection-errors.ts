import { MAX_UPLOAD_BYTES, type DetectionApiError } from "./inference";

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function messageForError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as DetectionApiError).code;
    if (code === "FILE_TOO_LARGE") return `Ảnh vượt quá dung lượng tối đa ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    if (code === "UNSUPPORTED_TYPE") return "Định dạng không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG hoặc WebP.";
    if (code === "INVALID_IMAGE") return "Không thể đọc ảnh. File có thể bị hỏng hoặc không phải ảnh hợp lệ.";
    if (code === "NETWORK_ERROR") return "Không thể kết nối tới dịch vụ phân tích. Vui lòng kiểm tra kết nối và thử lại.";
    if (code === "INVALID_RESPONSE") return "Dữ liệu trả về từ dịch vụ không hợp lệ.";
    if (code === "TIMEOUT") return "Phân tích quá thời gian chờ 30 giây. Vui lòng thử lại.";
    if (code === "MODEL_NOT_READY") return "Mô hình chưa sẵn sàng. Vui lòng thử lại sau.";
    if (code === "SERVER_ERROR") return "Dịch vụ phân tích đang gặp sự cố. Vui lòng thử lại.";
  }
  return error instanceof Error ? error.message : "Không thể phân tích ảnh. Vui lòng thử lại.";
}
