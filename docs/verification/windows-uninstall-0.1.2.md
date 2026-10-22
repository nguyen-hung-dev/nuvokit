# Kiểm chứng Windows uninstall 0.1.2

Ngày: **23/10/2026**. Windows 11 x64, bản preview chưa ký số.

## Đã kiểm tra

- `npm run setup:test`: **48** assertions, gồm khớp đường dẫn/version đăng ký
  trình gỡ, tách lệnh interactive và quiet, phát hiện đăng ký thiếu/sai.
- `npm test`: **6** test nghiệp vụ qua.
- `npm run desktop:bundle`: TypeScript, Vite, Rust release, NSIS hai ngôn ngữ và
  bootstrapper WinForms build thành công. `noEmit` đã đưa vào `tsconfig.json`
  để editor và CLI dùng cùng chính sách kiểm tra kiểu.
- `npm run uninstall:test`: **4** kịch bản chạy NSIS thật với executable/dữ liệu
  giả, tên product/bundle/registry ngẫu nhiên và vùng file trong workspace riêng.

| Kịch bản fixture | Chương trình / mục Apps | Dữ liệu local và roaming | File xuất / dữ liệu app bên cạnh |
| --- | --- | --- | --- |
| `/S` | Gỡ | Giữ | Giữ |
| `/P` | Gỡ | Giữ | Giữ |
| `/S /UPDATE` | Gỡ | Giữ | Giữ |
| Lựa chọn xóa đã xác nhận, được giả lập trong fixture | Gỡ | Xóa | Giữ |

Fixture đối chiếu `UninstallString`, `QuietUninstallString`, DisplayVersion và
đăng ký NuvoKit thật trước/sau. Không cài/gỡ bản NuvoKit thật hoặc đọc/xóa dữ liệu
AppData thật. Tên registry riêng của bài test được dọn sau khi thành công; artifact
nằm trong thư mục `output/` bị ignore.

Đã mở UI trình gỡ của fixture bằng tiếng Việt: icon NuvoKit, ô xóa dữ liệu hiển
thị đầy đủ và mặc định chưa chọn. Nhấn **Hủy bỏ** đóng cửa sổ; kiểm tra tiếp xác
nhận executable, mục đăng ký và dữ liệu giả vẫn còn trước khi dọn fixture bằng CLI.

Kiểm thử phát hiện passive có thể dừng ở chọn ngôn ngữ khi outer wizard cài im
lặng. Hook nay lưu `Installer Language` lúc cài; chạy lại nhánh passive đã qua.

## Giới hạn

- Kịch bản xóa đặt lựa chọn **chỉ trong NSIS fixture sau kiểm tra guard silent**;
  nó kiểm tra cleanup của template thật, không giả vờ đã nhấn xác nhận xóa qua UI.
  Production không có cờ test hoặc cờ xóa im lặng.
- Các lượt CLI dùng `_?=` để chờ đúng process fixture. Tham số này làm trình gỡ
  chạy tại chỗ và để lại chính `uninstall.exe`; đây không phải kiểm chứng tự xóa
  file trình gỡ hoặc toàn bộ giao diện gỡ tương tác.
- Chưa có kết quả đủ cho Windows sạch, nhiều tài khoản, khóa file/lỗi quyền trong
  lúc xóa, toàn luồng Settings/Control Panel, hủy cảnh báo qua UI hoặc mọi nhánh
  nâng/hạ phiên bản thật. Không gỡ bản cài thật của chủ dự án để lấy bằng chứng.
- Nhánh thiếu WebView2, ký số và RAM lõi giữ giới hạn của
  [0.1.1](windows-setup-0.1.1.md). Không chạy lại toàn bộ Rust QA cho thay đổi
  packaging/đăng ký gỡ này; code nghiệp vụ Rust không đổi.

Nguồn kỹ thuật: [Tauri NSIS hooks](https://v2.tauri.app/distribute/windows-installer/#extending-the-installer),
[NSIS uninstaller arguments](https://nsis.sourceforge.io/Docs/Chapter3.html#uninstallerusage).
