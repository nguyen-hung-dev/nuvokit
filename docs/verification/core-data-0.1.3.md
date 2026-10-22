# Kiểm chứng dữ liệu và Windows 0.1.3

Ngày: **23/10/2026**. Windows preview chưa ký số; không coi toàn bộ giai đoạn 0 đã hoàn tất.

## Dữ liệu và build

- TypeScript, Vite production, Rust release/Clippy (`--all-targets -- -D warnings`) qua.
  JavaScript production **82,68 KiB gzip**, dưới ngưỡng 150 KiB của PoC.
- **23 test Rust**, gồm snapshot đầy đủ >20 lịch sử, WAL/schema 1 → 2, bản phục hồi,
  rollback khi insert bị lỗi, chặn migration/restore nếu không tạo được recovery,
  giữ backup cũ khi export thất bại, hash/format/schema/file lỗi, token dùng một
  lần và payload không đổi sau preview, mutual exclusion và junction/cache boundaries.
- **6 test nghiệp vụ**, **48 assertions Setup**, **4 kịch bản NSIS fixture** qua.
- `--verify-data` của executable production chạy roundtrip/migration/cache bằng
  dữ liệu tự sinh trong Temp, không dùng DB của người dùng. Không có đường dẫn
  tùy ý hoặc thao tác reset AppData trong cờ này.

## Giao diện

- Browser preview giữ các thao tác dữ liệu thật ở trạng thái disabled và ghi rõ dữ liệu mẫu.
- Fixture dùng component/adapter contracts thật với backend giả: preview đọc
  metadata 30 lịch sử; Hủy/Escape không restore; mặc định focus Hủy; xác nhận
  cập nhật theme/thông báo recovery; dọn tạm cập nhật dung lượng và disable khi 0;
  lỗi prepare hiển thị alert và không mở hộp xác nhận. Hủy export không báo thành
  công; export thành công hiện thông báo. Kiểm tra sáng/tối và 1024 px, không tràn ngang.
- Native với `--temporary-profile`: mở Cài đặt, nhận dung lượng qua IPC, mở/hủy
  hộp thoại Save native, không báo lưu thành công khi hủy. Chưa tự động hoàn tất
  toàn bộ thao tác Save/Restore qua file picker native; không coi fixture browser
  là bằng chứng click vào dữ liệu thật.
- Hồ sơ kiểm thử tách cả SQLite và WebView cookies/localStorage/cache. Không mở
  app bình thường trên dữ liệu thật của chủ dự án để thử migration.

## Windows Sandbox

Runner dùng run ID, artifact hashes và báo cáo guest riêng. Windows 11 build 26100,
không tìm thấy Git/Node/npm/Rust/Cargo/C++ compiler; vGPU tắt. Hai lượt chốt cùng
artifact đều nhận báo cáo guest thành công và runner đã dừng đúng Sandbox của mình:

| Chế độ / run ID | Kết quả thực tế |
| --- | --- |
| Online · `6b9d4dec0a10474583e1ad55bf7b68f1` | Runtime ban đầu thiếu; cài WebView2 thật; nâng cấp payload phát hành 0.1.2 → 0.1.3; cài lại; smoke native; roundtrip/migration dữ liệu; renderer/IPC; gỡ giữ dữ liệu giả |
| Offline · `e17a2734306b4b4389d49556386b88c1` | Runtime ban đầu thiếu; báo lỗi chuẩn bị runtime; không cài app, giữ marker dữ liệu. Không coi đây là cài thành công khi không có runtime |

SHA-256 bộ cài đã thử:
`327202c635c8e72e165f636d6b6be18c20b88f6f91c8deebe2cd20c0689444bf`.
Payload: `b68df678114cace079ba9514850f6999a601f9d2f62fe55ca6f60fbb7e2c75aa`.
Executable trong NSIS: `4b14c141d9edaa6176399d39818e2e8ec164f58a065f204f6b15a0b2affd54bb`.
RAM chưa đạt mục tiêu. Báo cáo/binary phân tích chỉ ở `output/windows-sandbox/`
bị ignore; không phát hành dữ liệu fixture, log hay hồ sơ máy cá nhân.

## Lỗi đóng gói phát hiện và sửa

Sandbox phát hiện EXE sau cài khác file standalone đúng 3 byte: marker bundle
`UNK` của Tauri thành `NSS` trong NSIS. Tauri trả file standalone về dạng cũ sau
bundle nên hash file đó sau build không phải hash executable đã đóng gói.

Hook compile-time nay ghi SHA-256 đúng lúc makensis đọc binary; builder yêu cầu
metadata mới, đúng product/version. Cả payload và executable sau cài vẫn được
kiểm tra hash đầy đủ. Script Node này chỉ chạy trên máy build, không trên máy khách.
Đây là sửa lỗi có thể khiến wizard preview trước báo sai hash dù NSIS đã cài app.

## Giới hạn

Chưa kiểm chứng đầy đủ trên nhiều máy vật lý/cấu hình yếu, ARM, nhiều tài khoản,
Control Panel/Settings toàn bộ bằng UI, mất điện hoặc mọi tình huống hết đĩa/quyền
giữa chừng. RAM ≤350 MiB, ký số, CI phát hành, Store/macOS/web thực còn mở.
Backup là JSON không mã hóa và chỉ chứa dữ liệu lõi hiện có; không có dữ liệu
mini-app vì mini-app chưa được triển khai. Schema 2 không mở bằng app schema 1 cũ.
