# Cài NuvoKit cho người dùng Windows

Cập nhật: **23/10/2026**. Đích thử nghiệm: **Windows 11 x64**.

## Tình trạng bộ cài

- Có [bộ cài GUI 0.1.3](https://github.com/nguyen-hung-dev/nuvokit/releases/download/v0.1.3/NuvoKit_0.1.3_x64-setup.exe),
  bản preview chưa ký số, theo bố cục wizard mẫu 1.
- Chủ dự án xác nhận clone, build, cài và mở app thành công trên máy đang dùng.
  Kiểm chứng 0.1.3 trên Windows Sandbox sạch/thiếu WebView2 đã có kết quả; phạm vi
  máy vật lý và lỗi nâng cao xem trong hồ sơ kiểm chứng.
- File phát hành ở [GitHub Releases v0.1.3](https://github.com/nguyen-hung-dev/nuvokit/releases/tag/v0.1.3),
  kèm checksum và notices của dependencies.
- Mẫu 1 đã được duyệt và triển khai. Xem [đặc tả](specs/windows-installation.md) và
  [phạm vi kiểm chứng](verification/core-data-0.1.3.md) trước khi dùng rộng rãi.

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
   chữ ký rồi chạy installer. Nhánh thiếu runtime đã được thử trong Sandbox Windows sạch.
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

## Sao lưu, khôi phục và dung lượng

Mở **Cài đặt → Dữ liệu & sao lưu**:

1. **Sao lưu dữ liệu**: chọn nơi lưu file `.nuvobak` ngoài vùng dữ liệu app. File
   chứa theme và toàn bộ lịch sử tác vụ, không chỉ 20 mục đang hiển thị. File không
   mã hóa; giữ ở nơi riêng. Gói OCR/cache không nằm trong backup vì có thể tải lại.
2. **Khôi phục từ file**: chọn file, xem ngày/phiên bản/theme/số mục lịch sử rồi
   xác nhận. File hỏng/sai hash/không tương thích bị chặn trước khi thay dữ liệu.
   Hủy sẽ giữ dữ liệu hiện tại. Restore thay thế theme/lịch sử, giữ gói đã cài.
3. Trước restore hoặc nâng cấp schema, app tự lưu bản phục hồi trong `backups/`
   của thư mục dữ liệu. **Mở thư mục dữ liệu** để tìm các file này; có thể chọn
   lại `.nuvobak` qua luồng Khôi phục. Nên có thêm một bản sao ngoài AppData vì
   gỡ app với lựa chọn xóa dữ liệu cũng xóa các bản phục hồi nằm trong AppData.
4. **Dọn file tạm** chỉ dọn cache NuvoKit và file tải dở đã biết; không xóa theme,
   lịch sử, gói hoàn chỉnh, bản phục hồi hoặc cache WebView đang dùng.

Bản 0.1.3 nâng dữ liệu schema 1 → 2 bằng transaction. App schema 1 cũ sẽ từ chối
mở schema 2 để tránh hạ cấp; tiếp tục dùng bản mới. Không tự xóa/reset DB khi lỗi
migration. Giới hạn backup hiện tại: 16 MiB và 100.000 mục lịch sử.

## Gỡ qua Windows và lựa chọn dữ liệu

Từ bản **0.1.2**, bộ cài kiểm tra cả đăng ký gỡ với Windows. Nếu đang dùng bản cũ,
cài bản mới đè lên để cập nhật trình gỡ; thao tác này giữ dữ liệu hiện có.

1. Đóng NuvoKit.
2. Chọn **Settings → Apps → Installed apps → NuvoKit → Uninstall**, hoặc
   **Control Panel → Programs and Features → NuvoKit → Uninstall**.
3. Windows mở trình gỡ native của NuvoKit. Mặc định ô xóa dữ liệu **không được chọn**:
   chỉ gỡ chương trình, shortcut và mục NuvoKit trong danh sách ứng dụng Windows.
   Cài đặt, lịch sử và gói tải thêm được giữ để dùng lại khi cài lại.
4. Muốn dọn sạch, chọn **Xóa cả dữ liệu NuvoKit (không thể khôi phục)**. Trên Windows
   tiếng Anh, ô tương ứng là **Delete the application data**. Xác nhận thêm ở hộp
   cảnh báo trước khi bất kỳ file/mục đăng ký nào bị gỡ. Hủy ở cảnh báo sẽ dừng gỡ.

Khi đồng ý xóa dữ liệu, trình gỡ xóa hai thư mục **của tài khoản Windows hiện tại**:

- `%LOCALAPPDATA%\com.nuvokit.desktop`: SQLite/cài đặt/lịch sử, gói tùy chọn và cache WebView.
- `%APPDATA%\com.nuvokit.desktop`: dữ liệu roaming của NuvoKit nếu có.

File đã xuất ra thư mục riêng, source clone/build và Microsoft WebView2 dùng chung
được giữ lại. Nếu cài và chạy bản source cùng định danh, chúng có thể dùng chung
AppData; chọn xóa sẽ xóa dữ liệu chung đó. Sao lưu dữ liệu cần giữ trước khi chọn.
Không tự dọn dữ liệu của các tài khoản Windows khác.

Lệnh gỡ im lặng (`QuietUninstallString`), chế độ passive và nâng cấp luôn giữ dữ
liệu. Chỉ giao diện gỡ tương tác có lựa chọn xóa. File `uninstall.exe` nằm trong
thư mục chương trình cũng mở cùng trình gỡ này.

## Xử lý lỗi

- Nếu tải thành phần bắt buộc thất bại, kiểm tra mạng và chạy lại bộ cài. Nếu vẫn
  lỗi, ghi lại bước và thông báo đang thấy để gửi cho chủ dự án.
- Nếu app đã mở nhưng thiếu gói tùy chọn, dùng **Thành phần** để cài/thử lại.
- Không xóa thủ công dữ liệu nếu còn muốn giữ cài đặt/lịch sử.

Wizard hiển thị bước hiện tại và tên thành phần. Khi tải, tiến độ byte/% chỉ hiện
khi biết tổng thật; khi installer ngoài đang chạy, dùng thanh chờ và tạm khóa hủy.
Lỗi có **Thử lại**, có thể đổi thư mục; **Xem chi tiết** mở lịch sử bước. Hoàn tất
chỉ được báo sau kiểm tra SHA-256; nút **Mở NuvoKit** mở app. Dữ liệu OCR vẫn là
gói tùy chọn, có thể cài sau từ giao diện app.
