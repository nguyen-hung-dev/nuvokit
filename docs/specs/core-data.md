# Dữ liệu lõi — backup, restore và migration

Bộ cài 0.1.3 dùng schema 2/format 1. Source chưa phát hành bổ sung Đồng hồ,
schema 3/format 2 theo [0010](../decisions/0010-clock-layouts-persistence.md).
Settings → Dữ liệu hoạt động trên Windows; browser chưa có backup file.
Quyết định [0008](../decisions/0008-core-data-safety.md).

- File `.nuvobak`: JSON format 2 (đọc cả format 1), định danh `com.nuvokit.desktop`, schema 1/2/3,
  version ứng dụng, thời gian RFC3339, payload theme/toàn bộ job history và SHA-256
  và dữ liệu Đồng hồ (state, toàn bộ lịch sử) của payload được serialize theo cấu trúc chuẩn. Hash phát hiện hỏng/chỉnh sửa
  không chủ ý; không phải chữ ký số hay bằng chứng tác giả file.
- Giới hạn 16 MiB, 100.000 dòng mỗi loại lịch sử; reject unknown fields/phiên bản mới hơn,
  theme sai, ID trùng, trạng thái hoặc thời gian không hợp lệ. Không thực thi SQL,
  đọc URL hoặc giải nén đường dẫn từ file backup.
- Backup không mã hóa, không chứa gói OCR, cache/WebView, source/build hoặc file
  xuất ngoài AppData. Đồng hồ tích hợp nằm trong backup; chưa có dữ liệu guest plugin khác.
- Export chỉ báo thành công sau khi ghi/sync file và thay đích. Hủy hộp thoại
  không tạo thành công giả. Không cho export đè vùng dữ liệu app đang quản lý.
- Preview restore hiển thị ngày, phiên bản ứng dụng, theme, số lịch sử và số phiên Đồng hồ; không thay
  dữ liệu. Xác nhận dùng token do host sinh, chỉ áp dụng đúng payload đã kiểm tra,
  không đọc lại file có thể đã đổi. Hủy xóa preview, token cũ không dùng lại được.
- Restore tạo `.nuvobak` trước thay đổi trong `backups/`, rồi thay theme/lịch sử
  và Đồng hồ bằng một transaction. Bản format 1 không chứa Đồng hồ giữ dữ liệu
  Đồng hồ hiện tại. Chặn restore khi có phiên running/paused; tăng revision sau
  restore để chặn ghi từ cửa sổ cũ. Gói đã cài được giữ; quét lại kiểm tra gói thật sau restore.
- Migration schema 1/2 → 3 tạo bản phục hồi trước thay đổi và transaction ghi schema
  log/index/maintenance log và bảng `clock_history`. Từ chối schema mới hơn, không tự reset DB lỗi.
- Dung lượng phân nhóm DB (kể cả WAL/SHM), gói, file tạm và bản phục hồi; không coi
  kích thước chưa đọc được là 0. Dọn chỉ cache NuvoKit/file tải dở đã biết, từ chối
  đường dẫn reparse/symlink, không đi theo link ra vùng ngoài.
- Bản phục hồi tự động không nằm trong cache và không bị tự xóa. Có thể mở thư mục
  dữ liệu và chọn lại file phục hồi qua cùng luồng Restore.

Kiểm thử dùng DB/file tổng hợp, gồm migration v1, dữ liệu vượt 20 lịch sử, roundtrip,
checksum/phiên bản/hỏng file, rollback, token, bận job và ranh giới dọn file.

Updater giữ snapshot `recovery-update-*.nuvobak` trước khi thay app, chặn khi có
job/Clock active. `update-state.json` là cache vận hành (kênh/lần kiểm tra/manifest),
không nằm trong backup nội dung và không chứa khóa ký riêng.
