# Đồng hồ v1 — kiểm chứng source chưa phát hành

Ngày **23/10/2026**. Không nằm trong bộ cài 0.1.3 trên GitHub Releases.
[Đặc tả](../specs/clock-v1.md) · [Quyết định](../decisions/0010-clock-layouts-persistence.md).

## Kết quả

- TypeScript `npm run check`: đạt. `npm test`: **51/51** (20 bài nghiệp vụ Clock,
  31 bài lõi/SDK/catalog có sẵn).
- Rust release tests: **29/29**, gồm 6 bài Clock: persistence/reopen và CAS,
  ghi state+lịch sử cùng transaction/rollback/dedupe, backup hơn 50 phiên,
  khôi phục và vô hiệu ghi cũ, tương thích backup cũ, chặn restore khi đang chạy,
  migration schema v2 → v3 kèm bản phục hồi đọc được bằng format cũ.
- `cargo clippy --release --all-targets -- -D warnings`: đạt.
- Vite production và Tauri Windows `build --no-bundle`: đạt. Build native dùng
  `CARGO_TARGET_DIR` riêng trên ổ C do ổ E gần đầy. Cache build cũ được giữ nguyên
  sau khi thao tác dọn bị hệ thống kiểm tra chặn; không đưa cache vào source.
- `--verify-data`: exit 0, preview read-only, roundtrip, token một lần, file hỏng,
  recovery, migration v1 và dọn cache đều đạt; `actualUserDataModified=false`.
- UI browser thực: ba bố cục/theme, mode, pause/resume, reload giữ trạng thái,
  hoàn tất một lần, kiểm tra hai tab xung đột và đọc lại, responsive 1505/1024/390.
  Console errors/warnings: không có trong lượt kiểm tra cuối.
  [Báo cáo hình ảnh](../../design-qa.md), ảnh và cặp so sánh ở output/clock-qa/ (ignored).

## Native WebView / IPC thật

Chạy `--verify-core` với SQLite và WebView profile riêng trong Temp. Renderer dùng
command bình thường để bắt đầu một phiên tổng hợp, đổi layout/theme, đọc lại ID và
mốc thời gian, hoàn tất/lưu lịch sử rồi đọc lại. Không dùng profile chủ máy.

| Chỉ số | Baseline | Sau WebGPU |
| --- | --- | --- |
| UI ready | 634 ms | 634 ms |
| Quét hệ thống | 1 ms | 1 ms |
| CPU idle | 0.0% | 0.0% |
| Working set app + WebView descendants | 429.9 MiB | 475.7 MiB |
| IPC channel events | 45 | 45 |
| Theme persistence / Clock persistence | true / true | true / true |
| Functional checks | true | true |
| Memory budget <=350 MiB | false | false |
| Core budgets overall | false | false |

Exit **1** do vượt ngân sách RAM; không gọi đây là full native QA đạt. Đây là phép
đo toàn app, không tách mức tăng do Đồng hồ; giới hạn RAM đã có ở lượt thư viện
trước. stderr khi thoát có cảnh báo WebView `Chrome_WidgetWin_0` unregister error
1412; app thoát sau hai pha và các kiểm tra chức năng hoàn tất. Chưa giải quyết
ngân sách RAM trong phạm vi giao diện Đồng hồ.

## Ranh giới và cách thử an toàn

Bản build local có thể mở bằng `--temporary-profile` để thử UI với dữ liệu dùng
một lần. Không chạy build mới vào profile thật chỉ để lấy bằng chứng: schema 3
khiến bản app schema 2 cũ không mở được dữ liệu đã nâng cấp. Bộ cài chưa được tạo
hoặc phát hành lại trong lượt này; không suy ra Store/macOS đã được kiểm chứng.

Browser dùng IndexedDB theo origin, không dùng SQLite/backup Windows. Chưa có
thông báo OS/âm thanh/wake timer hay guest loader SDK; đồng hồ tính lại theo timestamp
khi app mở lại. Sleep/thay giờ hệ thống được kiểm tra bằng bài nghiệp vụ timestamp,
không có thử sleep/wake vật lý của Windows trong lượt này.
