# 0007 — Gỡ qua Windows và lựa chọn giữ/xóa dữ liệu

- Status: **Accepted**.
- Date: **2026-10-23**.
- Source: Chủ dự án yêu cầu gỡ bằng Settings/Control Panel, có giao diện chọn xóa
  dữ liệu do app tạo.

## Decision

- Tái sử dụng trình gỡ native NSIS của Tauri; giữ đăng ký current-user trong
  `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\NuvoKit`.
- `UninstallString` mở giao diện. `QuietUninstallString` riêng dùng `/S` và giữ
  dữ liệu. Cài đặt chỉ báo hoàn tất khi file trình gỡ và đăng ký/version/đường dẫn khớp.
- Mặc định giữ dữ liệu. Khi chọn xóa, xác nhận thêm trước khi gỡ bất kỳ file hoặc
  registry/shortcut nào; hủy cảnh báo dừng thao tác.
- Xóa hai vùng AppData theo bundle identifier, chỉ cho tài khoản hiện tại. Không
  gỡ WebView2 dùng chung, source/build hoặc file xuất bên ngoài vùng AppData.
- Silent/passive/update luôn giữ dữ liệu. Không thêm cờ xóa im lặng vào production.
- Dùng thông điệp tiếng Việt/Anh trong NSIS; ngôn ngữ theo Windows và lựa chọn đã
  lưu của NSIS. Không thêm WebView2 hoặc một runtime khác để mở trình gỡ.
- Bản cũ cần cài bản mới đè lên để nhận trình gỡ mới. Không tự sửa bản cài đang
  dùng trong lúc phát triển/kiểm thử.

## Verification

Kiểm thử đăng ký, giữ/xóa dữ liệu giả, exports và vùng dữ liệu bên cạnh; đối chiếu
đăng ký NuvoKit thật trước/sau. Fixture chỉ dùng tên registry ngẫu nhiên và file
trong `output/uninstall-qa/`; không gỡ hay xóa dữ liệu app thật của chủ dự án.
Xem [kiểm chứng 0.1.2](../verification/windows-uninstall-0.1.2.md).

Nguồn: [Tauri NSIS customization](https://v2.tauri.app/distribute/windows-installer/#extending-the-installer)
và [NSIS scripting reference](https://nsis.sourceforge.io/Docs/Chapter4.html).
