# 0010 — Đồng hồ tích hợp sẵn, ba bố cục và dữ liệu bền vững

Trạng thái: **Accepted — 23/10/2026**. Chủ dự án duyệt cả ba mockup Đồng hồ
và yêu cầu code, có cài đặt để chuyển giao diện.

- Một Đồng hồ, ba bố cục `minimal` / `session` / `digital`, độc lập với chế độ
  Tập trung / Đếm ngược / Bấm giờ. Theme riêng `app` / `light` / `dark`.
  Đổi bố cục/theme không đặt lại ID, mốc thời gian hoặc thời lượng của phiên.
- Source chính chủ ở `plugins/clock/`, được bundle cùng app bằng workspace.
  Đây là module tin cậy có sẵn, chưa phải gói khách tải qua SDK/guest loader.
  Không mở API tùy ý cho plugin bên ngoài, SQL hoặc shell.
- Nghiệp vụ/thời gian và DTO ở `packages/core/src/clock.ts`; React dùng
  `ClockRepository`, desktop gọi command riêng `get_clock` / `save_clock`.
  SQLite schema 3 lưu state có revision và lịch sử riêng; browser dùng IndexedDB.
- Ghi state và phiên hoàn tất trong cùng transaction, kiểm tra revision để tránh
  ghi đè từ cửa sổ cũ; ID phiên chống lưu trùng. Lỗi lưu được hiển thị và giữ hàng
  chờ trong bộ nhớ; đọc lại bản đã lưu cần xác nhận bỏ thay đổi chưa lưu.
- Backup format 2/schema 3 gồm Đồng hồ; vẫn đọc format 1/schema 1–2. Khôi phục
  bản cũ giữ Đồng hồ hiện tại. Migration và restore giữ snapshot phục hồi trước,
  restore bị chặn khi có phiên running/paused, tăng revision để vô hiệu ghi cũ.
- Tính theo timestamp khi app bị suspend/đóng rồi mở lại. Không cam kết báo thức
  khi app đóng, đánh thức máy, âm thanh hoặc thông báo hệ thống.

Chi tiết: [đặc tả](../specs/clock-v1.md), [thiết kế](../../design/clock-plugin.md),
[kiểm chứng](../verification/clock-v1.md). Được bundle trong bản 0.1.4.
