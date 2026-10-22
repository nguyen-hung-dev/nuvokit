# Kiểm chứng Windows Setup 0.1.1

Ngày: **23/10/2026**. Phạm vi: wizard native mẫu 1, đóng gói và Windows preview.

## Đã kiểm tra

- `npm run check`: TypeScript đạt; frontend production build thành công.
- `npm test`: 6 test nghiệp vụ đạt.
- `cargo test --release --manifest-path apps/desktop/src-tauri/Cargo.toml`:
  10 test native đạt. Lượt debug trước đó hết dung lượng; đã dùng Cargo dọn cache
  build của riêng package rồi chạy lại ở release profile thành công.
- `npm run setup:test`: **43 assertions** đạt: OS/kiến trúc, đường dẫn, ranh giới
  URL Microsoft, hash, chặn unsigned file, lỗi không báo thành công, hủy trước khi
  chạy payload, một job, UI khóa hủy lúc cài runtime, success/retry/network timeout và footer ở cửa sổ thấp.
  Backend giả lập trong test không cài/gỡ phần mềm trên profile thật.
- Tải bootstrapper thật từ endpoint Microsoft; cùng hàm `WinVerifyTrust`/kiểm tra
  nhà ký của wizard xác minh thành công. Không chạy lại runtime trên máy đã có.
- Build payload NSIS và GUI `.exe` thành công. Kiểm tra embedded payload SHA-256
  đạt; bản copy chỉ có một `.exe`, không có `.config` đi kèm, chạy diagnostics đạt.
- Mở GUI release thật: đọc Windows/runtime/dung lượng, sửa đường dẫn thành ổ gốc
  bị chặn, đổi lại thư mục hợp lệ thì phục hồi; mở được cửa sổ chi tiết.
- Kiểm tra hình ảnh runtime/welcome/error/complete với controls thật và backend
  test; không có phần trăm giả ở bước installer ngoài. Xem [design QA](../../design-qa.md).
- Generated notices chứa license text và nguồn của dependencies; đi cùng bản cài.

## Giới hạn được giữ lại

- Khởi tạo Windows Sandbox nhưng chưa thu được bộ kết quả tự động dự kiến; không
  coi đó là bằng chứng đã cài thành công trên Windows sạch hoặc thiếu WebView2.
- Chưa xác nhận toàn luồng download/cài WebView2 trên máy không runtime. Kiểm tra
  chữ ký file thật và unit test không thay thế phép thử này.
- Cài lại/nâng cấp/gỡ và bảo toàn dữ liệu trong máy sạch còn cần kết quả độc lập.
- Bộ cài chưa ký số, không có chứng nhận Store; hiện chỉ phát hành prerelease x64.
- Các số đo RAM của lõi trước đó vẫn vượt mục tiêu 350 MiB; bản này không tuyên
  bố đã tối ưu RAM hoặc xác nhận mọi GPU/engine OCR/AI.
- Screenshot/log/binary QA và inventory máy giữ trong output/target bị ignore;
  không đưa thông tin máy cá nhân vào source hoặc release notes.

Nguồn và hợp đồng: [đặc tả cài Windows](../specs/windows-installation.md),
[quyết định 0006](../decisions/0006-native-setup-release.md).
