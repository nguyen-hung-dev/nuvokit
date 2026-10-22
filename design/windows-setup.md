# Review — Cài môi trường cho người dùng Windows

Ngày: **22/10/2026**. Trạng thái: **mẫu 1 đã được duyệt và triển khai cho preview 0.1.1**.

## Brief

- Người dùng thông thường nhận `.exe`, thao tác qua giao diện.
- Mục tiêu: biết đang ở bước nào, cài thành phần nào, vì sao cần và cách xử lý lỗi.
- Bề mặt đầu tiên: cửa sổ bộ cài native trước khi NuvoKit mở được UI React.
- Tham chiếu thực: [D02 light](mockups/windows-environment-light-v01.png), Segoe UI,
  nền `#f6f7fb`, trắng, chữ `#17203a`, tím `#6657e8`, đường chia `#e4e8f1`.
- Bộ cài gọn hơn app, không dùng sidebar mini-app trước khi app được cài.
- Ngôn ngữ tiếng Việt; khung đề nghị **1100 × 760 px**. Kích thước thực ghi riêng;
  chưa chốt kích thước cửa sổ native.

## Ba hướng để chọn bố cục

Cùng tình huống: Windows đã kiểm tra, WebView2 đang cài, NuvoKit và bước hoàn tất
còn chờ. Đây là ba bố cục độc lập, không phải ba bước liên tiếp. Dữ liệu giả lập.

| Hướng | Khác biệt |
| --- | --- |
| Trình hướng dẫn | Stepper dọc bên trái; vùng chính giải thích thành phần đang cài |
| Tiến trình tập trung | Nhấn bước hiện tại; đường đi gọn ở đầu, chi tiết thu gọn |
| Nhật ký rõ ràng | Danh sách công việc/trạng thái từng bước là nội dung chính |

Chủ dự án chọn **mẫu 1 — Trình hướng dẫn**, theo đúng thứ tự ảnh đã hiển thị.
Ảnh chuẩn: [wizard light v01](mockups/windows-setup-wizard-light-v01.png).
Đã cho phép code, commit/push source và phát hành `.exe`; xem [quyết định 0006](../docs/decisions/0006-native-setup-release.md).
Prompt ở [windows-setup-prompts.md](windows-setup-prompts.md);
ảnh và ghi chú ở [danh mục mockup](mockups/README.md).

## Nội dung bắt buộc

- **Cài đặt NuvoKit**, **Chuẩn bị môi trường**, **Microsoft WebView2**.
- Mục đích: **Thành phần hiển thị giao diện NuvoKit.** Nguồn: **Microsoft**.
- Windows/kiến trúc đã kiểm tra; cài app và hoàn tất còn chờ.
- **Đang cài đặt…** với thanh chờ. Không đặt % hoặc thời gian còn lại khi installer
  Microsoft không cung cấp số đo.
- **Xem chi tiết** là thao tác phụ. **Hủy** vô hiệu khi installer con chưa hỗ trợ
  hủy an toàn, giải thích **Chưa thể hủy trong bước này.**
- Chú thích **Dữ liệu minh họa · Chờ duyệt**.

Không đưa lệnh, code, toolchain, tài khoản/đường dẫn người thật, biểu đồ hiệu năng,
model AI hay trạng thái engine OCR hoạt động vào màn hình cài này.

## Trạng thái cần hoàn thiện sau chọn hướng

| Nhóm | Cần thể hiện ở vòng thiết kế tiếp |
| --- | --- |
| Bắt đầu | Chọn thư mục, phạm vi và nút bắt đầu |
| Kiểm tra | Đang kiểm tra; phù hợp; OS/kiến trúc/dung lượng không đáp ứng |
| Runtime đã có | Bỏ qua tải/cài, ghi **Đã có sẵn** |
| Tải runtime | Tên, nguồn; byte/% khi biết tổng thật; hủy tải nếu hỗ trợ |
| Lỗi / phục hồi | Mất mạng, xác minh/cài lỗi, quyền, chạy lại, reboot nếu có |
| Hoàn tất | Xác minh thành công rồi **Mở NuvoKit** |
| Lần mở đầu | UI React sau bootstrap; quét máy, gói tùy chọn chưa chọn, **Để sau** |

Ba ảnh vòng này chọn bố cục bước cài môi trường; chưa có ảnh riêng cho mọi trạng
thái trong bảng. Dữ liệu OCR có thể cài sau, engine OCR chưa triển khai.

## Cách duyệt

1. Chọn một bố cục hoặc chỉ ra phần muốn kết hợp/chỉnh.
2. Rà chữ, phân cấp, bước đang cài, trạng thái chờ và hủy. Ảnh AI là tham chiếu;
   chuỗi UI chuẩn lấy từ brief/đặc tả.
3. Hoàn thiện trạng thái và đánh giá khả năng dựng native bằng NSIS.
4. Mẫu 1 và quyền triển khai/phát hành đã được chủ dự án xác nhận trong lượt tiếp
   theo. Các thiết kế mở rộng khác vẫn cần phạm vi riêng; xem [QA](../design-qa.md).

Hợp đồng đầy đủ: [đặc tả cài Windows](../docs/specs/windows-installation.md).
