# Kiến trúc đề xuất

Trạng thái: **Đề xuất, chưa triển khai**. Cập nhật: **22/10/2026**.

## Cấu trúc logic

```text
App shell + UI kit + theme
           |
Plugin host / capability bridge
           |
Mini-apps: UI + schema + commands + events
           |
Scoped data APIs + local persistence + background services
           |
Optional agent gateway (API/MCP) and optional external services
```

## Trách nhiệm của lõi

- Điều hướng, dashboard, panel, lệnh nhanh và tìm kiếm.
- Thành phần giao diện, tokens và theme; đề xuất thử 3 theme hoàn chỉnh trước.
- Cài/bật/tắt/gỡ plugin, tương thích phiên bản và rollback.
- Namespace dữ liệu, ID ổn định, schema/migration và file đính kèm.
- Hợp đồng liên kết/sự kiện, nhắc việc và thông báo.
- Quyền đọc/ghi/mạng/file, lịch sử thao tác và hoàn tác khi phù hợp.
- Backup local, phục hồi và xuất/nhập được tài liệu hóa.
- API/MCP để agent dùng đúng phạm vi dữ liệu đã cấp.
- Nạp module theo nhu cầu; job nặng có hàng đợi và khả năng hủy.

Các dịch vụ nền trên không được tính thành module chỉ để tăng danh mục.

## Dữ liệu và liên kết

- Mỗi mini-app sở hữu schema của mình; app khác không ghi thẳng vào bảng riêng.
- Tham chiếu chéo bằng ID/loại bản ghi, thao tác qua API có schema và quyền.
- Một phiên timer chỉ được lưu và tính một lần dù hiển thị ở nhiều app.
- Số tiền lưu chính xác theo đơn vị tiền tệ; phân biệt giao dịch thực với kế hoạch.
- Gỡ plugin có lựa chọn giữ/xuất dữ liệu; migration phải có phương án phục hồi.

## Các phương án kỹ thuật cần thử

Đề xuất PoC TypeScript + React, SQLite local và desktop shell; Windows là ứng viên
để dùng thử đầu tiên. Electron và Tauri là phương án cần đối chiếu bằng yêu cầu
runtime plugin, dịch vụ nền, bộ cài và tài nguyên. Chưa chọn framework hoặc tạo
`package.json`, dependency hay mã scaffold.

Đề xuất bắt đầu bằng một app desktop với plugin chính chủ. Không yêu cầu người
dùng phổ thông tự vận hành nhiều container. Mobile/web sẽ cần hồ sơ tính năng riêng.

## Giới hạn phải thiết kế rõ

- Manifest có quyền chưa đồng nghĩa runtime cô lập; guest không mặc định có Node,
  terminal, toàn bộ filesystem hoặc toàn bộ dữ liệu workspace.
- Agent đọc khác với agent ghi; thay đổi dữ liệu cần bản nháp, nguồn và lịch sử.
- Timer phải xử lý pause, sleep/resume, khởi động lại và qua ngày.
- Báo thức khi chạy nền khác với đánh thức máy đang ngủ hoặc máy đã tắt.
- AI/OCR cloud phải là tùy chọn có phạm vi dữ liệu và chi phí rõ ràng.

Các mục này là yêu cầu kiểm chứng, chưa phải bảo đảm an toàn hoặc độ tin cậy.
