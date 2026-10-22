# 0003 — Kiến trúc Core v1

- Status: **Accepted cho bản lõi nội bộ**.
- Date: **2026-10-22**.
- Source: Chủ dự án yêu cầu triển khai đặc tả, mockup, PoC, sau đó chốt kiến trúc
  và xây lõi. Quyết định dựa trên build và kiểm chứng thực tế, không phải phát hành.

## Context

Lõi cần UI đồng bộ, đọc phần cứng Windows, quản lý phụ thuộc và mở đường sang
macOS/web. PoC đã chạy được inventory native, SQLite, IPC/channel, cài gói có hash
và phép thử WebGPU. UI dùng chung hoạt động trong browser preview.

## Decision

- Chọn **modular monolith + ports/adapters** trong một npm workspace.
- UI: React + TypeScript + Vite, components và CSS tokens dùng chung, light/dark.
- Nghiệp vụ/hợp đồng: TypeScript thuần trong `packages/core`, không import DOM,
  Tauri hoặc API Windows; kiểm tra WebGPU thuộc platform adapter.
- Desktop host: **Tauri 2 + Rust**, Windows 11 x64 là mục tiêu nội bộ đầu tiên.
- Persistence: SQLite tích hợp qua host Rust; schema có phiên bản, giao diện
  không thực thi SQL tùy ý. Runtime/model tải về nằm ngoài source repo.
- Web dùng cùng UI nhưng adapter preview có dữ liệu mẫu và không cài native gói.
  Storage/sync web thực chưa được quyết định bởi việc tạo preview.
- Command chức năng được cấp riêng cho local main window. Khả năng cài thêm
  mini-app là SDK/runtime riêng về sau, không phải native plugin Tauri tải động.

## Consequences

Đã có source và lệnh build/test thật; không cần Node/Rust trên máy người dùng bản
desktop đã build. Giữ ranh giới để triển khai adapter macOS/browser về sau, nhưng
chưa tuyên bố tương đương tính năng hoặc bảo đảm hiệu năng giữa các nền tảng.

PoC chứng minh startup/IPC/dữ liệu và khả năng build. **Mục tiêu RAM 350 MiB đã bị
vượt trong các lượt đo ban đầu**; hồ sơ ghi cả baseline và sau GPU, tiếp tục tối ưu
và đo lại. Chọn kiến trúc cho vòng phát triển nội bộ không đồng nghĩa đã đạt toàn
bộ điều kiện hiệu năng hoặc sẵn sàng phát hành.

Xem [hồ sơ kiểm chứng](../verification/core-v1-windows.md) và
[đặc tả Core v1](../specs/core-v1.md). Electron vẫn là phương án cần đánh giá lại
nếu yêu cầu runtime plugin/Chromium về sau không phù hợp với host đã chọn.

Giấy phép lõi, MVP mini-app, public SDK, chứng nhận Store và lịch phát hành vẫn còn
mở. Bộ cài local chưa ký; không tạo remote, push hoặc publish theo quyết định này.
