# Đồng hồ tích hợp — v1

Phạm vi bản 0.1.4, theo [quyết định 0010](../decisions/0010-clock-layouts-persistence.md).

## Luồng dùng

Mở Đồng hồ từ sidebar, thẻ Tổng quan, Thư viện hoặc Đã cài. Nút **Cài đặt Đồng hồ**
và mục cùng tên trong Cài đặt chung mở bộ chọn ba bố cục, theme Sáng/Tối/Theo ứng
dụng. Áp dụng ngay và lưu trên thiết bị; không đặt lại phiên đang chạy.

- Tập trung: preset 25/45/60 phút; hợp đồng dữ liệu chấp nhận 1–180 phút.
- Đếm ngược: nhập giờ/phút/giây, preset 5/10/15 phút; 1 giây đến 23:59:59.
  Khi tổng về 0, UI giữ tối thiểu 1 giây. Không sửa thời lượng hoặc đổi chế độ
  khi đang chạy/tạm dừng; kết thúc phiên trước để thay đổi.
- Bấm giờ: bắt đầu từ 00:00, giới hạn phiên 7 ngày.
- Bắt đầu, tạm dừng, tiếp tục, xác nhận kết thúc/lưu; hết thời gian tự lưu một lần.
  Tên tối đa 120 ký tự, ghi chú 500 ký tự. Phiên chưa đặt tên dùng tên chế độ.
  Lịch sử đã lưu chỉ đọc; tên/ghi chú nhập sau kết thúc dành cho phiên tiếp theo.
- Hiển thị 50 phiên gần nhất, mở một phiên để xem chi tiết. Không thêm lịch sử
  giả vào profile mới. Backup giữ toàn bộ lịch sử trong giới hạn file.

## Thời gian và dữ liệu

State v1 lưu layout/theme/mode/status, thiết lập thời lượng, elapsed tích lũy,
mốc bắt đầu đoạn chạy, ID/mốc bắt đầu phiên và tên/ghi chú. UI cập nhật khi chạy;
không ghi DB theo mỗi tick. Thời gian tạm dừng được loại trừ. Mở lại sau deadline
tạo đúng một bản ghi hoàn tất với deadline gốc. Đổi giờ hệ thống có thể tác động
timestamp; không coi đây là đồng hồ chuyên dụng đo thời gian đơn điệu xuyên reboot.

Desktop: `preferences['builtin.clock.v1']` chứa state/revision, `clock_history`
chứa phiên đã lưu. Command chỉ nhận DTO đóng, kiểm tra giới hạn, revision CAS và
transaction state+lịch sử. Browser dùng database IndexedDB `nuvokit-clock`,
hai object store state/history, transaction tương đương; dữ liệu riêng theo origin.
Browser không nhận dữ liệu SQLite của app Windows và chưa có export/restore file.

Lỗi đọc không tự reset dữ liệu. Lỗi ghi khóa thao tác, giữ hàng chờ trong cửa sổ
để thử lại; đóng cưỡng bức trước khi ghi xong có thể mất thay đổi chưa lưu.
Khi xung đột revision, người dùng có thể đọc lại bản trên thiết bị sau xác nhận.

## Ranh giới

Module được bundle trong app; các plugin khác vẫn là UI demo. Không phải chứng
minh sandbox, SDK host hoặc cài/cập nhật/gỡ gói bên ngoài. Không đọc dữ liệu Sách,
Công việc hay tự cập nhật tiến độ. Không có âm thanh, thông báo OS, wake timer
hoặc bảo đảm tiến trình tiếp tục thực thi khi Windows đóng/suspend app.

Backup format 2/schema 3 và tương thích bản cũ: [dữ liệu lõi](core-data.md).
