# App chính & thư viện plugin

Ngày: **23/10/2026**. Trạng thái: **approved — cả ba ảnh đã được duyệt**.
Chủ dự án duyệt cả ba, yêu cầu code trang và nút chuyển thư viện. Source hiện có
UI tương tác, SDK client/manifest v1; runtime, kho và mini-app thật chưa triển khai.
Quyết định [0009](../docs/decisions/0009-plugin-ui-package-sdk.md).

## Mục tiêu

Người dùng mở các ứng dụng đã cài, tiếp tục công việc và tìm thêm plugin theo nhu
cầu. Giữ phong cách NuvoKit D02 và tokens UI hiện có: nền sáng, chữ navy, điểm
nhấn indigo, controls nhất quán. Tiếng Việt; desktop Windows; dữ liệu giả lập.

Căn cứ: [sản phẩm](../docs/product.md), [mô hình plugin đề xuất](../docs/plugins.md),
[brief lõi](brief.md) và [D02 light](mockups/windows-environment-light-v01.png).
Gói/SDK tối thiểu đã chốt tại [đặc tả v1](../docs/specs/plugin-package-v1.md);
duyệt hình ảnh không chọn MVP hoặc chứng minh runtime plugin đã hoạt động.

## Ba ảnh trong thứ tự đã hiển thị

| Mẫu | Ảnh / Mục tiêu |
| --- | --- |
| 1 | [App chính](mockups/windows-app-home-light-v01.png): mở ba app mẫu đã cài, tiếp tục gần đây và đi đến thư viện |
| 2 | [Thư viện dạng lưới](mockups/windows-plugin-library-grid-light-v01.png): tìm kiếm, nhóm nhu cầu, phân biệt Mở/Cài đặt/Xem chi tiết |
| 3 | [Danh sách + chi tiết](mockups/windows-plugin-library-details-light-v01.png): chọn plugin, đọc chức năng và quyền trước khi cài |

Mẫu 1 là Tổng quan; mẫu 2/3 cùng trang Thư viện với nút chuyển bố cục. Cả ba đã
được chủ dự án duyệt. Tìm kiếm/bộ lọc dùng chung; trạng thái cài chỉ là bản mẫu.
Nhóm điều hướng minh họa: Tổng quan, Thư viện plugin, Đã cài, Môi trường, Cài đặt.

## Nội dung minh họa

Đồng hồ, Sách, Công việc, Lịch, Ghi chú và Thói quen lấy từ định hướng sản phẩm.
Nhãn Đã cài/Chưa cài, tiến độ đọc, việc gần đây và quyền trong ảnh chỉ là dữ liệu
tổng hợp. Không có tài khoản, cấu hình máy hoặc hồ sơ thật. Không có đánh giá,
số lượt tải, giá bán hoặc lời hứa tương thích được suy đoán.

## Ghi chú review

- Đã kiểm tra trực quan cả ba: đủ khung app, sidebar, tiêu đề và thao tác chính;
  chữ tiếng Việt đọc được, không thấy cắt nội dung chính. Kích thước thực
  **1505 × 1045 px**, khác khung yêu cầu 1440 × 1000; giữ nguyên ảnh gốc.
- Mẫu 1 ưu tiên mở app; mẫu 2 giúp quét danh mục; mẫu 3 ưu tiên quyết định trước cài.
- Mẫu 3 đổi màu icon Sách/Công việc so với mẫu 1/2. Khi triển khai cần chốt lại
  một bảng màu/icon dùng chung, không lấy icon AI làm bộ asset production.
- Tên nút `Cài đặt` (mẫu 2) / `Cài plugin` (mẫu 3) cần thống nhất. Tab Đã cài trong
  mẫu 3 trùng lối đi sidebar; chọn một cơ chế khi chốt điều hướng.
- Quyền Thông báo, lưu dữ liệu và liên kết công việc trong mẫu 3 còn là đề xuất;
  phải khớp quyền/khả năng host thật trước khi đưa vào giao diện chạy được.
- Chưa có ảnh AI riêng cho dark, empty/loading/error, tiến trình tải, lỗi tương thích, update/gỡ,
  hoặc bố cục cửa sổ hẹp. Ảnh tĩnh không xác minh tương tác hay bàn phím.
- Source đã thống nhất icon/màu giữa ba màn hình, bỏ quyền Thông báo/liên kết việc
  chưa có trong SDK v1, bổ sung tìm kiếm/lọc/sort, modal xác nhận và trạng thái rỗng.
  Core vẫn có Phần cứng/Thành phần trong nhóm điều hướng hệ thống. Đây là các
  điều chỉnh để khớp khả năng thực và giữ luồng lõi hiện có.

Prompt và thông tin công cụ: [plugin-library-prompts.md](plugin-library-prompts.md).
Checksum và đường dẫn ảnh: [danh mục mockup](mockups/README.md#app-chính--thư-viện-plugin).
