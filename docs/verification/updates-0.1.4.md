# Cập nhật GitHub — kiểm chứng 0.1.4

Ngày 24/10/2026. [Đặc tả](../specs/updates-v1.md), [quyết định 0011](../decisions/0011-github-signed-updates.md).

## Đã kiểm tra trước phát hành

- TypeScript và 62 bài test JS/TS đạt; Rust release 33 bài đạt, Clippy không warning.
- Build wizard 0.1.4 và NSIS updater có chữ ký thành công. Kiểm tra gói build bằng
  khóa công khai đã nhúng: chữ ký/phiên bản hợp lệ, gói sửa byte bị từ chối;
  không chạy installer hoặc sửa dữ liệu chủ máy.
- Setup fixtures: 48 assertions đạt. NSIS fixtures: silent/passive/update và
  selected-cleanup đạt; actualNuvoKitModified=false.
- Windows Sandbox run `18f151cf230f425abf0d72632d7fcee8`: Windows build 26100,
  thiếu WebView2 lúc đầu, không có git/node/npm/Rust/cl; cài runtime, nâng cấp từ
  bản trước, cài lại, renderer, backup/restore và gỡ đều đạt; dữ liệu được giữ,
  VM đã dừng. Ngân sách RAM vẫn chưa đạt, không đánh dấu toàn bộ hiệu năng đạt.
- `source:check` fetch/báo ahead-behind; `source:update` từ chối checkout có edits,
  không thay file source. Không dùng reset/rebase hoặc tự stash.

## Phạm vi cập nhật

Đồng hồ bundle cùng app, được đưa vào release này; SDK/manifest và catalog plugin
ngoài vẫn chưa phải guest loader. Updater chỉ thay app bằng payload có chữ ký của
repo chính; không chạy Git/npm trên máy user và không cập nhật độc lập guest ZIP.

Bằng chứng runtime nằm trong output/update-qa/ và output/windows-sandbox/ (ignored).
GitHub release/feed và CI sẽ được ghi kết quả sau khi phát hành thực tế; không coi
cấu hình workflow là bằng chứng workflow đã chạy. Không cập nhật bản app hoặc
AppData thật của chủ máy để lấy kết quả kiểm chứng.

## Giao diện và dịch vụ phát hành

- Browser fixture kiểm tra lỗi mạng, chữ ký sai, hủy/tải lại, guard Clock/job,
  xác nhận/để sau và hai kênh. Counter cài giả lập tăng 1; không chạy installer.
  Console warning/error: không có ở lượt kiểm tra cuối. Capture ignored:
  output/update-qa/ui-fixture.png.
- Source app/Clock/SDK/design đã commit và push `6799d4b` lên main.
- Workflow run 40000761829 không khởi chạy job vì GitHub báo tài khoản bị khóa
  do billing. Không coi CI là đạt; dùng cùng script build/ký/phát hành tại máy
  để hoàn tất release. Không thay đổi phương thức thanh toán hoặc giới hạn account.
