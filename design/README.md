# Thiết kế giao diện NuvoKit

Nơi lưu brief, prompt và ảnh mockup để AI/người thiết kế phát triển giao diện.
Ưu tiên hiện tại: **app Windows, phần lõi trước mini-app**.

Trạng thái: có hai mockup D02 light/dark và ba hướng bố cục bộ cài môi trường,
**mẫu wizard 1 đã được duyệt và triển khai**; các ảnh còn lại giữ `review`.
Khung app dùng D02 làm tham chiếu; bộ cài dùng wizard native trước WebView2.
Tài liệu sản phẩm trong [docs](../docs/README.md) vẫn là nguồn yêu cầu; mockup là
đề xuất hình ảnh, không chứng minh tính năng đã được triển khai.

## Cấu trúc

```text
design/
  README.md           Hướng dẫn làm việc và cấu trúc
  brief.md            Brief giao diện lõi Windows
  prompts.md          Mẫu prompt và lịch sử prompt tạo ảnh
  windows-setup.md     Brief/review bước cài môi trường cho người dùng
  windows-setup-prompts.md  Prompt và metadata ba hướng bộ cài
  mockups/
    README.md         Danh mục ảnh, trạng thái và ghi chú review
    ...               Ảnh PNG/WebP được tạo về sau
```

## Quy trình

Review hiện tại: [Cài môi trường cho người dùng Windows](windows-setup.md),
[ba ảnh bộ cài](mockups/README.md#bộ-cài-môi-trường--review) và
[đặc tả](../docs/specs/windows-installation.md). Chủ dự án yêu cầu duyệt trước khi
code ở lượt thiết kế trước. Lượt tiếp theo đã duyệt mẫu 1 và cho triển khai/phát
hành, theo [quyết định 0006](../docs/decisions/0006-native-setup-release.md).

1. Đọc [brief](brief.md), [roadmap](../docs/roadmap.md) và các quyết định liên quan.
2. Viết prompt cụ thể trong [prompts.md](prompts.md), ghi ID, màn hình, theme,
   kích thước ảnh và ảnh tham chiếu nếu có.
3. Khi được yêu cầu tạo ảnh, lưu kết quả vào [mockups/](mockups/README.md).
4. Ghi ảnh vào danh mục mockup cùng prompt nguồn, trạng thái và điểm cần sửa.
5. Tạo phiên bản mới khi chỉnh sửa; dùng ảnh được duyệt làm tham chiếu triển khai.
   Nếu thiết kế đổi yêu cầu sản phẩm, cập nhật tài liệu sản phẩm tương ứng.

## Tên file và trạng thái

- Tên ảnh: `windows-<screen>-<theme>-v<NN>.png` hoặc `.webp`.
- Ví dụ: [windows-environment-light-v01.png](mockups/windows-environment-light-v01.png).
- Screen dùng tên ngắn như `app-shell`, `environment`, `dependencies`, `hardware`.
- Trạng thái: `draft`, `review`, `approved`, `superseded`; chỉ ghi `approved` khi
  chủ dự án đã duyệt rõ ràng. Prompt được tạo không có nghĩa ảnh đã được duyệt.
- Lưu ảnh thiết kế có chủ đích; giữ file tạm, cache và bản xuất trùng ngoài repo.
- Dùng dữ liệu giả lập; không đưa thông tin cá nhân hoặc cấu hình máy thật vào ảnh.
