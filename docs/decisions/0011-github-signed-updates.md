# 0011 — Cập nhật app qua GitHub Releases, dev qua Git

Status: **Accepted — 24/10/2026**. Chủ dự án yêu cầu hiệu chỉnh tài liệu, code cập
nhật và đẩy app/plugin lên GitHub để phân phối được bản mới.

- GitHub lưu source và gói phát hành. App đã cài dùng Tauri Updater ở Rust với
  command giới hạn của host, HTTPS và khóa công khai cố định. Không clone/build
  source hoặc chạy Git/npm trên máy người dùng.
- `updates/preview.json` và `updates/stable.json` trên nhánh main là con trỏ kênh;
  mỗi con trỏ trỏ vào gói NSIS theo phiên bản bất biến trong GitHub Releases.
  Chỉ cập nhật con trỏ sau khi upload đủ và công bố release. Kênh chưa phát hành
  hiển thị thông báo; không coi lỗi mạng là app đang mới nhất.
- Mặc định Thử nghiệm trong chuỗi preview hiện tại. Người dùng chọn kênh trong
  Cài đặt; kiểm tra khi mở app, tự kiểm tra có giới hạn 24 giờ, có nút kiểm tra tay.
  Tải, xác minh và xác nhận cài là các bước riêng. Không tự đóng app khi phát hiện
  phiên bản mới. Từ chối hạ phiên bản, URL ngoài repo và gói sai chữ ký/phiên bản.
- Bản cài lần đầu giữ wizard native độc lập WebView2. Gói cập nhật dùng payload
  NSIS cùng product/current-user/identifier, giữ dữ liệu; giữ bản phục hồi trước
  khi cài và chặn khi có job hoặc phiên Đồng hồ đang chạy/tạm dừng.
- Khóa riêng nằm ngoài repo và trong GitHub Actions Secrets. Chữ ký Tauri bảo vệ
  gói cập nhật, không thay chữ ký Authenticode Windows. Không đưa binary, private
  keys, backup hoặc dữ liệu máy vào source commit.
- Đồng hồ chính chủ hiện bundle cùng host: source ở `plugins/clock`, được cập nhật
  cùng app. Plugin bên ngoài chưa có loader; không tuyên bố cập nhật gói độc lập.
- Dev chạy source dùng Git fast-forward với kiểm tra cây làm việc; không tự reset,
  rebase, stash hoặc thay mã đang sửa. Dev cài `.exe` dùng updater như user.

Luồng/giới hạn: [đặc tả cập nhật](../specs/updates-v1.md).
Nguồn: [Tauri Updater](https://v2.tauri.app/plugin/updater/),
[Tauri GitHub pipeline](https://v2.tauri.app/distribute/pipelines/github/).
