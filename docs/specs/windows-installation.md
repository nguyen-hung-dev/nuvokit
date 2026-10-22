# Đặc tả — Windows Setup 0.1.3

Cập nhật: **23/10/2026**. Trạng thái: **mẫu 1 đã duyệt, wizard native đã triển khai**.
Nguồn quyết định hiện tại: [0006](../decisions/0006-native-setup-release.md); phạm vi
design-only trước đó ghi trong [0005](../decisions/0005-installation-design-review.md).

## Mục tiêu và hiện trạng

Người dùng nhận bộ cài `.exe`, hiểu máy có phù hợp không, đang cài thành phần nào
và làm gì nếu quá trình dừng. Nhà phát triển build sẵn; máy khách không tự build
hoặc tự cài toolchain. Bản preview 0.1.1 được phép phát hành; xem [kiểm chứng](../verification/windows-setup-0.1.1.md).

| Phần | Triển khai 0.1.1 | Còn phải kiểm chứng/mở rộng |
| --- | --- | --- |
| Bộ cài | WinForms native + NSIS current-user; wizard chịu trách nhiệm WebView2, NSIS payload dùng `skip` | Máy sạch và nhánh thiếu runtime |
| App | Giữ bốn trang; lần mở đầu vào Môi trường, OCR tùy chọn có progress | Onboarding riêng và thêm engines về sau |
| Phân phối | Source công khai, GitHub prerelease `.exe` + checksum/notices | Ký số, CI phát hành và kênh Store |
| Kiểm thử | 43 kiểm tra Setup, 6 test nghiệp vụ, 10 test Rust; chủ dự án đã cài/mở bản trước từ Git | Windows sạch không toolchain, thiếu WebView2 và toàn luồng nâng cấp/gỡ |

## Kiểm chứng bổ sung ở 0.1.3

Baseline 0.1.1 trong bảng trên được giữ để phân biệt lịch sử. Bản 0.1.3 đã kiểm
chứng trên Windows Sandbox sạch, không toolchain, thiếu WebView2: cài runtime thật,
nâng cấp payload 0.1.2, cài lại, chạy renderer/data và gỡ giữ dữ liệu. Nhánh offline
thiếu runtime dừng với lỗi đúng, chưa cài app. Hash executable nay được chụp trong
hook compile-time NSIS để khớp marker bundle của Tauri. Xem [bằng chứng và giới hạn
0.1.3](../verification/core-data-0.1.3.md); máy vật lý, quyền/DPI và các nhánh lỗi
giữa chừng còn mở.

## Hai lớp giao diện

1. **Bộ cài native Windows:** hiển thị được khi chưa có WebView2; kiểm tra điều
   kiện, chuẩn bị runtime còn thiếu, cài NuvoKit rồi mở app. Ưu tiên tái sử dụng
   NSIS cho payload; cửa sổ wizard dùng WinForms trên .NET Framework 4.8 có sẵn ở
   Windows 11, theo bố cục đã duyệt.
2. **Lần mở đầu trong NuvoKit:** chạy sau bootstrap, dùng UI kit React; quét máy và
   cho chọn gói tùy chọn. Có thể dùng lõi và cài các gói đó sau.

Không dùng cửa sổ React/Tauri để cài thành phần cần cho chính cửa sổ đó mở.
WebView2 thuộc bộ cài; dữ liệu OCR hoặc engine về sau thuộc dịch vụ gói trong app.
Không tự cài Git/npm/Rust vào máy khách.

## Luồng và trạng thái

| ID | Bước | Thông tin / Hành động |
| --- | --- | --- |
| I00 | Bắt đầu | App/version, current-user, thư mục có thể đổi; **Cài đặt** / **Hủy** |
| I01 | Kiểm tra máy | Windows/kiến trúc, quyền ghi đích, dung lượng, runtime hiện có |
| I02 | Cần WebView2 | Mục đích, nguồn Microsoft, nhu cầu mạng; cài sau khi người dùng đồng ý bắt đầu |
| I03 | Đang tải | Tên gói, nguồn, byte/tổng khi biết; hủy tải nếu thực sự hỗ trợ |
| I04 | Xác minh/cài runtime | Tên thành phần; thanh chờ khi installer con không báo %; không bỏ qua runtime bắt buộc |
| I05 | Cài NuvoKit | File/shortcut, vị trí; giữ dữ liệu người dùng |
| I06 | Hoàn tất | Kiểm tra lại thành công rồi **Mở NuvoKit** / **Đóng** |
| I07 | Lỗi hoặc reboot | Giữ bước lỗi, thông báo dễ hiểu; **Thử lại** / **Đóng**; reboot chỉ khi có yêu cầu thật |
| F01 | Lần mở đầu | Dùng trang Môi trường hiện có; quét phần cứng, không tự cài gói tùy chọn |
| F02 | Sẵn sàng | Dùng lõi ngay; cài thêm qua **Thành phần** |

