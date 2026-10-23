# Luồng cập nhật NuvoKit v1

Quyết định [0011](../decisions/0011-github-signed-updates.md). Bản đầu có updater:
**0.1.4 Windows 11 x64**. Người dùng 0.1.3 trở về trước phải tải/chạy bộ cài mới
một lần; các bản cũ không tự nhận một chức năng chưa có trong executable của chúng.

## Người dùng cài bằng EXE

1. Mở app: đọc kênh/metadata đã kiểm tra, kiểm tra GitHub nếu lần kiểm tra thành
   công trước đã quá 24 giờ. Có thể kiểm tra ngay trong Cài đặt → Cập nhật ứng dụng.
2. Có bản mới: hiển thị phiên bản/nội dung thay đổi, đánh dấu Mới ở Cài đặt.
3. Chọn Tải cập nhật: hiện byte/% khi có tổng, tiến trình chờ khi không có tổng;
   hủy tải được kiểm tra giữa các lượt đọc mạng, kết nối có timeout.
4. Xác minh gói với khóa công khai và phiên bản được ký; chỉ bật Cài đặt và mở
   lại khi hợp lệ. Không cài gói bị sửa hoặc metadata ghép bản mới với gói cũ.
5. Người dùng xác nhận cài; chờ job/ghi dữ liệu, kết thúc phiên Đồng hồ. Host kiểm
   tra lại, giữ snapshot .nuvobak, mở NSIS passive rồi thoát. NSIS nâng cấp tại chỗ,
   giữ AppData và mở lại app. Lỗi migration giữ dữ liệu/bản phục hồi để xử lý.

Chỉ release x64/NSIS đã cài hỗ trợ cài updater. Browser/source debug không cài;
release chạy rời hoặc `--temporary-profile` có thể kiểm tra/xác minh nhưng bị chặn
cài. Không tải/cài toolchain và không bật updater cho kênh Store/MSIX chưa hỗ trợ.
Không tự hạ app sau khi schema đã nâng cấp; rollback cần xem tương thích dữ liệu.

## Nguồn và dữ liệu

- Kênh: `https://raw.githubusercontent.com/nguyen-hung-dev/nuvokit/main/updates/{preview|stable}.json`.
  File chỉ xuất hiện sau release đầu của kênh. Không dùng `/releases/latest` cho
  prerelease; stable và preview tách riêng.
- Metadata Tauri: version, notes, pub_date, platforms.windows-x86_64.url/signature.
  URL bắt buộc trỏ đúng `releases/download/v<version>/NuvoKit_<version>_x64-update.exe`
  của repo chính. HTTPS và chữ ký/phiên bản đều bắt buộc; tối đa gói 64 MiB.
- `update-state.json` là metadata vận hành trong AppData: kênh, lần kiểm tra và
  manifest để giữ thông báo sau khi mở lại. Không chứa khóa riêng; loại khỏi
  backup nội dung. Gói tải được giữ trong bộ nhớ phiên, đóng app phải tải lại.
- Command updater riêng chỉ mở cho main window. Không cấp updater/shell cho SDK
  guest. Cài đặt giữ single-job guard, khóa ghi state của host và reverify chữ ký.
- Không có mạng: tiếp tục dùng app, báo kiểm tra thất bại và cho thử lại; không
  báo giả đang ở bản mới nhất. Kênh chưa có release báo rõ chưa có bản phát hành.

## Dev chạy source

```powershell
npm run source:check
npm run source:update
npm run desktop
```

`source:check` fetch origin và báo ahead/behind, không thay file source.
`source:update` yêu cầu đúng origin, branch có upstream, cây làm việc sạch và chỉ
fast-forward; sau đó npm ci + TypeScript check. Không tự xử lý local edits/divergence.
Chạy/build Tauri sau cập nhật vẫn cần toolchain được mô tả trong development.md.

## Phát hành

1. Tăng version root/desktop/core/UI/Tauri/Cargo, cập nhật lockfiles và release notes.
2. Kiểm tra/build/test, commit/push source lên main; Đồng hồ nằm trong cùng repo.
3. Chạy workflow **Release Windows** bằng workflow_dispatch, chọn preview/stable.
   Workflow chỉ chạy từ main, dùng Secrets cho khóa ký và không chạy trên PR.
4. Build tạo wizard `*-setup.exe`, payload có chữ ký `*-update.exe` + `.sig`,
   latest.json, SHA256SUMS.txt và notices trong output/windows-setup (ignored).
5. `publish-release.mjs` tạo draft theo commit, upload đủ, công bố rồi mới cập
   nhật file metadata kênh qua GitHub Contents API. Không thay executable đã công bố.
   Feed là file source nhỏ; binary chỉ nằm ở Release assets.

Khóa ký được tạo ngoài repo; CI cần `TAURI_SIGNING_PRIVATE_KEY` và
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Cần chủ dự án tự lưu bản sao khóa ở nơi an
toàn để giữ khả năng ký các phiên bản sau. Không dán khóa vào issue, chat hoặc Git.

Kiểm chứng an toàn: `--verify-update-local` kiểm tra gói build và từ chối gói sửa;
`--verify-update` tải/xác minh gói thật trên GitHub. Hai chế độ dùng Temp, không cài
thay app thật. Test nâng cấp/cài/gỡ chỉ dùng Windows Sandbox hoặc fixture cô lập.

Nếu release đã công bố nhưng bước ghi feed thất bại, chạy publisher cùng version
với `--refresh-feed`: chỉ đọc manifest đã công bố và ghi lại con trỏ; không thay
executable công khai. Bước kiểm chứng remote thử lại có giới hạn để chờ CDN.
