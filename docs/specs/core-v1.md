# Đặc tả Core v1 — Windows

Ngày: **22/10/2026**. Phạm vi: bản lõi thử nghiệm nội bộ, trước mini-app.
Yêu cầu xuất phát từ [quyết định 0002](../decisions/0002-windows-first-core.md)
và yêu cầu triển khai đặc tả, mockup, PoC rồi xây lõi.

## Phạm vi đầu tiên

- Mục tiêu triển khai/kiểm chứng ban đầu: **Windows 11 x64**. Windows ARM, Windows
  10, macOS, Store và web đầy đủ cần kiểm chứng riêng; không tự nhận hỗ trợ.
- Ngôn ngữ UI: tiếng Việt; theme sáng/tối dùng chung components và tokens.
- Bốn trang: Môi trường, Phần cứng, Thành phần, Cài đặt.
- Nghiệp vụ và hợp đồng TypeScript dùng chung; desktop adapter gọi host native.
  Browser adapter chỉ là preview dữ liệu mẫu, ghi rõ trong UI.

## Luồng đầu tiên

Mở app → kiểm tra môi trường → xem cấu hình/trạng thái → mở chi tiết gói còn thiếu
→ xác nhận cài → tải/kiểm tra/cài → kiểm tra lại danh sách và lịch sử.

Thiếu gói OCR tùy chọn không ngăn dùng lõi. Không có GPU vẫn đọc cấu hình, quản lý
phụ thuộc và lưu cài đặt được. Không yêu cầu toolchain Node/Rust/Python cho người
dùng bản desktop đã build.

## Hợp đồng màn hình môi trường

| Dữ liệu | Cách thể hiện |
| --- | --- |
| Hệ điều hành | Tên, phiên bản, kiến trúc, phù hợp mục tiêu Windows 11 x64 hay không |
| CPU | Tên và số luồng; không suy hiệu năng từ tên thiết bị |
| RAM | Tổng và khả dụng tại thời điểm quét |
| Đĩa | Dung lượng trống của volume chứa dữ liệu app; không đọc được thì chưa xác định |
| GPU | DXGI adapters, tên, bộ nhớ riêng nếu có, đánh dấu adapter phần mềm |
| Thành phần | ID, tên, mô tả, phiên bản, bắt buộc/tùy chọn, trạng thái, khả năng cài |
| Lần kiểm tra | Thời điểm và thời gian quét; inventory phần cứng không ghi vào repo/log lịch sử |

Trạng thái thành phần: `ready`, `missing`, `error`, `unknown`. Thành phần bắt buộc
phải `ready` và OS phải phù hợp để banner báo lõi sẵn sàng. Không biến `unknown`
thành `ready` hoặc dung lượng không xác định thành 0.

WebView2 được bộ cài Windows bootstrap trước UI nếu thiếu. Màn hình đang chạy chỉ
đọc phiên bản đăng ký và báo chưa xác định nếu không tìm được, không tự tải WebView2
trong một UI vốn chưa mở được.

## Phép thử đồ họa

Phép thử WebGPU gửi bốn số nguyên qua compute shader và đối chiếu kết quả nhân đôi.
Kết quả gồm thành công/không hỗ trợ/thất bại và thời gian; tối đa 10 giây, giải
phóng buffer/device. Chạy bất đồng bộ để UI tiếp tục phản hồi.

Thành công chỉ xác nhận phép tính WebGPU trong môi trường hiện tại. Không bảo đảm
backend dùng GPU vật lý, tương thích CUDA/DirectML, hoặc engine/model OCR/AI chạy
được. Khả năng mỗi engine phải được kiểm tra khi thực sự tích hợp engine đó.

## Danh mục phụ thuộc đầu tiên

| ID | Thành phần | Quy tắc |
| --- | --- | --- |
| `webview2` | Microsoft WebView2 | Bắt buộc, bootstrap trước UI; không cài qua màn hình gói |
| `sqlite` | SQLite tích hợp | Bắt buộc, kiểm tra truy cập DB cài đặt/lịch sử |
| `ocr-vie-fast` | Dữ liệu Tesseract tiếng Việt | Tùy chọn, tải đúng file đã pin, chưa cung cấp engine OCR |

Gói tùy chọn lấy từ repo chính chủ `tesseract-ocr/tessdata_fast`, commit
`87416418657359cb625c412a48b6e1d6d41c29bd`, file `vie.traineddata`, **531275 byte**.
SHA-256: `79df64caf7bcfb2a27df5042ecb6121e196eada34da774956995747636d5bfa1`.
Giấy phép thành phần Apache-2.0 đi kèm gói; không phải giấy phép lõi NuvoKit.

