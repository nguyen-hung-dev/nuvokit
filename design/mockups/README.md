# Ảnh mockup

Thư mục chứa ảnh thiết kế giao diện NuvoKit do AI/người thiết kế tạo có chủ đích.
Đã có hai ảnh D02 và ba hướng bộ cài, tạo ngày **22/10/2026** bằng built-in `image_gen`.
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

## Bộ cài môi trường — review

Ba ảnh dưới là các bố cục khác nhau của cùng bước cài WebView2. Số thứ tự khớp
thứ tự ảnh mới đã hiển thị trong cuộc trao đổi: wizard, focus, timeline. Hiện có
mẫu 1 được chọn/duyệt và đã cho triển khai/phát hành ở lượt tiếp theo. Brief tại [windows-setup.md](../windows-setup.md).

| Ảnh | Hướng | Kích thước thực | Trạng thái | Prompt |
| --- | --- | --- | --- | --- |
| [1 · windows-setup-wizard-light-v01](windows-setup-wizard-light-v01.png) | Trình hướng dẫn | 1508 × 1043 px | approved | [Nguồn](../windows-setup-prompts.md#windows-setup-wizard-light-v01) |
| [2 · windows-setup-focus-light-v01](windows-setup-focus-light-v01.png) | Tiến trình tập trung | 1508 × 1043 px | review | [Nguồn](../windows-setup-prompts.md#windows-setup-focus-light-v01) |
| [3 · windows-setup-timeline-light-v01](windows-setup-timeline-light-v01.png) | Nhật ký rõ ràng | 1508 × 1043 px | review | [Nguồn](../windows-setup-prompts.md#windows-setup-timeline-light-v01) |

Đã kiểm tra trực quan cả ba: bước WebView2 đang cài, tên/mục đích/nguồn hiện rõ,
không có lệnh hoặc % giả, nút hủy thể hiện vô hiệu. Không coi là QA của bộ cài chạy
thật. Tool trả ảnh 1508 × 1043 thay vì khung đề nghị 1100 × 760; không kéo giãn ảnh.

Điểm cần tinh chỉnh trước code: mẫu 1 có icon check xám ở hàng hoàn tất còn chờ;
đổi thành icon chờ/vòng rỗng để tránh hiểu nhầm. Icon WebView2/Microsoft trong ảnh
là minh họa AI, cần dùng asset hợp lệ/nhãn chuẩn khi triển khai. Ảnh tĩnh không thể
chứng minh animation hay khả năng dùng bàn phím. Chưa có ảnh lỗi/hoàn tất/lần mở
đầu riêng; hoàn thiện sau khi chọn hướng, theo brief.

SHA-256:

- Ảnh 1: `b79112eb6ba6fd8da16e9349d96efdcb61aa6d8821164b8030b43506dfb9aa7b`.
- Ảnh 2: `74a8f6c09d3de513c88a97489ebf48511550b3aba4a23009070be18b8bd463fd`.
- Ảnh 3: `9bce9e34c1ee2fa61ab0888278de3b305ef6cef494123784b896e6c87dc1fdce`.

## Khi thêm ảnh

- Lưu PNG/WebP theo tên `windows-<screen>-<theme>-v<NN>.<ext>`.
- Ghi ID, link ảnh, màn hình/trạng thái, theme, kích thước pixel, ngày tạo và link
  prompt nguồn trong [prompts.md](../prompts.md).
- Ghi trạng thái `draft`, `review`, `approved` hoặc `superseded` cùng nhận xét.
- Nêu rõ chữ sai, nội dung thiếu và dữ liệu giả lập để người triển khai đối chiếu.
- Ảnh chỉnh sửa có phiên bản mới; giữ liên kết ảnh tham chiếu và ảnh được thay thế.

Ảnh `approved` cần chủ dự án duyệt rõ ràng. Ảnh mockup không thay thế đặc tả sản
phẩm hoặc xác nhận rằng giao diện đã được lập trình.
