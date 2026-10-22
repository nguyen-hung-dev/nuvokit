# NuvoKit

**Your apps. Your data. Your space.**

Nền tảng app cá nhân: người dùng cài những app con mình cần, dùng chung thiết kế,
liên kết dữ liệu và tùy chọn kết nối AI.

[English](README.md) · [Mục lục tài liệu](docs/README.md)

## Trạng thái

Ngày **22/10/2026**: Đã có **Core v1 thử nghiệm nội bộ cho Windows 11 x64**:
kiểm tra môi trường, đọc CPU/RAM/đĩa/GPU, theme sáng/tối, SQLite lưu cài đặt/lịch sử
và cài gói dữ liệu OCR tùy chọn có kiểm tra SHA-256. Chưa có engine OCR, SDK/kho
mini-app hoặc bản phát hành công khai. Bản trình duyệt là preview dùng dữ liệu mẫu.

Đã chốt **Windows trước, làm lõi trước mini-app**: kiểm tra môi trường, quản lý cài
thành phần phụ thuộc và phát hiện phần cứng. Microsoft Store, macOS và web là đích
mở rộng sau. Xem [roadmap](docs/roadmap.md) và [quyết định 0002](docs/decisions/0002-windows-first-core.md).

Lõi dùng React/TypeScript + Tauri/Rust + SQLite, chia sẻ UI/nghiệp vụ qua adapter.
Giấy phép, phạm vi MVP mini-app và ngày phát hành chưa chốt. Dự án hướng đến mã
nguồn mở; hiện chưa chọn và cấp giấy phép nguồn mở.

## Cài vào máy Windows

Bản thử nghiệm hiện dành cho **Windows 11 x64**. Chưa có bản phát hành để tải bộ
cài trực tiếp; hãy build từ source bằng PowerShell. Máy build cần có Git, Node.js
22.12+ kèm npm, Rust 1.95+ dùng toolchain MSVC x64, Visual Studio Build Tools với
workload **Desktop development with C++** và Windows SDK, cùng Microsoft WebView2
Runtime. Xem [công cụ phát triển](docs/development.md#công-cụ-phát-triển).

```powershell
git clone https://github.com/nguyen-hung-dev/nuvokit.git
cd nuvokit
npm ci
npm run desktop:bundle
```

Sau khi build thành công, mở bộ cài và làm theo hướng dẫn trên màn hình:

```powershell
Start-Process -FilePath ".\apps\desktop\src-tauri\target\release\bundle\nsis\NuvoKit_0.1.0_x64-setup.exe" -Wait
```

Bộ cài local chưa ký số, cài cho tài khoản Windows hiện tại. Máy chỉ chạy app đã
cài không cần Node.js, Rust hay Visual Studio. Nếu thiếu WebView2, bộ cài cần
Internet để tải bootstrapper. Chưa kiểm thử cài trên Windows sạch; mức RAM đo được
còn vượt mục tiêu. Xem [kết quả kiểm chứng](docs/verification/core-v1-windows.md).

Để phát triển: sau `npm ci`, chạy `npm run desktop`. Chỉ xem giao diện mẫu trong
trình duyệt: chạy `npm run dev`, mở `http://127.0.0.1:1420/`.

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
