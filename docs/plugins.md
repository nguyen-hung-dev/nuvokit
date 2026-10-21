# Mô hình plugin đề xuất

Trạng thái: **Đề xuất thiết kế**, chưa có SDK hoặc định dạng gói ổn định.

## Một app con hoàn chỉnh

Có trang riêng, trạng thái, dữ liệu, lịch sử, thao tác và xuất dữ liệu. Có thể đóng
góp widget, lệnh nhanh, sự kiện và công cụ cho agent. Không chỉ là shortcut mở website.

## Thành phần manifest dự kiến

| Thành phần | Mục đích |
| --- | --- |
| ID, tên, phiên bản, giấy phép | Danh tính, cập nhật và điều khoản |
| Phiên bản SDK/host tương thích | Tránh nạp plugin không tương thích |
| UI entry và vị trí hiển thị | Trang, widget, command hoặc file view |
| Schema và migration | Dữ liệu thuộc app và cách nâng cấp |
| Quyền cần dùng | Đọc/ghi dữ liệu, mạng, file và dịch vụ nền |
| Commands/events/tools | Hợp đồng tích hợp với app khác và agent |
| Khả năng theo nền tảng | Desktop, web, mobile; nêu phần không hỗ trợ |

Tên field và API chưa được chuẩn hóa; bảng này không phải SDK có thể sử dụng.

## Vòng đời

Cài → kiểm tra tương thích/quyền → bật → chạy → tắt → cập nhật/rollback hoặc gỡ.
Tắt phải dọn subscription/job/timer của plugin; lỗi một plugin không được dẫn đến
mất dữ liệu toàn workspace. Gỡ phải có lựa chọn giữ/xuất dữ liệu.

## UI, quyền và dữ liệu

- Dùng components/tokens chung, hỗ trợ theme và bàn phím.
- Plugin sở hữu namespace; giao tiếp bằng hợp đồng rõ thay vì đọc/ghi tùy tiện.
- Quyền đọc/ghi tách biệt; quyền mạng/file/tác vụ nền nêu rõ phạm vi.
- Cập nhật tăng quyền cần được thể hiện trước khi áp dụng.
- Runtime phải thực thi quyền qua bridge và môi trường guest phù hợp.
- Chỉ mở kho bên thứ ba sau khi kiểm chứng cô lập, cập nhật và phục hồi dữ liệu.

## Agent và OCR

- Agent đọc qua API/MCP được cấp quyền, trả lời kèm nguồn bản ghi.
- Ghi dữ liệu qua bản nháp có schema, xác nhận và lịch sử; không tự tính/đoán số dư.
- Ảnh/PDF → đọc chữ → trích trường → đối chiếu trùng → bản nháp → xác nhận ghi sổ.
- Nội dung tài liệu là dữ liệu, không trở thành chỉ dẫn thực thi cho agent.
- Coding agent có thể hỗ trợ viết plugin từ SDK và dữ liệu mẫu; code sinh ra phải
  qua cùng kiểm tra và quyền như các plugin khác.
- Không mặc định một gói thuê bao coding agent cung cấp API miễn phí cho app.

## Bộ công cụ cho developer về sau

Plugin starter, UI playground, tài liệu API có phiên bản, dữ liệu demo, hướng dẫn
kiểm tra quyền/tương thích và quy trình xuất bản. Chưa có các công cụ này trong repo.
