# Cài đặt — Dữ liệu & sao lưu

Triển khai 0.1.3 tiếp tục UI kit D02 sáng/tối hiện có. Không có ảnh mockup mới
được ghi là đã duyệt; đây là ghi chú bố cục và trạng thái của màn hình đã triển khai.

- Đặt sau Diện mạo, trước thông tin phiên bản, trong trang Cài đặt.
- Bốn ô dung lượng: Cài đặt & lịch sử, Gói đã tải, File tạm, Bản phục hồi.
  Bố cục chuyển từ bốn sang hai cột khi cửa sổ hẹp.
- Nhóm Sao lưu & khôi phục nêu rõ dữ liệu có trong file, gói/cache bị loại và file
  không mã hóa. Chọn file dùng hộp thoại Windows native.
- Khôi phục mở hộp xác nhận có tên file, ngày, phiên bản, số lịch sử và theme;
  focus mặc định Hủy. Escape/hủy giữ dữ liệu. Host tạo recovery trước khi thay đổi.
- Dọn file tạm có xác nhận và phạm vi cụ thể; nút disabled khi dung lượng bằng 0.
- Đang xử lý khóa các thao tác xung đột; lỗi và thành công có thông báo đọc được.
  Browser preview ghi dữ liệu minh họa và khóa thao tác native.
- QA dùng adapter/file tổng hợp và profile tạm; ảnh thực nghiệm giữ trong output
  bị ignore, không chụp/phát hành thư mục hoặc dữ liệu thật.

[Hợp đồng dữ liệu](../docs/specs/core-data.md) ·
[Kết quả kiểm chứng](../docs/verification/core-data-0.1.3.md).
