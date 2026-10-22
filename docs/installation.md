# Cài NuvoKit cho người dùng Windows

Cập nhật: **23/10/2026**. Đích thử nghiệm: **Windows 11 x64**.

## Tình trạng bộ cài

- Có [bộ cài GUI 0.1.1](https://github.com/nguyen-hung-dev/nuvokit/releases/download/v0.1.1/NuvoKit_0.1.1_x64-setup.exe),
  bản preview chưa ký số, theo bố cục wizard mẫu 1.
- Chủ dự án xác nhận clone, build, cài và mở app thành công trên máy đang dùng.
  Chưa có xác nhận trên Windows sạch hoặc máy thiếu WebView2.
- File phát hành ở [GitHub Releases v0.1.1](https://github.com/nguyen-hung-dev/nuvokit/releases/tag/v0.1.1),
  kèm checksum và notices của dependencies.
- Mẫu 1 đã được duyệt và triển khai. Xem [đặc tả](specs/windows-installation.md) và
  [phạm vi kiểm chứng](verification/windows-setup-0.1.1.md) trước khi dùng rộng rãi.

## Chuẩn bị

Cần máy Windows 11 x64, dung lượng đủ cho bản được cung cấp và bộ cài từ dự án.
Internet cần khi tải WebView2 còn thiếu hoặc gói tùy chọn. Người dùng bản đã build
không cần Git, Node.js/npm, Rust hay Visual Studio. Các công cụ đó dành cho
[nhà phát triển](development.md).

## Cài bằng file .exe

1. Nhận `NuvoKit_<version>_x64-setup.exe` từ trang phát hành hoặc chủ dự án.
   **Code → Download ZIP** trên GitHub tải source, không tải bộ cài.
2. Nhấp đúp file và chọn thư mục. Mặc định là `%LOCALAPPDATA%\NuvoKit`, thường ở
   `C:\Users\<tài-khoản>\AppData\Local\NuvoKit`; có thể chọn thư mục khác.
3. Làm theo wizard: kiểm tra máy → chuẩn bị môi trường → cài NuvoKit → hoàn tất.
   WebView2 đã có thì được bỏ qua; nếu thiếu, wizard tải từ Microsoft, kiểm tra
   chữ ký rồi chạy installer. Nhánh thiếu runtime còn cần xác nhận trên máy sạch.
4. Hoàn tất rồi mở NuvoKit từ Start menu.
5. Dùng **Môi trường**, **Phần cứng** và **Thành phần** để xem trạng thái. Gói dữ
   liệu OCR tiếng Việt là tùy chọn; chưa cung cấp tính năng OCR hoàn chỉnh.

Nếu Windows hỏi về nhà phát hành, lưu ý bản local chưa ký số. Đối chiếu nguồn file
với chủ dự án; hướng dẫn này không yêu cầu tắt cơ chế bảo vệ Windows.

## Vị trí file và dữ liệu

| Nội dung | Vị trí |
| --- | --- |
| Chương trình | Thư mục chọn trong wizard; mặc định `%LOCALAPPDATA%\NuvoKit` |
| Cài đặt, lịch sử, gói tải thêm | `%LOCALAPPDATA%\com.nuvokit.desktop` |
| Source và build | Chỉ cần trên máy tự clone/build |

Đổi thư mục chương trình sang ổ E không tự đổi nơi lưu dữ liệu. Bản cài và bản
chạy từ source cùng định danh có thể dùng chung dữ liệu; clone repo khác không tạo
môi trường dữ liệu riêng.

## Gỡ và xử lý lỗi

- Gỡ bằng **Settings → Apps → Installed apps → NuvoKit → Uninstall**.
- Nếu tải thành phần bắt buộc thất bại, kiểm tra mạng và chạy lại bộ cài. Nếu vẫn
  lỗi, ghi lại bước và thông báo đang thấy để gửi cho chủ dự án.
- Nếu app đã mở nhưng thiếu gói tùy chọn, dùng **Thành phần** để cài/thử lại.
- Không xóa thủ công dữ liệu nếu còn muốn giữ cài đặt/lịch sử.

Wizard hiển thị bước hiện tại và tên thành phần. Khi tải, tiến độ byte/% chỉ hiện
khi biết tổng thật; khi installer ngoài đang chạy, dùng thanh chờ và tạm khóa hủy.
Lỗi có **Thử lại**, có thể đổi thư mục; **Xem chi tiết** mở lịch sử bước. Hoàn tất
chỉ được báo sau kiểm tra SHA-256; nút **Mở NuvoKit** mở app. Dữ liệu OCR vẫn là
gói tùy chọn, có thể cài sau từ giao diện app.
