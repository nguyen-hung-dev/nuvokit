# 0005 — Hai hướng cài và duyệt thiết kế trước triển khai

- Status: **Accepted về phạm vi; giao diện chưa duyệt**.
- Date: **2026-10-22**.
- Source: Chủ dự án xác nhận cài/chạy từ Git thành công và yêu cầu tách hướng dẫn
  developer/người dùng `.exe`, tạo ảnh bước cài môi trường; tạm chỉ làm tài liệu
  và design để duyệt trước khi code giao diện.

## Decision

- README Anh/Việt tách hai luồng: người dùng nhận bộ cài đã build; developer dùng
  toolchain để chạy/build source. Máy khách không cần cài toolchain.
- Thiết kế chuẩn bị môi trường trước app và lần mở đầu; giữ tài liệu, prompt,
  ảnh có chủ đích trong `design/`.
- Bước trước WebView2 phải hiển thị được bằng native Windows; React dùng sau khi
  runtime đã có. Cách hiện thực native cụ thể còn phải đánh giá.
- Lượt này chỉ sửa Markdown/ảnh; không sửa source, package/lockfile, config/hook
  bộ cài, không tạo pipeline hoặc phát hành binary.
- Ảnh mới đều `review`. Chỉ code khi chủ dự án duyệt rõ ràng.

## Consequences

Phản hồi cài thành công là báo cáo của chủ dự án, không thay thế Windows sạch.
Hướng dẫn ghi đúng tình trạng chưa có asset phát hành, không tạo link tải giả
hoặc mô tả giao diện đề xuất như đã chạy được.
