# Plugin Đồng hồ — thiết kế giao diện

Ngày **23/10/2026**. Trạng thái: **approved — cả ba mẫu**. Chủ dự án duyệt
cả ba và yêu cầu triển khai cài đặt đổi giao diện. Một plugin với ba bố cục,
chọn độc lập chế độ và theme; không đặt lại phiên khi đổi bố cục.
Source được triển khai theo [0010](../docs/decisions/0010-clock-layouts-persistence.md)
và [đặc tả](../docs/specs/clock-v1.md); được bundle trong bản 0.1.4.

## Mục tiêu và căn cứ

Một công cụ thời gian trong NuvoKit: bắt đầu phiên tập trung, theo dõi thời gian
còn lại, tạm dừng/kết thúc hoặc đặt thời lượng đếm ngược. Giữ UI kit, brand và theme
của [app chính đã duyệt](mockups/windows-app-home-light-v01.png).

Căn cứ: [module 01](../docs/module-catalog.md), [quy trình sản phẩm đề xuất](../docs/product.md),
[kiến trúc](../docs/architecture.md) và [SDK v1](../docs/specs/plugin-package-v1.md).
Ảnh không chốt phạm vi MVP hay bổ sung API/quyền mới cho SDK.

## Ba ảnh theo thứ tự đã hiển thị

| Mẫu | Ảnh | Trạng thái và bố cục |
| --- | --- | --- |
| 1 | [windows-clock-focus-light-v01](mockups/windows-clock-focus-light-v01.png) | Light, sẵn sàng 25:00, timer ở giữa, tên phiên, preset và Bắt đầu; lịch sử nhỏ phía dưới |
| 2 | [windows-clock-session-light-v01](mockups/windows-clock-session-light-v01.png) | Light, phiên 25 phút đang chạy còn 18:42; timer bên trái, tên/ghi chú/lịch sử bên phải, Tạm dừng là thao tác chính |
| 3 | [windows-clock-countdown-dark-v01](mockups/windows-clock-countdown-dark-v01.png) | Dark, đếm ngược chưa bắt đầu 00:10:00; số lớn, nhập giờ/phút/giây, preset và một nút Bắt đầu |

Cả ba có điều hướng chế độ Tập trung / Đếm ngược / Bấm giờ. Bấm giờ mới xuất hiện
như lối chuyển chế độ; chưa có ảnh riêng cho màn hình đó. Code có chế độ Bấm giờ;
không coi ba bố cục là ba plugin riêng.

## Ghi chú review

- Đã kiểm tra trực quan: đủ khung app, tiêu đề, chế độ và thao tác chính; chữ Việt
  đọc được, không thấy cắt nội dung. Kích thước thực cả ba **1505 × 1045 px**,
  khác khung yêu cầu 1440 × 1000; giữ nguyên file gốc, không kéo giãn.
- Mẫu 1 đang idle nên có Bắt đầu và preset; vòng trung tính không giả báo hoàn tất.
- Mẫu 2 còn 18:42/25:00, vòng thể hiện xấp xỉ 75% còn lại; nút chính Tạm dừng,
  kết thúc là phụ. Timer đang chạy không có preset sửa thời lượng.
- Mẫu 3 nhập 00 giờ / 10 phút / 00 giây, khớp số hiển thị 00:10:00; chưa chạy nên
  không có nút pause/stop hoặc progress đang chạy.
- Tab ở mẫu 1/2 dùng gạch dưới, mẫu 3 dùng nền chọn. Khi chốt code cần thống nhất
  một kiểu tab và icon giữa các chế độ/theme. Các số 0 ở mẫu 1 hơi cách điệu;
  nên dùng font số tabular rõ ràng khi triển khai.
- Tên phiên, ghi chú và lịch sử là dữ liệu tổng hợp. Icon sách/task chỉ minh họa
  tên phiên do người dùng đặt, không chứng minh quyền truy cập plugin khác hoặc
  tự tăng trang đã đọc/đánh dấu việc hoàn thành.
- Mục Đồng hồ thụt vào sidebar đã được nối cố định cho module bundle; cơ chế
  đăng ký điều hướng của guest host vẫn chưa triển khai. Không có số liệu máy, tài khoản hoặc dữ liệu thật.

## Phần chưa thể hiện

Màn Bấm giờ, pause/resume, kết thúc và xác nhận lưu, thời lượng không hợp lệ,
lịch sử rỗng, lỗi lưu, sleep/resume, đóng/mở lại app và cửa sổ hẹp. Báo thức,
âm thanh/thông báo hệ thống và đánh thức máy chưa được thiết kế/kiểm chứng.
Không suy từ ảnh tĩnh rằng timer chạy đúng nền hoặc SDK/host đã hỗ trợ đầy đủ.

Prompt/công cụ: [clock-plugin-prompts.md](clock-plugin-prompts.md).
Metadata/checksum: [danh mục mockup](mockups/README.md#plugin-đồng-hồ--approved).
