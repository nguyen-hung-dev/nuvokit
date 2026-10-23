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
Không coi cấu hình workflow là bằng chứng workflow đã chạy. Không cập nhật bản app hoặc
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

## Kết quả phát hành và đường cập nhật thật

- Phát hành public prerelease [v0.1.4](https://github.com/nguyen-hung-dev/nuvokit/releases/tag/v0.1.4)
  từ source commit `a964892cd8c91bf6ca9f3984ce91886aa77afe06`.
- Assets: wizard setup, signed NSIS update + .sig, latest.json, SHA256SUMS.txt và
  THIRD_PARTY_LICENSES.txt. Đã đối chiếu SHA-256 server của đủ 6 assets trước khi
  công bố và ghi `updates/preview.json`; không đưa binary vào source.
- Native `node scripts/verify-updater.mjs remote` đọc feed công khai và tải đúng
  gói từ GitHub mà không cần token user: version 0.1.4, 4.196.865 bytes;
  signatureAndVersionVerified=true, tamperedPackageRejected=true,
  relabeledVersionRejected=true, installerExecuted=false,
  actualUserDataModified=false. Đây là kiểm tra tải/xác minh thật, khác fixture UI.
- Setup SHA-256: `fc4a5ee841076b79e8e3c7d34d0362ec6b24813f7272a1a654fa5169b39e376d`.
  Update SHA-256: `5b1eef1d2a584e83195309c7802236cc7ac9d5e2c5f0600eea905e50a2bceb34`.
- Sandbox cuối `75b1d97b3b4b4c1b811031c7c2d3fde4` kiểm tra đúng các hash này:
  thiếu runtime/toolchain lúc đầu, nâng cấp/cài lại, renderer, data roundtrip,
  gỡ và giữ dữ liệu đều đạt; actual host registration không đổi, VM đã dừng.
- Actions vẫn bị GitHub billing chặn trước bước đầu. Bản này được build/ký và
  phát hành local bằng cùng scripts; chưa có bằng chứng CI chạy thành công.

Bản 0.1.3 cần cài đè 0.1.4 một lần. Khi đã ở 0.1.4, app kiểm tra các bản cao hơn
qua kênh GitHub. Chưa chạy thao tác updater thay app trên máy chủ sở hữu; kiểm tra
installer diễn ra trong Sandbox, download/verify diễn ra với profile Temp.
