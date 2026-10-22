# Phát triển và chạy Core v1

Phạm vi đang phát triển: Windows 11 x64, app desktop và browser preview.
Xem [đặc tả](specs/core-v1.md), [kiến trúc](architecture.md) và [kiểm chứng](verification/README.md).

Tài liệu này dành cho nhà phát triển chạy/build source. Người dùng nhận bộ cài
đã build xem [hướng dẫn `.exe`](installation.md); không cần toolchain.

## Công cụ phát triển

- Node.js 22.12+ và npm; dùng lockfile trong repo.
- Rust stable **1.95+**, MSVC x64 toolchain và Windows SDK/Visual Studio Build Tools.
- Microsoft WebView2 Runtime để chạy UI desktop.
- Người dùng bản desktop đã build không cần Node/Rust/Visual Studio.

Trong thư mục gốc:

```powershell
npm ci
npm run desktop
```

`npm ci` tự tạo icon build từ SVG trong `design/assets/`; icon sinh ra nằm trong
thư mục được ignore. `npm run desktop` khởi động Vite ở `127.0.0.1:1420` rồi mở app
Tauri. Đóng browser dev server đang dùng cùng port trước khi chạy lệnh desktop dev.

Chỉ xem UI trong trình duyệt:

```powershell
npm run dev
```

Mở `http://127.0.0.1:1420/`. Đây là **preview dữ liệu mẫu**, không phải bản web có
quyền đọc phần cứng/cài native dependency.

## Kiểm tra và build

```powershell
npm run check
npm test
npm run build
npm run native:test
npm run native:check
npm run setup:test
npm run desktop:build
```

Release executable ở `apps/desktop/src-tauri/target/release/nuvokit.exe`.
`npm run desktop:bundle` tạo wizard native `.exe` bọc payload NSIS; bản preview chưa ký số.
Tất cả target/dist/bundle, database, model tải về và output QA đều bị ignore.

## Cài bản đã build vào Windows

Tại thư mục gốc repo, sau khi `npm ci` hoàn tất:

```powershell
npm run desktop:bundle
Start-Process -FilePath ".\output\windows-setup\NuvoKit_0.1.1_x64-setup.exe" -Wait
```

Chỉ chạy lệnh mở bộ cài nếu build thành công. Bộ cài NSIS dùng chế độ current-user;
làm theo wizard để cài rồi mở NuvoKit từ Start menu. Nếu thiếu WebView2, installer
tải bootstrapper qua Internet. Node/Rust/Build Tools chỉ cần cho máy build.
Tên file trên tương ứng version `0.1.1` trong cấu hình Tauri; version sau sẽ có tên
khác. Hướng dẫn clone từ GitHub nằm trong phần nhà phát triển của [README](../README.vi.md).
Bản preview trên [Releases](https://github.com/nguyen-hung-dev/nuvokit/releases/tag/v0.1.1)
chưa ký số. Xem [kiểm chứng](verification/windows-setup-0.1.1.md) trước khi suy ra
khả năng trên Windows sạch. Payload NSIS trong `target/` chỉ dành cho wrapper;
phân phối file GUI ở `output/windows-setup/`.

## Wizard native và đóng gói

`apps/windows-setup/` chứa C# WinForms; compiler .NET Framework của Windows tạo
bootstrapper mà không cần `dotnet` CLI. .NET Framework 4.8 trở lên có sẵn ở Windows
11. `npm run setup:test` chỉ chạy fixtures/backend giả lập, không cài/gỡ trên profile
thật. `npm run desktop:bundle` thu notices, build payload với `tauri.payload.conf.json`,
nhúng payload/hash/logo vào wizard và tạo `SHA256SUMS.txt` trong output.

Payload raw trong `target/` bỏ bootstrap WebView2 vì wizard xử lý trước; chỉ phân
phối GUI `.exe`. Registry/runtime/payload được kiểm tra lại khi chạy tiếp/thử lại.
QA helper integration chỉ dành cho Sandbox dùng một lần; không chạy trên profile
cá nhân vì nó thử cài lại và gỡ app. Các output/test captures đều bị ignore.

## Kiểm chứng native không mở cổng debug

```powershell
& .\apps\desktop\src-tauri\target\release\nuvokit.exe --smoke-test
& .\apps\desktop\src-tauri\target\release\nuvokit.exe --smoke-install
& .\apps\desktop\src-tauri\target\release\nuvokit.exe --verify-core
```

- `--smoke-test`: đọc hệ thống, trả kết quả đã lược bỏ thông tin máy cá nhân.
- `--smoke-install`: thêm tải/hash/cài/cài lại gói ngôn ngữ trong thư mục tạm riêng.
- `--verify-core`: mở WebView thật, xác nhận renderer đã vẽ hai frame, gọi normal
  IPC để lưu/đọc theme, nhận channel cài gói và quét lại. Đo baseline sau 30 giây
  ổn định + 5 giây lấy mẫu, rồi thử WebGPU và đo lại cùng thời lượng. In metrics
  theo từng pha rồi đóng app; tổng thời gian khoảng 70–100 giây tùy mạng. Dùng
  DB/gói trong thư mục tạm riêng; không dùng dữ liệu người dùng. Watchdog 120 giây.

Các chế độ có tải gói cần Internet. Không dump inventory, tài khoản, tên máy hoặc
serial. Chế độ bình thường không tự tải gói hoặc gửi metrics ra mạng. Không có
remote debugging endpoint trong quy trình kiểm chứng này.

## Ranh giới source

```text
apps/desktop/src/              Entry và desktop/browser adapters
apps/desktop/src-tauri/src/    Host Rust, Windows APIs, SQLite, dependency jobs
packages/core/src/            Hợp đồng và nghiệp vụ độc lập nền tảng
packages/ui/src/              App shell, bốn trang, components và theme tokens
design/                       Brief, prompt, mockup và SVG nguồn
```

Browser preview và app desktop dùng cùng UI. Nghiệp vụ không import Tauri; UI gọi
adapter. Đường dẫn/URL gói do host nắm giữ; không cấp shell/file/network trực tiếp
cho frontend. Native plugin/SDK mở rộng bên thứ ba chưa triển khai.

Phép thử WebGPU nằm trong frontend platform adapter, không nằm trong nghiệp vụ
thuần. Metrics cộng working set của app và các WebView2 con; các trang bộ nhớ dùng
chung có thể được tính nhiều lần. Ghi riêng baseline và sau GPU, không bỏ qua kết
quả vượt ngưỡng. Startup đo từ vào hàm `run()` native tới sau hai frame có inventory.
