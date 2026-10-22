# NuvoKit

**Your apps. Your data. Your space.**

Nền tảng app cá nhân: người dùng cài những app con mình cần, dùng chung thiết kế,
liên kết dữ liệu và tùy chọn kết nối AI.

[English](README.md) · [Mục lục tài liệu](docs/README.md)

## Trạng thái

Ngày **23/10/2026**: Đã có **bản preview 0.1.3 cho Windows 11 x64**:
kiểm tra môi trường, đọc CPU/RAM/đĩa/GPU, theme sáng/tối, SQLite lưu cài đặt/lịch sử
và cài gói dữ liệu OCR tùy chọn có kiểm tra SHA-256. Chưa có engine OCR, SDK/kho
mini-app. Đã có bộ cài theo mẫu 1 được duyệt; bản trình duyệt vẫn dùng dữ liệu mẫu.
Trong Cài đặt có backup/restore, dung lượng và dọn file tạm. SQLite tự giữ bản
phục hồi trước khi khôi phục hoặc nâng cấp cấu trúc dữ liệu.

Đã chốt **Windows trước, làm lõi trước mini-app**: kiểm tra môi trường, quản lý cài
thành phần phụ thuộc và phát hiện phần cứng. Microsoft Store, macOS và web là đích
mở rộng sau. Xem [roadmap](docs/roadmap.md) và [quyết định 0002](docs/decisions/0002-windows-first-core.md).

Lõi dùng React/TypeScript + Tauri/Rust + SQLite, chia sẻ UI/nghiệp vụ qua adapter.
Giấy phép, phạm vi MVP mini-app và ngày phát hành ổn định chưa chốt. Dự án hướng đến mã
nguồn mở; hiện chưa chọn và cấp giấy phép nguồn mở.

## Cài đặt

### Người dùng thông thường: cài qua .exe

Bản thử nghiệm dành cho **Windows 11 x64**. Máy chạy app đã cài không cần Git,
Node.js/npm, Rust hay Visual Studio; người dùng không phải chạy lệnh terminal.

