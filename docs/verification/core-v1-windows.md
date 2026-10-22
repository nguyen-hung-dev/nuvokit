# Core v1 — Kiểm chứng Windows

Ngày: **22/10/2026**. Môi trường: máy phát triển Windows 11 x64, Rust 1.95,
Node 26.4, WebView2 đã có sẵn. Không coi đây là phép thử Windows sạch hoặc máy yếu.

## Chức năng đã xác nhận

- `npm run check`, `npm test`: TypeScript đạt, 6 test nghiệp vụ đạt.
- `npm run native:test`: 10 test Rust đạt; bao gồm hash/sai dung lượng, hủy,
  reader gián đoạn, không ghi được đích, phục hồi khi promote lỗi, một job tại một
  thời điểm, schema tương lai bị từ chối và theme tồn tại qua mở lại DB.
- `npm run native:check`: Clippy với `-D warnings` đạt.
- `npm run build` và `npm run desktop:build`: frontend/release executable đạt.
- `npm run desktop:bundle`: tạo bộ cài NSIS x64 local khoảng 3,5 MiB; chưa ký.
- Native smoke tải gói thật từ nguồn đã pin, kiểm tra đúng SHA-256, cài lại và quét
  ra `ready`. Chỉ dùng dữ liệu tạm riêng và output đã lược bỏ inventory.
- `--verify-core` chạy WebView thật: renderer vẽ hai frame có inventory, IPC lưu/đọc
  theme và channel cài dữ liệu hoạt động, quét lại thấy gói hợp lệ, WebGPU compute
  trả đúng `[2,4,6,8]`. Không dùng remote debugging endpoint.
- Browser preview kiểm tra điều hướng bốn trang, theme lưu qua reload, quét lại,
  chi tiết gói, nút native install bị vô hiệu trong preview, Escape đóng dialog.
- Đã chụp/kiểm tra hình ảnh light/dark và bố cục 1440/1024/390 px; kiểm tra không
  tràn ngang ở 1024/390 px, không có console error sau sửa favicon.

## Số đo ban đầu và vấn đề còn lại

| Lượt / Pha | UI ready | Quét lại | Tổng working set | CPU rảnh | Kết quả |
| --- | --- | --- | --- | --- | --- |
| Lượt đầu, sau WebGPU | 509 ms | 1 ms | 414,1 MiB | 0,0% | RAM vượt mục tiêu 350 MiB |
| Lượt tách pha, trước compute | 517 ms | 1 ms | 378,6 MiB | 0,0% | RAM vượt mục tiêu |
| Cùng lượt, sau compute | 517 ms | 1 ms | 408,4 MiB | 0,0% | WebGPU đạt, RAM vượt mục tiêu |
| Bộ đo giới hạn CPU/memory, baseline | 520 ms | 1 ms | 378,0 MiB | 0,0% | RAM vẫn vượt mục tiêu |
| Cùng lượt, sau compute | 520 ms | 1 ms | 408,8 MiB | 0,0% | WebGPU đạt, RAM vẫn vượt mục tiêu |

Lượt mới nhất nhận 60 progress/channel events; theme, gói/hash và mục tiêu OS đều
đạt. Lượt smoke quét đầu tiên khoảng 0,16–0,41 giây; quét lại có cache nhanh hơn.
JS production khoảng **80,3 KiB gzip**, trong ngưỡng 150 KiB đã đặt.

Working set cộng app và các process WebView2 con, có thể tính trùng trang bộ nhớ
chia sẻ. Bộ đo ban đầu còn lấy thông tin process không cần thiết; bản sau giới hạn
chỉ CPU/memory để giảm ảnh hưởng của chính phép đo; mức giảm trong mẫu cuối chỉ
khoảng 0,6 MiB ở baseline, chưa giải quyết chênh lệch RAM. Không thay đổi mục tiêu 350 MiB
hoặc xóa kết quả vượt ngưỡng. Những số này là mẫu nhỏ trên một máy, không phải p95
hoặc so sánh định lượng với Electron.

Startup tính từ vào hàm native `run()` đến IPC báo đã vẽ hai frame có report.
CPU lấy mẫu 5 giây sau 30 giây ổn định, chuẩn hóa theo số luồng khả dụng. Screenshot
QA/log/binary nằm trong `output/` hoặc `target/` bị ignore; không đưa inventory thật
vào Git.

## Giới hạn

- Chưa thử bộ cài trên Windows sạch, WebView2 thiếu, Windows ARM, macOS, Store hoặc
  browser storage/sync thật. Không tuyên bố hoàn thành toàn bộ giai đoạn 0.
- Cài optional data đã kiểm chứng qua adapter/IPC thật. Chưa tự động bấm toàn bộ
  luồng cài trong cửa sổ native; browser kiểm tra phần UI dùng chung.
- Stderr lúc đóng WebView có thông báo `Failed to unregister class Chrome_WidgetWin_0`
  (1412). Luồng chức năng đã hoàn thành trước đó; chưa xác định nguyên nhân thông báo.
- Mockup light/dark đang review, chưa được chủ dự án duyệt thiết kế. Chưa có bộ ảnh
  riêng cho tất cả trạng thái lỗi/loading, chưa có audit accessibility toàn diện.
- Gói OCR là dữ liệu ngôn ngữ; engine OCR và tích hợp AI chưa triển khai.

Lệnh tái kiểm chứng nằm trong [development](../development.md). Các giới hạn phát
hành và mục tiêu RAM còn mở trong [roadmap](../roadmap.md).
