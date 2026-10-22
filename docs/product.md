# Định hướng sản phẩm

Cập nhật: **22/10/2026**. Tên dự án: **NuvoKit**; repository: `nuvokit`.

## Bài toán

Người dùng có nhiều việc cá nhân cần theo dõi nhưng thường phải dùng các công cụ
rời rạc. NuvoKit hướng đến một app hoàn chỉnh với các mini-app cài theo nhu cầu,
giao diện thống nhất và dữ liệu phối hợp được.

Đây là giả thuyết sản phẩm cần kiểm chứng với người dùng. Chưa có dữ liệu retention,
khách hàng trả phí hoặc bằng chứng thị trường cho NuvoKit.

## Định hướng đã có

- Windows là nền tảng triển khai đầu tiên; làm lõi kiểm tra môi trường, cài thành
  phần phụ thuộc và phát hiện phần cứng trước mini-app. Xem
  [quyết định 0002](decisions/0002-windows-first-core.md) và [roadmap](roadmap.md).
- Giao diện đẹp; nhiều theme phát triển trên một bộ thành phần chung.
- App con có chức năng, dữ liệu, lịch sử và khả năng xuất dữ liệu riêng.
- Có đồng hồ, đọc sách, công việc, thu chi, OCR và nhiều nhóm tiện ích khác.
- Người dùng chỉ cài các module cần dùng.
- Dữ liệu liên kết qua giao diện có quyền để app khác và agent khai thác.
- AI tùy chọn; thao tác thông thường không bắt buộc GPU mạnh hoặc phí AI.
- Dự án hướng đến cộng đồng mã nguồn mở và có thể phát triển dịch vụ trả phí sau này.

## Quy trình đầu tiên đề xuất

Chọn sách → bắt đầu đồng hồ → tạm dừng/kết thúc → xác nhận trang đã đọc → lưu phiên
và tiến độ → xem kết quả tuần.

Thêm Công việc làm app mẫu thứ ba để kiểm tra khả năng dùng lại Đồng hồ trong ngữ
cảnh khác. Không suy từ timer đang chạy thành người dùng đã đọc hoặc làm việc.

Thứ tự này chưa được duyệt. [Danh mục 50 module](module-catalog.md) là tầm nhìn dài
hạn; không phải phạm vi của bản đầu hoặc cam kết một người tự duy trì tất cả.

## Giả thuyết khác biệt

| Giả thuyết | Cách kiểm chứng |
| --- | --- |
| Dùng ngay với ít cấu hình | Người mới hoàn thành việc đầu tiên mà không viết mã |
| App phối hợp tốt | Không nhập lại cùng dữ liệu giữa sách, timer và task |
| Thiết kế nhất quán | Theme, bàn phím và trạng thái lỗi hoạt động trên nhiều app |
| Dữ liệu bền vững | Xuất/khôi phục và cài lại plugin không làm mất lịch sử |
| Agent có căn cứ | Câu trả lời dẫn về bản ghi; số liệu tính từ dữ liệu gốc |
| SDK dễ tham gia | Developer ngoài tạo được mini-app mà không sửa lõi |

## Chưa chốt

Nhóm người dùng đầu tiên; phạm vi Windows/ngôn ngữ phát hành công khai;
giấy phép; ngân sách; MVP mini-app; ngày ra mắt; tên miền; nhà cung cấp AI; giá và
dịch vụ thu phí. Microsoft Store, macOS và web là đích mở rộng, chưa có lịch hoặc
cam kết cùng chức năng với Windows.

Lõi nội bộ hiện triển khai cho Windows 11 x64, UI tiếng Việt, theo
[đặc tả Core v1](specs/core-v1.md) và [stack đã chọn](decisions/0003-core-v1-stack.md).

Mục tiêu kiểm chứng và lộ trình ở [roadmap](roadmap.md). Không hứa số sao GitHub,
doanh thu hoặc tiến độ trước khi có dữ liệu thực tế.
