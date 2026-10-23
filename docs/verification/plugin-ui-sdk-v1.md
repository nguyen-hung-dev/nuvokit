# Kiểm chứng UI thư viện và SDK v1 — chưa phát hành

Ngày **23/10/2026**, source phát triển sau 0.1.3. Phạm vi UI + hợp đồng/client SDK,
không phải kiểm chứng cài/chạy plugin bên ngoài.

## Kiểm tra tự động

- TypeScript qua; **31 test**: 6 core, 23 manifest/SDK, 2 catalog.
- SDK: manifest đóng/giới hạn UTF-8, field/version/path/quyền sai, compatibility,
  permission increase; khóa storage, JSON không hợp lệ/quá cỡ/cycle, lỗi host,
  unsubscribe/dispose và đóng transport khi cleanup lỗi.
- Catalog: tìm tiếng Việt có/không dấu, phối hợp category/installed, sort không
  thay catalog gốc; không có URL tải gói hoặc đường nối đến native installer.
- Vite production: JS **88,46 KiB gzip**, CSS khoảng **6,16 KiB gzip**. Không thêm
  dependency bên ngoài; thêm workspace SDK local. Windows release executable build qua.

## Browser UI

In-app browser không có ở phiên này; dùng tab Chrome kiểm thử riêng bằng Computer
Use. Không sử dụng tab/tài khoản có sẵn của người dùng.

- Tổng quan → Thư viện → Đã cài; core Môi trường/Cài đặt vẫn mở được. Các nút thao
  tác dữ liệu thật ở browser preview vẫn disabled.
- Tìm `dong ho` ra Đồng hồ; đổi lưới/danh sách giữ kết quả; nhóm Đọc & học chỉ Sách;
  từ khóa không có ra empty state, Xóa bộ lọc khôi phục 6 plugin; sort A–Z đổi thứ tự.
- Chọn Lịch, đọc quyền, mở xác nhận: focus Hủy; Escape không thêm. Xác nhận thêm
  đổi danh sách Đã cài từ 3 → 4; Mở hiện thông tin bản mẫu; gỡ xác nhận về 3.
- Theme sáng/tối; hai bố cục dùng chung trạng thái. Reload vẫn giữ lựa chọn bố cục
  qua localStorage; các trạng thái cài/gỡ chỉ ở RAM, không ghi core SQLite.
- Viewport **1505×1045**, **1024×900**, **390×844**. Cửa sổ hẹp dùng một cột/scroll
  dọc; không tràn ngang theo scrollWidth/clientWidth. Ở 1024 mở được xác nhận từ
  vùng chi tiết phía dưới danh sách; 390 hiển thị sidebar icon và grid một cột.
- Console sau lượt tương tác và reload: không có error/warning.

Ảnh, snapshot/comparison và log chỉ ở `output/plugin-ui/` bị ignore. Browser capture
có độ trễ compositor ngay sau resize; đã đọc lại layout và chụp ở lượt sau khi ổn
định, không dùng ảnh thu nhỏ/stale làm bằng chứng responsive.

## Native regression

Executable mới chạy `--verify-core` trên SQLite/WebView profile tạm riêng:

| Pha | UI ready | Scan | IPC events | Theme / gói tùy chọn | Working set |
| --- | --- | --- | --- | --- | --- |
| Baseline | 622 ms | 1 ms | 39 | Qua | 407,1 MiB |
| Sau WebGPU | 622 ms | 1 ms | 39 | Qua; WebGPU passed | 443,5 MiB |

Cả hai pha `functionalChecksPassed: true`, CPU idle đo 0%. **RAM vẫn vượt mục tiêu
350 MiB**, `coreBudgetsPassed: false`, executable exit 1; không gọi đây là toàn bộ
performance QA đạt. Có diagnostic WebView unregister class 1412 lúc teardown;
hai pha chức năng đã hoàn tất. Không dùng DB của bản NuvoKit chủ dự án đang cài.
Phép đo chức năng thực hiện trước lượt polish CSS cuối; không đổi logic IPC sau đó.

## Giới hạn

Không có ZIP reader, xác minh chữ ký, cô lập guest, host storage/quota/quyền hoặc
plugin thật để kiểm chứng. SDK transport test là mock. Không chạy lại cài/nâng
cấp/gỡ Windows hoặc xuất bản EXE mới cho lượt UI/SDK này. Chưa QA screen reader,
DPI, nhiều OS/máy vật lý hoặc đo RAM chuyên biệt của plugin host.

Đối chiếu hình ảnh và các điều chỉnh: [design QA](../../design-qa.md).
