# Ảnh mockup

Thư mục chứa ảnh thiết kế giao diện NuvoKit do AI/người thiết kế tạo có chủ đích.
Đã có hai ảnh D02, tạo ngày **22/10/2026** bằng công cụ built-in `image_gen`.
Mọi thông tin máy trong ảnh là dữ liệu giả lập.

| ID / Ảnh | Màn hình / Trạng thái | Theme / Kích thước thực | Trạng thái | Prompt |
| --- | --- | --- | --- | --- |
| [windows-environment-light-v01](windows-environment-light-v01.png) | D02 · lõi sẵn sàng, gói OCR tùy chọn chưa cài | Light · 1505 × 1045 px | review | [Nguồn](../prompts.md#windows-environment-light-v01) |
| [windows-environment-dark-v01](windows-environment-dark-v01.png) | D02 · cùng bố cục bản light | Dark · 1506 × 1045 px | review | [Nguồn](../prompts.md#windows-environment-dark-v01) |

Ghi chú review: ảnh đã kiểm tra trực quan, giữ đủ sidebar, summary, thành phần và
khả năng máy. Kích thước công cụ trả về khác kích thước đề nghị. Đây là tham chiếu
phân cấp/bố cục/theme; chữ trong code lấy từ đặc tả, không OCR lại từ ảnh. Chưa có
ảnh riêng cho loading/lỗi/cài đặt, chưa có duyệt thị giác từ chủ dự án. Khung app
thử nghiệm có bổ sung nhãn preview và trạng thái tương tác thực tế.

SHA-256:

- Light: `8502ac0cb0b7b7c11d1b74c041ed450e1e4a10a95523cafd28b47332e5aeca4a`.
- Dark: `07dc67282e4f1c132a02ae01da548d8114086e5dd3c8e07c0daf070d6bb2f60d`.

## Khi thêm ảnh

- Lưu PNG/WebP theo tên `windows-<screen>-<theme>-v<NN>.<ext>`.
- Ghi ID, link ảnh, màn hình/trạng thái, theme, kích thước pixel, ngày tạo và link
  prompt nguồn trong [prompts.md](../prompts.md).
- Ghi trạng thái `draft`, `review`, `approved` hoặc `superseded` cùng nhận xét.
- Nêu rõ chữ sai, nội dung thiếu và dữ liệu giả lập để người triển khai đối chiếu.
- Ảnh chỉnh sửa có phiên bản mới; giữ liên kết ảnh tham chiếu và ảnh được thay thế.

Ảnh `approved` cần chủ dự án duyệt rõ ràng. Ảnh mockup không thay thế đặc tả sản
phẩm hoặc xác nhận rằng giao diện đã được lập trình.
