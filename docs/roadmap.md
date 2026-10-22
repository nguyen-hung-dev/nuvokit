# Lộ trình đề xuất

Cập nhật: **23/10/2026**. Đã chốt **Windows trước, làm lõi trước mini-app**
([quyết định 0002](decisions/0002-windows-first-core.md)). Đã có Core v1 nội bộ và
[stack đã chọn](decisions/0003-core-v1-stack.md). MVP mini-app/ngày phát hành còn mở.
Giai đoạn 0 chưa hoàn tất QA trên Windows sạch và các điều kiện phát hành.

## Nền tảng tài liệu đã tạo

- [x] Chốt tên NuvoKit và tên repo `nuvokit`.
- [x] Khởi tạo repo local trên nhánh `main`.
- [x] Tạo Git ignore/attributes, EditorConfig và bộ tài liệu dự án.
- [x] Ghi nhận định hướng, nghiên cứu, 50 module và các quyết định còn mở.

## Các giai đoạn để kiểm chứng

| Giai đoạn | Đầu ra đề xuất | Điều kiện đi tiếp |
| --- | --- | --- |
| 0 — Lõi Windows | Khung app/UI kit, kiểm tra môi trường, quản lý phụ thuộc, phát hiện phần cứng và dịch vụ nền; ranh giới mở rộng đa nền tảng | Máy Windows sạch cài/mở được app; màn hình môi trường báo đúng khả năng sử dụng; cài/khôi phục phụ thuộc có thể kiểm tra lại |
| 1 — Bản dùng được | Lõi tối thiểu + Đồng hồ, Sách, Công việc; 3 theme; backup/export | Cài được, phiên/tiến độ bền vững trong các trạng thái công bố |
| 2 — SDK thử nghiệm | Manifest, UI kit, quyền, API/event, mẫu plugin và tài liệu | Người ngoài làm được app nhỏ, nâng cấp/gỡ/cài lại không mất dữ liệu |
| 3 — Mở rộng | Lịch, Habit, Ghi chú, Thu chi, Gia hạn, Tiết kiệm, OCR | Chuỗi hóa đơn → bản nháp → sổ tiền đúng và không trùng |
| 4 — Cộng đồng | Kho tuyển chọn, plugin/theme cộng đồng, kiểm tra tương thích | Có người dùng/contributor thực và xử lý cập nhật/lỗi rõ ràng |
| 5 — Kinh doanh | Thử sync/backup quản lý sẵn, cộng tác hoặc dịch vụ AI/OCR | Có nhu cầu trả phí và chi phí vận hành đo được |

## Giai đoạn 0 — Lõi Windows trước mini-app

Đây là phần triển khai đầu tiên đã được yêu cầu. Các dịch vụ này thuộc lõi, dùng
chung cho mọi mini-app và không tính thêm vào danh mục 50 module. Chi tiết thiết kế
dưới đây gồm phần đã triển khai và phần còn phải kiểm chứng. Core v1 và giới hạn
thực tế được ghi tại [đặc tả](specs/core-v1.md), [cách chạy](development.md) và
[hồ sơ kiểm chứng](verification/core-v1-windows.md).

### Cài cho người dùng thông thường — preview 0.1.1

- [x] Tách README thành hướng dẫn nhận/cài `.exe` và hướng dẫn developer chạy/build.
- [x] Viết [đặc tả hai lớp cài đặt](specs/windows-installation.md) và
  [brief để duyệt](../design/windows-setup.md): bootstrap native trước WebView2,
  hướng dẫn trong app sau khi UI mở được.
