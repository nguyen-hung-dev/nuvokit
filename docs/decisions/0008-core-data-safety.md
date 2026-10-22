# 0008 — Dữ liệu lõi và kiểm chứng Windows trước mini-app

- Status: **Accepted**.
- Date: **2026-10-23**.
- Source: Chủ dự án yêu cầu triển khai bước kế tiếp sau đề xuất ưu tiên ổn định
  Windows và hoàn thiện dữ liệu lõi.

## Decision

- Tiếp tục kiến trúc Tauri/Rust + SQLite và UI React hiện có; thêm mục Dữ liệu trong
  Cài đặt. Chưa mở rộng mini-app, Store, macOS hoặc web storage thực.
- Backup `.nuvobak` là JSON có application/format/schema version, thời gian, dữ liệu
  lõi và SHA-256. Bao gồm toàn bộ theme và lịch sử tác vụ hiện có, không chỉ 20 mục
  đang hiển thị. Không kèm inventory phần cứng, WebView/cache hoặc gói có thể tải lại.
- Chọn file bằng hộp thoại native do host mở; frontend không nhận quyền filesystem
  hoặc truyền đường dẫn tùy ý. File không mã hóa; giao diện nêu rõ phạm vi backup.
- Restore gồm chọn/kiểm tra → xem trước → xác nhận. Host giữ bản đã kiểm tra bằng
  token dùng một lần. Chặn file sai app/hash/format/schema, dữ liệu lỗi hoặc quá
  giới hạn 16 MiB/100.000 lịch sử, trước khi thay dữ liệu đang dùng.
- Tạo bản phục hồi tự động trước restore và migration. Restore và thay đổi schema
  dùng transaction SQLite; lỗi không để lại dữ liệu nửa chừng. Schema 1 lên 2 giữ
  theme/lịch sử, bổ sung migration log, chỉ mục lịch sử và nhật ký bảo trì.
- Sao lưu/khôi phục/dọn tạm không chạy đồng thời với cài gói. Dọn chỉ file tạm do
  NuvoKit quản lý, không xóa DB, bản phục hồi, gói hoàn chỉnh hoặc cache WebView đang dùng.
- QA cài/nâng cấp/gỡ dùng fixture/Sandbox riêng, kết quả có định danh phiên chạy.
  Không gỡ app thật, xóa runtime hệ thống hoặc dữ liệu thật của chủ dự án.
- Chỉ đánh dấu Windows sạch đạt khi nhận được báo cáo từ guest; có script hoặc
  cửa sổ Sandbox không được coi là bằng chứng chạy thành công.

Chi tiết hợp đồng ở [đặc tả dữ liệu](../specs/core-data.md).
