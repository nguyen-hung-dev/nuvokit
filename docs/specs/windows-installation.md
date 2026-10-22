# Đặc tả — Windows Setup 0.1.1

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
  và kiểm tra lại registry runtime sau cài. Đã có code; nhánh máy thiếu runtime
  chưa có xác nhận đầy đủ trên máy sạch.
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

- Mẫu 1 đã duyệt và triển khai. Các trạng thái dùng native controls, có thay đổi
  nhỏ về caption/viền so với ảnh; xem [design QA](../../design-qa.md).
- Chưa tạo onboarding React riêng hoặc CI phát hành tự động.
- Preview được phát hành với giới hạn kiểm chứng đã công bố.
- Trước phát hành: thử Windows sạch, runtime có/thiếu, offline/hủy/lỗi/quyền,
  cài lại/nâng cấp/gỡ, kiểm tra nguồn/chữ ký, bàn phím và DPI.

## Nguồn kỹ thuật

- [Tauri — Windows Installer](https://v2.tauri.app/distribute/windows-installer/):
  NSIS, tùy biến và các chế độ phân phối WebView2.
- [Microsoft — Distribute WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution):
  kiểm tra runtime trước khi mở WebView, cài online/offline và phạm vi cài.