- [x] Tạo ba [ảnh bộ cài chờ review](../design/mockups/README.md#bộ-cài-môi-trường--review),
  lưu prompt và metadata; chưa có bố cục được duyệt.
- [x] Chủ dự án chọn mẫu wizard 1, duyệt code và phát hành; xem [0006](decisions/0006-native-setup-release.md).
- [x] Đã có wizard native bọc NSIS: hiển thị bước, tên thành phần,
  tiến trình thật hoặc thanh chờ, lỗi/thử lại/hủy phù hợp và kết quả xác minh.
- [x] Mở app vào Môi trường hiện có; gói tùy chọn không tự cài.
- [ ] Onboarding React riêng và CI phát hành tự động nếu cần về sau.
- [x] Đóng gói/phát hành prerelease 0.1.1 với checksum và upstream notices.
- [ ] Kiểm thử máy Windows sạch không Git/Node/Rust/Build Tools, runtime có/thiếu,
  mạng bị ngắt, quyền, cài lại/nâng cấp/gỡ trước phát hành bộ cài.

Wizard đã triển khai sau duyệt. Xem [bằng chứng 0.1.1](verification/windows-setup-0.1.1.md):
43 kiểm tra Setup, 6 test nghiệp vụ, 10 test Rust đạt; chưa thay thế QA Windows sạch.
Đã có `.exe` preview trên GitHub Releases; chữ ký số và pipeline tự động chưa có.

### Khung app và ranh giới nền tảng

- [x] Khung điều hướng, Settings và màn hình **Môi trường & Phần cứng** dùng chung
  UI kit/theme; có trạng thái đang kiểm tra, sẵn sàng, thiếu, không hỗ trợ và lỗi.
- [x] Tách UI/nghiệp vụ khỏi dịch vụ hệ điều hành qua hợp đồng/schema và quyền;
  đã có adapter Windows và web preview. Adapter macOS thực vẫn là việc về sau.
- [ ] Đặc tả lưu trữ cấu hình/trạng thái lõi, migration, log chẩn đoán local và
  backup/phục hồi trước khi các mini-app bắt đầu phụ thuộc vào lõi.
  SQLite schema v1, theme và lịch sử job đã có; backup/export còn lại.

### Kiểm tra môi trường và nhận diện phần cứng

- [x] Hiển thị Windows/kiến trúc và phiên bản/trạng thái thành phần bắt buộc/tùy
  chọn; đường dẫn cài do host quản lý, có chi tiết nguồn và thao tác cài.
- [x] Nhận diện CPU, RAM tổng/khả dụng, dung lượng đĩa trống, các GPU và VRAM khi
  đọc được; phân biệt thông tin không xác định với phần cứng không tồn tại.
- [x] Có phép thử tính toán WebGPU và phân biệt thiết bị/khả năng thực thi. Chưa
  xác nhận backend/engine OCR hoặc AI; không suy từ tên GPU.
- [ ] Ánh xạ yêu cầu module sang khả năng máy: chạy được, cần cài thêm, chạy bằng
  CPU hoặc không hỗ trợ; có nút kiểm tra lại sau khi môi trường thay đổi.

### Cài và quản lý thành phần phụ thuộc trong giao diện

- [x] Danh mục đầu tiên cho Windows x64: WebView2, SQLite tích hợp và gói ngôn ngữ
  OCR tùy chọn được pin phiên bản/hash; engine và runtime khác chưa tích hợp.
- [ ] Kiểm chứng bootstrap WebView2 trên Windows sạch. Bộ cài NSIS đã cấu hình
  bootstrap trước khi mở UI, chưa thử trường hợp máy thiếu WebView2.
- [x] Hiển thị thành phần sẽ cài, mục đích, dung lượng, nguồn và quyền cần thiết;
  người dùng chọn cài và app thực hiện tải/cài/kiểm tra lại ngay trong giao diện.
- [x] Tiến trình/channel, hủy, thử lại, lịch sử và phục hồi cho gói dữ liệu đầu tiên;
  các nhánh lỗi/hủy/gián đoạn được kiểm tra bằng test native.
- [ ] Thêm hợp đồng cần khởi động lại khi tích hợp runtime có yêu cầu reboot.
- [x] Kiểm tra SHA-256/dung lượng gói dữ liệu; SQLite tích hợp, dữ liệu OCR trong
  vùng app. Danh mục hiện chưa tải executable hoặc cần thay đổi hệ thống.
- [ ] Chuẩn hóa kiểm tra chữ ký cho executable/runtime về sau; ưu tiên đóng gói hoặc
  nằm trong vùng dữ liệu app. Thay đổi hệ thống cần quyền phù hợp và được nêu rõ.
- [x] App lõi không phụ thuộc gói OCR/AI hoặc toolchain phát triển để mở executable.
- [ ] Kiểm chứng riêng trên máy không GPU và Windows sạch.

### Dịch vụ nền và điều kiện hoàn thành

- [x] Quét/cài chạy nền, một job cài tại một thời điểm, giới hạn dung lượng/timeout
  và hủy. UI nhận tiến trình qua channel.
- [ ] Hàng đợi job tổng quát cho mini-app/AI/OCR và giới hạn tài nguyên theo engine.
- [ ] Kiểm chứng trên Windows sạch, máy không có GPU rời, chế độ offline, từ chối
  quyền cài đặt và tải/cài bị ngắt; công bố rõ phiên bản Windows/kiến trúc đã thử.
- [x] Kiểm tra lại và cài lại không tạo bản trùng hoặc mất cấu hình; giữ được bản
  đang hoạt động nếu cập nhật phụ thuộc thất bại.
- [x] Đã đo startup, RAM/CPU và quét hệ thống trên máy phát triển; đặt ngưỡng trước
  khi đo, giữ lại kết quả RAM vượt mục tiêu và các giới hạn kiểm chứng.
- [ ] Đạt mục tiêu RAM trên cấu hình tham chiếu và đo lại trên máy yếu/Windows sạch.
- [ ] Tách hồ sơ đóng gói Windows trực tiếp và Microsoft Store; macOS/web là đích
  mở rộng sau. Kiểm tra yêu cầu kênh phân phối trước khi cam kết cơ chế cài phụ thuộc.

## Đã thực hiện để bắt đầu lõi

- [x] Viết đặc tả màn hình môi trường/phần cứng và danh mục phụ thuộc tối thiểu.
- [x] Tạo mockup light/dark và khung UI tham chiếu; ảnh đang `review` theo
  [brief thiết kế](../design/brief.md); lưu ảnh/prompt trong [design/](../design/README.md).
- [x] PoC IPC, phần cứng, persistence, job cài gói và đóng gói Windows; chưa phải
  PoC sandbox plugin bên thứ ba. Xem [kiến trúc](architecture.md).
- [x] Ghi quyết định stack vào decision log.

## Kiểm chứng trước giai đoạn mini-app

- [ ] Chốt người dùng đầu tiên và quy trình đầu tiên.
- [ ] So sánh trải nghiệm trên vài app hiện có; ghi bằng chứng dùng thử.
- [ ] Viết tiêu chí hoàn thành cho quy trình đã chọn, kèm trạng thái lỗi/khôi phục.
- [ ] Làm thiết kế nhỏ cho hai app liên kết và các theme thử trên UI kit của lõi.
- [ ] Ghi quyết định MVP vào decision log trước khi coi là đã chọn.
- [ ] Chọn giấy phép, điều khoản đóng góp và kênh bảo mật trước phát hành công khai.

## Chỉ số nên đo

Cài thành công; thời gian đến việc đầu tiên; quay lại trong tuần; quy trình liên app
được dùng; lỗi/mất dữ liệu; developer tạo plugin được; nhu cầu trả phí cụ thể. Sao
GitHub là một tín hiệu quan tâm bổ sung, không thay thế các chỉ số này.