Nếu WebView2 đã có và phù hợp, báo **Đã có sẵn** và bỏ qua tải/cài. Không yêu cầu
mạng chỉ để xác nhận một thành phần local đã dùng được.

## Tiến trình, xác minh và phục hồi

- Mỗi bước có chờ/đang thực hiện/đã xong/lỗi, có chữ và icon.
- Tên, mục đích và nguồn hiện trên bề mặt chính; kỹ thuật nằm sau **Xem chi tiết**.
- Chỉ hiện %/byte khi có số đo thật. Installer con không báo tiến độ thì dùng
  thanh chờ; không đoán % hoặc đếm ngược.
- Nêu rõ bước chưa thể hủy. Chỉ bật hủy khi host hỗ trợ; không ép dừng installer
  hệ thống rồi coi là đã phục hồi.
- Xác minh nguồn/chữ ký runtime theo cơ chế phù hợp trước chạy; kiểm tra exit code
  và kiểm tra lại registry runtime sau cài. Nhánh máy thiếu runtime đã qua trên
  Sandbox Windows sạch ở 0.1.3.
- Chạy lại kiểm tra phần đã có, giữ dữ liệu và tiếp tục an toàn. Không tự gỡ
  WebView2 dùng chung khi hủy cài NuvoKit.
- Nếu cần tăng quyền, giải thích trước và dùng UAC chuẩn của Windows.
- Ưu tiên installer online hiện có ở vòng đầu. Bản kèm runtime offline chưa chốt;
  cần đo kích thước, bảo trì runtime và kiểm thử riêng.

## Nhánh lỗi cần thiết kế

OS/kiến trúc không hỗ trợ; thiếu dung lượng hoặc quyền ghi; mất mạng khi cần tải;
gói/runtime không xác minh được; installer lỗi; người dùng hủy; app đang chạy;
cần reboot. Lỗi không được hiển thị như đã hoàn tất.

## Phần cần hoàn thiện tiếp

Trình gỡ native NSIS đã có đăng ký với Windows Settings/Control Panel. Bản 0.1.2
thêm thông điệp Việt/Anh, lệnh quiet riêng, lưu ngôn ngữ và kiểm tra đăng ký sau
cài. Mặc định giữ dữ liệu; chỉ xóa AppData tài khoản hiện tại khi chọn ô xóa và
xác nhận cảnh báo. Silent/passive/update luôn giữ; WebView2 dùng chung không bị gỡ.
Xem [quyết định 0007](../decisions/0007-windows-uninstall-data.md),
[hướng dẫn](../installation.md#gỡ-qua-windows-và-lựa-chọn-dữ-liệu) và
[test fixture 0.1.2](../verification/windows-uninstall-0.1.2.md). Bảng 0.1.1 phía trên
ghi phạm vi baseline trước thay đổi này.

- Mẫu 1 đã duyệt và triển khai. Các trạng thái dùng native controls, có thay đổi
  nhỏ về caption/viền so với ảnh; xem [design QA](../../design-qa.md).
- Chưa tạo onboarding React riêng hoặc CI phát hành tự động.
- Preview được phát hành với giới hạn kiểm chứng đã công bố.
- Mở rộng QA máy vật lý, runtime có sẵn, hủy/lỗi/quyền, nhiều tài khoản, bàn phím
  và DPI; Sandbox mới kiểm chứng tập con nêu trong hồ sơ 0.1.3.

## Nguồn kỹ thuật

- [Tauri — Windows Installer](https://v2.tauri.app/distribute/windows-installer/):
  NSIS, tùy biến và các chế độ phân phối WebView2.
- [Microsoft — Distribute WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution):
  kiểm tra runtime trước khi mở WebView, cài online/offline và phạm vi cài.
