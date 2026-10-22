# Nhật ký quyết định

Mỗi quyết định ghi ngày, trạng thái, lý do và tác động. Chỉ mục **Accepted** mới là
quyết định đã chốt. Gợi ý trong tài liệu không tự trở thành quyết định.

| ID | Quyết định | Trạng thái |
| --- | --- | --- |
| [0001](0001-project-bootstrap.md) | Tên NuvoKit và khởi tạo repo tài liệu local | Accepted — 22/10/2026 |
| [0002](0002-windows-first-core.md) | Windows trước; lõi môi trường, phụ thuộc và phần cứng trước mini-app | Accepted — 22/10/2026 |
| [0003](0003-core-v1-stack.md) | Modular monolith, React/TypeScript, Tauri/Rust và SQLite cho Core v1 | Accepted cho lõi nội bộ — 22/10/2026 |
| [0004](0004-public-source-repository.md) | Repository GitHub công khai, chỉ đưa nội dung dự án đã rà soát | Accepted — 22/10/2026 |
| [0005](0005-installation-design-review.md) | Tách cài `.exe`/developer; chỉ tài liệu và design, duyệt trước code | Accepted về phạm vi — 22/10/2026 |
| [0006](0006-native-setup-release.md) | Duyệt mẫu 1, bootstrapper native + NSIS và phát hành preview `.exe` | Accepted — 23/10/2026 |

## Quyết định còn mở

- Người dùng và quy trình đầu tiên; phạm vi MVP.
- Phạm vi Windows phát hành công khai và thứ tự mở rộng macOS/web; mục tiêu nội bộ
  hiện tại là Windows 11 x64. Mobile chưa thuộc phạm vi hiện tại.
- Giấy phép lõi, SDK/UI kit và điều khoản đóng góp.
- Sandbox/bridge, schema và API plugin ổn định.
- Nhà cung cấp AI/OCR, sync và mô hình dịch vụ.
- Tên miền, lịch phát hành và giá.

Khi chốt thêm, tạo file theo mẫu tên `NNNN-short-title.md` với Context, Decision,
Consequences và Status; cập nhật chỉ mục. Không sửa lịch sử quyết định đã chốt mà
không ghi quyết định thay thế.
