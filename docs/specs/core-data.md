# Dữ liệu lõi — backup, restore và migration

Phạm vi 0.1.3: Settings → Dữ liệu; Windows desktop thực, web chỉ minh họa.
Quyết định [0008](../decisions/0008-core-data-safety.md).

- File `.nuvobak`: JSON format 1, định danh `com.nuvokit.desktop`, schema 1/2,
  version ứng dụng, thời gian RFC3339, payload theme/toàn bộ job history và SHA-256
  của payload được serialize theo cấu trúc chuẩn. Hash phát hiện hỏng/chỉnh sửa
  không chủ ý; không phải chữ ký số hay bằng chứng tác giả file.
- Giới hạn 16 MiB, 100.000 dòng lịch sử; reject unknown fields/phiên bản mới hơn,
  theme sai, ID trùng, trạng thái hoặc thời gian không hợp lệ. Không thực thi SQL,
  đọc URL hoặc giải nén đường dẫn từ file backup.
- Backup không mã hóa, không chứa gói OCR, cache/WebView, source/build hoặc file
  xuất ngoài AppData. Không có dữ liệu mini-app vì chúng chưa triển khai.
- Export chỉ báo thành công sau khi ghi/sync file và thay đích. Hủy hộp thoại
  không tạo thành công giả. Không cho export đè vùng dữ liệu app đang quản lý.
- Preview restore hiển thị ngày, phiên bản ứng dụng, theme và số lịch sử; không thay
  dữ liệu. Xác nhận dùng token do host sinh, chỉ áp dụng đúng payload đã kiểm tra,
  không đọc lại file có thể đã đổi. Hủy xóa preview, token cũ không dùng lại được.
- Restore tạo `.nuvobak` trước thay đổi trong `backups/`, rồi thay theme/lịch sử
  bằng một transaction. Gói đã cài được giữ; quét lại kiểm tra gói thật sau restore.
- Migration schema 1 → 2 tạo bản phục hồi trước thay đổi và transaction ghi schema
  log/index/maintenance log. Từ chối schema mới hơn, không tự reset DB lỗi.
- Dung lượng phân nhóm DB (kể cả WAL/SHM), gói, file tạm và bản phục hồi; không coi
  kích thước chưa đọc được là 0. Dọn chỉ cache NuvoKit/file tải dở đã biết, từ chối
  đường dẫn reparse/symlink, không đi theo link ra vùng ngoài.
- Bản phục hồi tự động không nằm trong cache và không bị tự xóa. Có thể mở thư mục
  dữ liệu và chọn lại file phục hồi qua cùng luồng Restore.

Kiểm thử dùng DB/file tổng hợp, gồm migration v1, dữ liệu vượt 20 lịch sử, roundtrip,
checksum/phiên bản/hỏng file, rollback, token, bận job và ranh giới dọn file.
