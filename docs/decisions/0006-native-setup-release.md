# 0006 — Wizard native mẫu 1 và phát hành Windows preview

- Status: **Accepted**.
- Date: **2026-10-23**.
- Source: Chủ dự án chọn mẫu 1, yêu cầu triển khai code, phát hành `.exe` trên
  GitHub và commit/push source mới. Quyết định này tiếp nối phạm vi design-only
  của [0005](0005-installation-design-review.md).

## Decision

- Target: [wizard light v01](../../design/mockups/windows-setup-wizard-light-v01.png).
- Dùng bootstrapper WinForms/C# chạy trên .NET Framework 4.8 có sẵn trong Windows
  11; không cần WebView2 hay toolchain để mở cửa sổ cài. App chính giữ Tauri/Rust.
- Wizard nhúng payload NSIS current-user của Tauri. Payload nội bộ bỏ bước tải
  WebView2; bootstrapper chịu trách nhiệm kiểm tra, tải từ Microsoft, xác minh
  Authenticode/nhà ký, chờ installer và kiểm tra lại trước khi chạy payload.
- Giữ tiến trình đúng dữ liệu thật: byte/% khi biết tổng, marquee khi installer
  con không cung cấp tiến độ. Không hủy cưỡng bức installer con.
- Xác minh SHA-256 payload và executable sau cài trước khi báo thành công/mở app.
- Phát hành **0.1.1 Windows preview**, unsigned, dưới dạng GitHub prerelease.
  `.exe`, checksum và notices nằm ở Releases; build output không nằm trong Git.
- Lần mở app dùng trang Môi trường hiện có. Chưa thêm onboarding React riêng.

## Consequences

WinForms chỉ thuộc bộ cài Windows; không thay kiến trúc app hoặc ranh giới adapter.
OS cung cấp .NET Framework, Segoe UI và controls; không đóng gói một web runtime
để cài web runtime khác. Các kênh macOS/Store cần bộ cài và kiểm chứng riêng.

Build dùng compiler .NET Framework của Windows, không yêu cầu `dotnet` CLI trên
máy khách. Native controls có khác biệt nhỏ về caption/viền với ảnh AI; giữ bố
cục, màu, nội dung và trạng thái. Xem [QA](../../design-qa.md) và
[kiểm chứng](../verification/windows-setup-0.1.1.md). Không coi preview là đã hoàn
tất QA Windows sạch, ký số hoặc mục tiêu RAM của toàn bộ lõi.

Nguồn nền tảng: [Microsoft — .NET đi kèm Windows](https://learn.microsoft.com/en-us/dotnet/framework/install/versions-and-dependencies),
[WebView2 distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution).
