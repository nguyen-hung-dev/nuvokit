# Kiến trúc đề xuất

Trạng thái: **Core v1 đã có triển khai nội bộ; phần mở rộng còn là thiết kế**.
Cập nhật: **22/10/2026**. React/TypeScript + Tauri/Rust + SQLite đã được dùng cho
lõi đầu tiên. Xem [đặc tả](specs/core-v1.md), [source/cách chạy](development.md) và
[kiểm chứng](verification/README.md) để phân biệt chức năng thực với kế hoạch.
Ưu tiên Windows và làm lõi môi trường/phần cứng trước mini-app đã được chốt tại
[quyết định 0002](decisions/0002-windows-first-core.md).
Stack lõi được ghi tại [quyết định 0003](decisions/0003-core-v1-stack.md).

## Cấu trúc logic

```text
App shell + UI kit + theme
           |
Plugin host / capability bridge
           |
Mini-apps: UI + schema + commands + events
           |
Scoped data APIs + local persistence + background services
           |
Optional agent gateway (API/MCP) and optional external services
```

## Trách nhiệm của lõi

- Điều hướng, dashboard, panel, lệnh nhanh và tìm kiếm.
- Thành phần giao diện, tokens và theme; đề xuất thử 3 theme hoàn chỉnh trước.
- Cài/bật/tắt/gỡ plugin, tương thích phiên bản và rollback.
- Namespace dữ liệu, ID ổn định, schema/migration và file đính kèm.
- Hợp đồng liên kết/sự kiện, nhắc việc và thông báo.
- Quyền đọc/ghi/mạng/file, lịch sử thao tác và hoàn tác khi phù hợp.
- Backup local, phục hồi và xuất/nhập được tài liệu hóa.
- API/MCP để agent dùng đúng phạm vi dữ liệu đã cấp.
- Nạp module theo nhu cầu; job nặng có hàng đợi và khả năng hủy.
- Màn hình kiểm tra môi trường, phát hiện phần cứng/khả năng tăng tốc, quản lý cài
  thành phần phụ thuộc và kiểm tra lại; triển khai đầu tiên trong
  [giai đoạn 0 của roadmap](roadmap.md#giai-đoạn-0--lõi-windows-trước-mini-app).

Các dịch vụ nền trên không được tính thành module chỉ để tăng danh mục.

## Dữ liệu và liên kết

- Mỗi mini-app sở hữu schema của mình; app khác không ghi thẳng vào bảng riêng.
- Tham chiếu chéo bằng ID/loại bản ghi, thao tác qua API có schema và quyền.
- Một phiên timer chỉ được lưu và tính một lần dù hiển thị ở nhiều app.
- Số tiền lưu chính xác theo đơn vị tiền tệ; phân biệt giao dịch thực với kế hoạch.
- Gỡ plugin có lựa chọn giữ/xuất dữ liệu; migration phải có phương án phục hồi.

## Kiến trúc dùng cho Core v1

Chọn **modular monolith với ports/adapters** cho lõi đầu tiên: một app được chia module rõ ràng,
UI/nghiệp vụ gọi các hợp đồng dịch vụ; từng nền tảng cung cấp implementation tương
ứng. Source hiện có npm workspaces, frontend dùng chung và host Windows. Các hàng
web persistence, worker/sidecar nâng cao và mini-app runtime bên dưới vẫn là hướng
thiết kế, chưa phải chức năng đã triển khai.

| Lớp | Triển khai / hướng mở rộng | Ranh giới |
| --- | --- | --- |
| UI dùng chung | React + TypeScript + Vite; design tokens, components và theme chung | Không gọi trực tiếp API Windows/Tauri từ màn hình hoặc mini-app |
| Nghiệp vụ và hợp đồng | TypeScript thuần, schema có phiên bản, ports cho dữ liệu/job/hệ thống | Không phụ thuộc DOM, Tauri, Node hoặc đường dẫn hệ điều hành |
| Desktop host | Tauri 2 + Rust; Windows trước, macOS sau | Rust giữ quyền native, kiểm tra lệnh và quản lý tài nguyên |
| Dữ liệu desktop | SQLite qua repository của host, migration và transaction | Không cho mini-app chạy SQL hoặc ghi bảng của app khác tùy ý |
| Web host | Build web riêng dùng lại UI/nghiệp vụ; adapter trình duyệt | Đề xuất IndexedDB ban đầu; SQLite/WASM chỉ khi có nhu cầu được kiểm chứng |
| Xử lý nặng | Worker/job nền; sidecar theo nền tảng khi cần OCR/AI | Không chạy trên luồng UI; có giới hạn tài nguyên, tiến trình và hủy |
| Mini-app runtime | Plugin host riêng của NuvoKit, trước hết plugin chính chủ | Đóng góp UI/commands/events qua SDK; quyền thực thi ở host |

UI/nghiệp vụ được tổ chức thành các package dùng chung trong một monorepo; desktop
và web là các entry riêng. Tách schema/DTO dùng chung khỏi migration lưu trữ từng
nền tảng; kiểm tra cùng hợp đồng repository. API host vẫn phải kiểm tra quyền và
dữ liệu đầu vào trước khi ghi. Đồng bộ desktop-web là thiết kế riêng về tài khoản,
xung đột và quyền; chia sẻ code không tự tạo ra sync.

### Căn cứ chọn Tauri cho lõi đầu tiên

[Tauri](https://v2.tauri.app/concept/architecture/) kết hợp frontend web với host
Rust và dùng webview hệ điều hành. [Electron](https://www.electronjs.org/docs/latest/)
đóng gói Chromium và Node.js. Từ khác biệt này, Tauri là ứng viên ưu tiên để kiểm
chứng mục tiêu bộ cài gọn và giảm runtime phải đóng gói; chưa thể kết luận app cụ
thể dùng ít RAM hơn hoặc phản hồi nhanh hơn nếu chưa đo cùng workload.

[Webview khác nhau](https://v2.tauri.app/reference/webview-versions/) giữa Windows
(WebView2) và macOS (WKWebView), nên cần kiểm tra CSS, font, nhập liệu, scroll,
accessibility và hiệu năng trên từng nền tảng. Electron là phương án dự phòng
nếu PoC cho thấy yêu cầu Chromium đồng nhất hoặc phụ thuộc hệ sinh thái Node
quan trọng hơn mục tiêu kích thước và các ranh giới Rust.

### UI đồng bộ và chất lượng hình ảnh

- Một bộ tokens cho màu, chữ, khoảng cách, bo góc, độ nổi và chuyển động; một bộ
  components cho navigation, bảng, form, dialog và trạng thái dữ liệu.
- Theme thay tokens; mini-app dùng UI kit thay vì tự dựng bộ controls riêng.
- Giữ nội dung/layout nhất quán, thích nghi title bar, menu, phím tắt và font theo
  nền tảng. Không cam kết hình ảnh giống từng pixel giữa các webview.
- Nạp module theo nhu cầu, phân trang/virtualize dữ liệu dài, giới hạn render và
  IPC; đo startup, bộ nhớ, phản hồi khi chạy job trên cấu hình tham chiếu.
- Kiểm tra DPI, bàn phím, tương phản, reduced motion và trạng thái lỗi trên các
  màn hình chính. Chọn framework không tự bảo đảm thiết kế đẹp hoặc hiệu năng.

### Môi trường, phần cứng và phụ thuộc

Native adapter trả về inventory phần cứng và kết quả probe khả năng thực thi riêng;
có trạng thái không đọc được/không hỗ trợ. Dependency manager dùng danh mục gói có
phiên bản, nguồn và yêu cầu phần cứng, tách khỏi màn hình hiển thị. Bộ cài xử lý
runtime cần để UI mở được; UI quản lý phụ thuộc tùy chọn về sau.

Nếu chọn Tauri, [bộ cài Windows](https://v2.tauri.app/distribute/windows-installer/)
chuẩn bị WebView2 trước khi mở app. Node/Rust toolchain chỉ dùng khi phát triển;
Python hoặc model AI chỉ xuất hiện nếu một tính năng thực sự cần, ưu tiên đóng gói
hoặc cài trong vùng dữ liệu app. Không tự cài driver chỉ vì nhận diện được GPU.

Web công bố khả năng trong sandbox trình duyệt; không hứa đọc đầy đủ CPU/GPU/VRAM,
cài runtime hệ thống hoặc chạy job nền như desktop. Mỗi tính năng phải có capability
và cách hiển thị khi thiếu hỗ trợ. Dữ liệu và UI có thể dùng chung dù khả năng khác.

### Plugin NuvoKit và quyền native

Mini-app cài thêm của NuvoKit là hợp đồng runtime riêng, không đồng nghĩa với
plugin Rust của Tauri được tích hợp khi build. Plugin bên thứ ba không được nạp
chung ngữ cảnh có quyền native của app shell hoặc nhận API shell/file/SQL tùy ý.
Phải PoC guest context cô lập, bridge xác thực danh tính/quyền mỗi plugin và vòng
đời job trước khi mở SDK ngoài. [Capabilities của Tauri](https://v2.tauri.app/security/capabilities/)
giới hạn IPC theo window/webview; không tự thay thế mô hình quyền mini-app.

## Các đích phân phối

| Đích | Hướng chuẩn bị | Khả năng cần kiểm chứng |
| --- | --- | --- |
| Windows tải trực tiếp — ưu tiên trước | App desktop, bộ cài EXE/MSI và cập nhật có chữ ký | Bootstrap runtime, kiểm tra/cài phụ thuộc và dịch vụ nền |
| Microsoft Store — kênh Windows về sau | Cùng desktop core, cấu hình đóng gói/phụ thuộc/cập nhật theo kênh | Chứng nhận Store, offline installer, quyền và hành vi module/plugin |
| macOS — mở rộng sau | Cùng UI và desktop host; adapter/runtime riêng, app bundle/DMG ký và notarize | Apple Silicon/Intel theo phạm vi công bố, WKWebView và tác vụ nền |
| Web/PWA — mở rộng sau | Build frontend dùng chung, browser adapters và cache/storage riêng | Browser support, giới hạn lưu trữ, vòng đời nền và tính năng thiếu native |

Microsoft Store là kênh phân phối Windows. [Microsoft hỗ trợ MSIX, EXE/MSI và PWA](https://learn.microsoft.com/en-us/windows/apps/publish/);
không bắt buộc viết một app UWP khác. [Hướng dẫn Tauri hiện tại](https://v2.tauri.app/distribute/microsoft-store/)
đi theo EXE/MSI, có offline installer WebView2 và silent install; nếu cần MSIX phải
đánh giá pipeline đóng gói riêng. [Chính sách Microsoft](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies#102-security)
yêu cầu bộ cài EXE/MSI độc lập, có chữ ký, và có điều kiện đối với phụ thuộc/phần
mềm thứ cấp/code động. Cần đối chiếu dependency manager và plugin runtime trước
chứng nhận; không coi khả năng build là bảo đảm được Store chấp thuận.

macOS tải trực tiếp cần hồ sơ [ký và notarization](https://v2.tauri.app/distribute/sign/macos/).
Nếu sau này thêm Mac App Store, phải đánh giá sandbox và phân phối code/phụ thuộc
riêng. Các hướng dẫn nguồn được đối chiếu ngày **22/10/2026**; cần kiểm tra lại khi
triển khai/phát hành. Hiện đã có executable/bộ cài local và phép đo Core v1 trên
Windows; chưa có hồ sơ Store hoặc kiểm chứng macOS/web đầy đủ.

## Giới hạn phải thiết kế rõ

- Manifest có quyền chưa đồng nghĩa runtime cô lập; guest không mặc định có Node,
  terminal, toàn bộ filesystem hoặc toàn bộ dữ liệu workspace.
- Agent đọc khác với agent ghi; thay đổi dữ liệu cần bản nháp, nguồn và lịch sử.
- Timer phải xử lý pause, sleep/resume, khởi động lại và qua ngày.
- Báo thức khi chạy nền khác với đánh thức máy đang ngủ hoặc máy đã tắt.
- AI/OCR cloud phải là tùy chọn có phạm vi dữ liệu và chi phí rõ ràng.

Các mục này là yêu cầu kiểm chứng, chưa phải bảo đảm an toàn hoặc độ tin cậy.
