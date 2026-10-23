# Mô hình plugin đề xuất

Trạng thái: **Gói/API tối thiểu v1 đã chốt nội bộ** theo [0009](decisions/0009-plugin-ui-package-sdk.md).
Có UI thư viện bản mẫu, SDK client và validator/schema. Chưa có loader, bridge
native, kho online hoặc plugin thực có thể cài. Xem [đặc tả v1](specs/plugin-package-v1.md).

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

Field thực của v1 ở [JSON Schema](../packages/plugin-sdk/manifest.schema.json).
Bảng trên còn gồm hướng mở rộng; commands/events liên app và schema/migration của
plugin chưa nằm trong SDK tối thiểu.

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

Đã có SDK client/schema nội bộ và [tài liệu API v1](specs/plugin-package-v1.md).
Plugin starter có thể chạy, UI playground, CLI đóng gói/xuất bản và kiểm chứng
quyền/guest trên host vẫn là phần tiếp theo.

## Đồng hồ tích hợp sẵn

`plugins/clock/src` hiện được bundle cùng app và dùng repository riêng; ba bố cục
đổi trong Cài đặt Đồng hồ. Đây là module tin cậy của host, chưa phải gói guest
được cài qua SDK. Các command Clock không mở SQL/shell cho plugin bên ngoài.
Xem [0010](decisions/0010-clock-layouts-persistence.md) và [đặc tả](specs/clock-v1.md).

## Cập nhật app/plugin — 0.1.4

Theo [0011](decisions/0011-github-signed-updates.md), app EXE dùng updater có chữ
ký từ GitHub Releases; dev chạy source dùng Git fast-forward với kiểm tra local
edits. Đồng hồ hiện được bundle nên cập nhật cùng app; gói plugin ngoài chưa có
loader/cập nhật độc lập. [Luồng cập nhật](specs/updates-v1.md).
