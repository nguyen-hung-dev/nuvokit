# 0009 — Giao diện thư viện, gói plugin và SDK tối thiểu

- Status: **Accepted cho hợp đồng v1 và triển khai UI**.
- Date: **2026-10-23**.
- Source: Chủ dự án duyệt cả ba ảnh app chính/thư viện, yêu cầu chuyển bố cục và
  chốt định dạng gói/SDK tối thiểu.

## Decision

- Tổng quan theo mẫu 1; Thư viện/Đã cài chuyển giữa lưới (mẫu 2) và danh sách có
  chi tiết (mẫu 3). Dùng chung tìm kiếm, bộ lọc, lựa chọn và theme. Giữ các trang
  môi trường/phần cứng/thành phần/dữ liệu lõi hiện có.
- Source plugin chính chủ ở `plugins/` trong monorepo; SDK ở
  `packages/plugin-sdk`. Mỗi plugin có ID/version và gói phát hành riêng. Plugin
  cộng đồng có thể ở repo của tác giả. Repo source không phải đơn vị cài đặt.
- Gói `.nuvoplugin` là ZIP format 1 chứa manifest và web assets đã build; không
  clone Git, cài npm hoặc chạy build/install script trên máy người dùng.
- API version 1 tối thiểu: context, theme, get/set/remove dữ liệu riêng, dispose.
  Hai quyền `storage.read`, `storage.write`; không có SQL/shell/file/network hay
  native module tùy ý. API version khác package version và version app lõi.
- Host xác thực gói/nguồn, tương thích, danh tính và quyền. SDK frontend chỉ là
  client contract, không phải ranh giới bảo mật. Guest phải cô lập khỏi app shell.
- Dữ liệu tách khỏi gói; cài/cập nhật có staging, kiểm tra, chuyển phiên bản và
  phục hồi. Không đưa backup hoặc dữ liệu người dùng vào source/gói.

## Scope and consequences

Lượt này có UI tương tác dùng catalog tổng hợp, JSON Schema, validator, TypeScript
SDK client và ví dụ manifest. Cài/mở/gỡ trên trang thư viện chỉ là bản mẫu trong
RAM, không nhận gói, tải hoặc chạy mã bên ngoài. Các nút nói rõ phạm vi đó.

Chưa có ZIP loader, host storage của plugin, bridge guest, kiểm tra chữ ký, kho
online hoặc mini-app thực. Trước mở runtime phải kiểm chứng cô lập, quyền, lifecycle,
migration/backup và rollback; không suy từ SDK type rằng host đã thực thi các quyền.
Không quyết định giấy phép hoặc phát hành bản EXE mới trong quyết định này.

Hợp đồng: [Plugin package & SDK v1](../specs/plugin-package-v1.md).