**Tải bộ cài:** [NuvoKit 0.1.3 x64 Setup](https://github.com/nguyen-hung-dev/nuvokit/releases/download/v0.1.3/NuvoKit_0.1.3_x64-setup.exe) · [Ghi chú phát hành](https://github.com/nguyen-hung-dev/nuvokit/releases/tag/v0.1.3). Đây là bản preview chưa ký số. File ZIP source code không phải bộ cài.

1. Nhận `NuvoKit_<version>_x64-setup.exe` từ trang phát hành của dự án hoặc chủ dự án.
2. Nhấp đúp file, chọn thư mục và làm theo wizard cài đặt.
3. Cho phép bộ cài chuẩn bị Microsoft WebView2 nếu máy còn thiếu; bước này hiện
   cần Internet. Mặc định app được cài cho tài khoản Windows hiện tại.
4. Mở NuvoKit từ Start menu. Các gói dữ liệu tùy chọn được cài thêm trong app.

Wizard native kiểm tra Windows, thư mục và dung lượng; chuẩn bị WebView2 nếu thiếu;
sau đó cài và xác minh NuvoKit. Mỗi bước có tên/trạng thái; tải có tiến độ thật khi
biết tổng dung lượng, installer ngoài dùng thanh chờ. Xem [hướng dẫn người dùng](docs/installation.md)
và [phạm vi kiểm chứng](docs/verification/core-data-0.1.3.md).

Vào **Cài đặt → Dữ liệu & sao lưu** để lưu file `.nuvobak` hoặc xem trước bản khôi
phục. File chứa cài đặt và toàn bộ lịch sử, không mã hóa và không kèm gói/cache.
Khôi phục/nâng cấp dữ liệu đều tạo bản phục hồi trước khi thay đổi.

Để gỡ, chọn **Settings → Apps → Installed apps → NuvoKit → Uninstall**, hoặc
**Control Panel → Programs and Features**. Trình gỡ mặc định giữ dữ liệu. Chọn
**Xóa cả dữ liệu NuvoKit** (Windows tiếng Anh: **Delete the application data**) rồi
xác nhận cảnh báo để xóa cài đặt, lịch sử, gói tải thêm và cache của tài khoản hiện
tại. WebView2 dùng chung và file xuất bên ngoài AppData được giữ. Cài bản mới đè
lên bản cũ để cập nhật trình gỡ và giữ dữ liệu hiện có.

### Nhà phát triển: chạy và build từ source

Máy phát triển cần Git, Node.js 22.12+ kèm npm, Rust 1.95+ dùng toolchain MSVC x64,
Visual Studio Build Tools với workload **Desktop development with C++** và Windows
SDK, cùng Microsoft WebView2 Runtime. Xem [công cụ phát triển](docs/development.md#công-cụ-phát-triển).

```powershell
git clone https://github.com/nguyen-hung-dev/nuvokit.git
cd nuvokit
npm ci
npm run desktop
```

Để tạo bộ cài Windows local, chạy:

```powershell
npm run desktop:bundle
```

Đợi build thành công rồi mới mở bộ cài:

```powershell
Start-Process -FilePath ".\output\windows-setup\NuvoKit_0.1.3_x64-setup.exe" -Wait
```

Tên file trên tương ứng version hiện tại `0.1.3`. Source và build nằm trong thư
mục clone đã chọn; cache công cụ và dữ liệu app có thể nằm trong hồ sơ Windows.
Các bản clone dùng chung dữ liệu app khi cùng định danh. Chỉ xem UI mẫu trong
trình duyệt: `npm run dev`, mở `http://127.0.0.1:1420/`. Các lệnh khác nằm trong
[hướng dẫn phát triển](docs/development.md).

## Trải nghiệm mong muốn

- App con hoàn chỉnh: đồng hồ, đọc sách, công việc, thu chi và các tiện ích khác.
- Giao diện đẹp, thống nhất; mỗi app có dữ liệu, lịch sử và khả năng xuất dữ liệu.
- Cài những gì cần dùng; nhiều theme phát triển trên cùng bộ thành phần.
- App phối hợp qua API/sự kiện có quyền rõ ràng.
- Chức năng thông thường không bắt buộc GPU mạnh hoặc phí AI.
- Agent chỉ dùng dữ liệu được cấp quyền và chuẩn bị thay đổi có thể xem lại.

Quy trình đầu tiên AI đề xuất: **Chọn sách → chạy đồng hồ → ghi phiên đọc/tiến độ
→ xem kết quả tuần**. Thêm Công việc để kiểm tra đồng hồ dùng lại được trong ngữ
cảnh khác. Thứ tự MVP này chưa được người dùng xác nhận.

## Đọc tài liệu

1. [Định hướng sản phẩm](docs/product.md).
2. [Danh mục 50 module](docs/module-catalog.md).
3. [Kiến trúc lõi và hướng mở rộng](docs/architecture.md), [mô hình plugin](docs/plugins.md).
4. [Lộ trình](docs/roadmap.md), [nghiên cứu](docs/research.md), [quyết định](docs/decisions/README.md).
5. [Thiết kế giao diện](design/README.md): brief, prompt và ảnh mockup.
6. [Đặc tả Core v1](docs/specs/core-v1.md), [cách chạy](docs/development.md) và
   [hồ sơ kiểm chứng](docs/verification/README.md).

Hướng dẫn cộng tác: [CONTRIBUTING.md](CONTRIBUTING.md). Hướng dẫn cho AI:
[AGENTS.md](AGENTS.md). Trên máy Windows đã có công cụ phát triển theo hướng dẫn:
chạy `npm ci`, sau đó `npm run desktop`. Chỉ xem UI mẫu: `npm run dev`.
