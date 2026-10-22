# Brief — Lõi Windows

Ngày tạo: **22/10/2026**. Trạng thái: **đã có mockup D02 light/dark để review**.
Hành vi bản lõi đầu tiên theo [đặc tả Core v1](../docs/specs/core-v1.md).

## Căn cứ

- [Định hướng sản phẩm](../docs/product.md).
- [Giai đoạn 0 của roadmap](../docs/roadmap.md#giai-đoạn-0--lõi-windows-trước-mini-app).
- [Ưu tiên Windows và lõi](../docs/decisions/0002-windows-first-core.md).
- [Kiến trúc Core v1](../docs/architecture.md) và [stack đã chọn](../docs/decisions/0003-core-v1-stack.md).

## Mục tiêu trải nghiệm

Người dùng mở NuvoKit, hiểu máy đang sẵn sàng đến đâu, biết thành phần còn thiếu
và có thể cài chúng qua giao diện. Các tác vụ tải/cài/quét có tiến trình và cách
xử lý lỗi rõ ràng. Chức năng cơ bản vẫn dùng được khi không có GPU hoặc AI.

## Màn hình ưu tiên tạo mockup

| Mã | Màn hình | Nội dung và thao tác chính |
| --- | --- | --- |
| D01 | Khung app | Thanh tiêu đề, điều hướng, vùng nội dung, Settings và theme; chỗ cho mini-app về sau |
| D02 | Môi trường | Tổng quan sẵn sàng, thời điểm kiểm tra, thành phần bắt buộc/tùy chọn, nút kiểm tra lại và khắc phục |
| D03 | Thành phần phụ thuộc | Tên, mục đích, phiên bản, dung lượng, nguồn; chọn cài, tiến trình, kết quả và thử lại |
| D04 | Phần cứng | CPU, RAM, đĩa, các GPU/VRAM khi biết; kết quả thử tăng tốc và khả năng theo tác vụ |

D02 là màn hình đầu tiên được đề xuất để khám phá hình ảnh vì thể hiện đồng thời
khung app và giá trị của lõi. Thứ tự thiết kế và bố cục cụ thể có thể điều chỉnh.

## Trạng thái cần thiết kế

- Kiểm tra lần đầu, đang kiểm tra, sẵn sàng và cần cài thêm.
- Đang tải/cài, bị gián đoạn, thất bại, thử lại và cần khởi động lại.
- Không có GPU rời, thông tin phần cứng không đọc được hoặc backend không hỗ trợ.
- Offline, thiếu dung lượng và không được cấp quyền cài đặt.
- AI/OCR chưa cài nhưng các chức năng cơ bản vẫn khả dụng.

Tách **có thiết bị**, **runtime tương thích** và **tác vụ đã thử chạy thành công**.
Không hiển thị mọi GPU là đã sẵn sàng cho AI. WebView2 hoặc runtime cần trước khi
UI mở được thuộc bước bootstrap/bộ cài nếu stack được chọn cần chúng.

## Hướng hình ảnh để khám phá

- App desktop chỉn chu, phân cấp rõ; nội dung đọc được và thao tác chính dễ tìm.
- Dùng cùng một hệ spacing, typography, icon, controls, bảng và thẻ trạng thái.
- Khám phá light/dark trên cùng bố cục; palette, font, logo và theme chưa chốt.
- Status có chữ và icon, không chỉ dựa vào màu; có focus bàn phím rõ ràng.
- Cân nhắc cửa sổ thu nhỏ và Windows DPI; kích thước ảnh thử ban đầu đề xuất
  **1440 × 1000 px**, không coi đó là kích thước cửa sổ tối thiểu đã quyết định.
- Ngôn ngữ mockup ban đầu: tiếng Việt, tên sản phẩm giữ đúng **NuvoKit**.
- Mỗi ảnh thể hiện một màn hình/trạng thái rõ; giữ thông tin hữu ích, tránh nhồi
  tất cả màn hình thành một dashboard.

## Nội dung và dữ liệu mẫu

Nhãn thao tác gợi ý: **Kiểm tra lại**, **Cài thành phần còn thiếu**, **Xem chi tiết**,
**Thử lại**, **Bỏ qua lúc này**. Chỉ hiển thị nút phù hợp với trạng thái trong ảnh.

Dữ liệu máy, phiên bản, dung lượng và tiến trình phải là giả lập; ghi rõ trong
prompt và danh mục ảnh. Không suy cấu hình tối thiểu của sản phẩm từ ví dụ minh họa.
Không đưa đường dẫn cá nhân, tài khoản, key hoặc hồ sơ thật vào mockup.

## Tiêu chí review

- Người mới nhận ra trạng thái máy và thao tác tiếp theo.
- Chữ, bố cục, nhãn trạng thái và progress đủ rõ để chuyển thành UI thực tế.
- Cùng components/theme giữa các màn hình; các trạng thái lỗi có cách xử lý.
- Ghi lại chữ bị AI tạo sai, nội dung thiếu và phần chưa thể hiện trong danh mục
  mockup trước khi chọn ảnh làm tham chiếu triển khai.