## Cài đặt và phục hồi

- UI chỉ gửi ID trong danh mục; không gửi URL, đường dẫn hay lệnh shell tùy ý.
- Hiện mục đích, nguồn, phiên bản, dung lượng, giấy phép và phạm vi cài trước khi
  người dùng xác nhận. Không cài driver, sửa PATH hoặc yêu cầu quyền admin.
- Một job tại một thời điểm. Trạng thái: tải → xác minh → cài → hoàn thành;
  có nhánh thất bại/hủy và tiến trình qua IPC channel của lệnh gọi.
- Chỉ tải HTTPS từ URL đã pin, không đi theo redirect; giới hạn dung lượng và kiểm
  SHA-256 trước khi đưa vào dùng. Timeout kết nối 10 giây, toàn lượt tải 30 giây.
- Hủy kiểm tra giữa các lần đọc; lần đọc mạng đang chờ có thể chờ tới timeout.
  Khi đã qua bước commit cuối, hoàn thành được ưu tiên hơn yêu cầu hủy đến muộn.
- Tải vào `.part`; giữ bản trước khi thay, phục hồi nếu đổi tên thất bại. Khi mở
  lại, khôi phục `.previous` nếu cần và dọn `.part` của job bị gián đoạn.
- Cài lại gói còn đúng hash là thao tác idempotent. Cài lỗi không tạo trạng thái
  thành công; kết quả quét tiếp theo kiểm tra lại dung lượng/hash thật.
- Gói nằm tại local app data của `com.nuvokit.desktop`; cấu hình và lịch sử trong
  `core.sqlite3`. Không ghi runtime/model/database trong repository.

## Lưu trữ và ranh giới

SQLite schema v1: `preferences` và `job_history`; dữ liệu phiên bản mới hơn bị từ
chối để tránh hạ cấp. Theme chỉ nhận `light`/`dark`, tồn tại qua lần mở lại. Lịch sử
chỉ lưu ID job, loại gói, trạng thái, thời gian; UI hiện 20 mục gần nhất.

Chỉ local main window được cấp sáu command chức năng và hai command ready/kiểm
chứng nội bộ. Command kiểm chứng chỉ hoạt động khi có cờ `--verify-core` lúc mở app.
Không bật shell, HTTP, filesystem
hoặc tải remote UI ở frontend. Mini-app bên thứ ba/SDK runtime chưa thuộc bản này.
Chưa có backup/export UI, cloud sync, tự cập nhật app hay chứng nhận Store.

## Ngưỡng PoC đặt trước khi đo

- Release build: từ vào hàm native `run()` tới UI vẽ hai frame có inventory ≤ 3 giây.
- Quét môi trường ≤ 5 giây trên máy phát triển tham chiếu.
- Tổng working set process app và các WebView2 con khi rảnh ≤ 350 MiB.
- CPU khi rảnh ≤ 2% tổng năng lực máy, lấy mẫu 5 giây sau khi UI ổn định.
- JavaScript ban đầu sau gzip ≤ 150 KiB; kiểm tra hủy/lỗi không khóa điều hướng.

Sau lượt thử đầu đo RAM sau WebGPU vượt mục tiêu, quy trình bổ sung hai pha:
baseline trước compute và sau compute, giữ nguyên ngưỡng 350 MiB để báo riêng
`memoryBudgetMet` của từng pha. Chỉ coi baseline đạt mục tiêu lõi khi đo thực tế đạt;
khả năng vượt RAM sau tác vụ GPU phải tiếp tục được ghi nhận, không coi đã tối ưu.

Đây là ngưỡng cho PoC trên máy hiện tại, không phải bảo đảm trên mọi máy. Cold
start, máy yếu, Windows sạch và bộ cài cần hồ sơ QA riêng trước phát hành.

## Kiểm tra chấp nhận

1. Build TypeScript/web và native thành công; chạy được cửa sổ Windows.
2. Inventory lấy từ native, trạng thái webview/storage đúng, quét lại cập nhật UI.
3. Cài gói thật, hash đúng, cài lại không trùng, lịch sử và theme bền qua lần mở.
4. Kiểm tra gói sai hash/quá dung lượng, hủy, gián đoạn, phục hồi và ID ngoài danh mục.
5. UI light/dark, bốn trang, dialog, bàn phím và bố cục 1440/1024 px; browser preview
   không giả vờ cung cấp native install hoặc hardware thật.
6. Ghi số đo và giới hạn thực tế vào [hồ sơ kiểm chứng](../verification/README.md).
