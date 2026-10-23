# Prompt tạo ảnh mockup

Trạng thái: đã tạo D02 light/dark bằng built-in `image_gen`. Đọc [brief](brief.md) trước khi dùng.
Thay các phần trong ngoặc vuông bằng yêu cầu cụ thể; lưu prompt thực tế để tái tạo
hoặc chỉnh sửa về sau.

Prompt vòng bộ cài môi trường được lưu riêng tại
[windows-setup-prompts.md](windows-setup-prompts.md), gồm ràng buộc chung,
đoạn riêng từng hướng và metadata kết quả. Mẫu wizard đã được duyệt ở lượt tiếp theo; các phương án khác vẫn `review`.

Ba ảnh app chính/thư viện plugin ngày 23/10/2026 lưu prompt tại
[plugin-library-prompts.md](plugin-library-prompts.md); [brief/review](plugin-library.md).

Ba ảnh plugin Đồng hồ ngày 23/10/2026 lưu tại
[clock-plugin-prompts.md](clock-plugin-prompts.md); [brief/review](clock-plugin.md).

## Mẫu prompt

```text
ID: [windows-environment-light-v01]
Screen: [D02 — Môi trường]
State: [kiểm tra xong, thiếu một thành phần tùy chọn]
Theme: [light]
Output: [1440 x 1000 px, PNG]
References: [đường dẫn ảnh trong design/mockups/ hoặc chưa có]

Tạo một ảnh mockup giao diện desktop Windows cho NuvoKit.
Đây là thiết kế ý tưởng, mọi dữ liệu máy trong ảnh là dữ liệu giả lập.

Mục tiêu: người dùng hiểu trạng thái môi trường và biết thao tác tiếp theo.
Theo design/brief.md và Giai đoạn 0 trong docs/roadmap.md.

Bố cục: [mô tả thanh tiêu đề, điều hướng, nội dung chính và vùng thao tác].
Nội dung bắt buộc: [các thẻ/bảng, trạng thái, dữ liệu mẫu và nút chính].
Nhãn tiếng Việt cần giữ đúng: [liệt kê chính xác chữ xuất hiện].

Ngôn ngữ thiết kế: [palette/font/spacing theo hướng thử nghiệm hoặc ảnh đã chọn].
Dùng hệ controls và icon nhất quán, chữ đọc được, tương phản rõ.
Một ảnh chỉ chứa một màn hình ở trạng thái đã nêu, nhìn trực diện toàn cửa sổ.
Thể hiện rõ cấp độ thông tin, trạng thái và thao tác chính.
Giữ vùng nội dung thực dụng, kích thước controls có thể triển khai bằng UI web.

Chỉ thể hiện tính năng thuộc màn hình được yêu cầu.
Không thêm số liệu thực, tài khoản, API key hoặc thông tin máy cá nhân.
Không đánh dấu GPU/backend khả dụng nếu kịch bản chưa có phép thử thành công.
```

## Ghi nhận mỗi lần tạo ảnh

Lưu mục mới với ID trùng tên ảnh, prompt thực tế, ngày tạo, công cụ/model nếu biết,
ảnh tham chiếu và đường dẫn kết quả. Ghi các tùy chọn quan trọng nếu công cụ có hỗ
trợ. Chỉ ghi file kết quả sau khi ảnh thực sự đã được lưu; cập nhật danh mục tại
[mockups/README.md](mockups/README.md).

## windows-environment-light-v01

- Ngày: 22/10/2026; loại: `ui-mockup`; công cụ: built-in `image_gen`.
- Tạo mới, không có ảnh tham chiếu; nền không trong suốt; model không được công cụ công bố.
- Kết quả: [PNG](mockups/windows-environment-light-v01.png), 1505 × 1045 px; `review`.
- Prompt thực tế:

```text
Use case: ui-mockup. Create a high-fidelity production-quality desktop Windows app UI mockup for NuvoKit, screen D02 Environment & Hardware, LIGHT THEME. One front-facing full application window, landscape about 1440x1000, no monitor device, no photo background. Elegant productivity software: pale warm gray canvas #f6f7f9, white surfaces, slate navy typography, fine cool gray borders, indigo #6558e8 accent, small restrained emerald success accents. Typography inspired by a clean modern sans serif with Vietnamese diacritics, excellent readable text, generous whitespace. Compact native Windows titlebar at top, small indigo geometric N mark and NuvoKit wordmark. Left navigation rail 224 px wide with workspace label 'KHÔNG GIAN CÁ NHÂN', selected row 'Môi trường', other rows 'Phần cứng', 'Thành phần', 'Cài đặt', a small footer 'NuvoKit · Core v0.1'. Main area begins breadcrumb 'Cài đặt / Hệ thống', large title 'Môi trường & Phần cứng', subtitle 'Mọi thứ bạn cần để bắt đầu.', right primary button 'Kiểm tra lại'. Below: broad calm ready-state banner with green check icon, title 'Sẵn sàng cho những việc quan trọng', body 'Các chức năng cơ bản đã sẵn sàng. Bạn có thể bổ sung công cụ khi cần.', small badge 'Windows 11 · 64-bit'. Then 4 equal summary cards: 'Hệ điều hành' 'Windows 11'; 'Bộ xử lý' 'CPU mẫu · 8 nhân'; 'Bộ nhớ' '16 GB RAM'; 'Đồ họa' 'GPU tích hợp' with small muted caption 'Chưa thử tăng tốc'. Then a wide white panel 'Thành phần môi trường' with a compact table: name/status/action rows 'WebView2' 'Sẵn sàng' 'Đã tích hợp'; 'Lưu trữ cục bộ' 'Sẵn sàng' 'Đang hoạt động'; 'Dữ liệu OCR tiếng Việt' 'Chưa cài' indigo outline button 'Cài đặt'. Optional OCR row notes 'Tùy chọn · chỉ là dữ liệu ngôn ngữ'. Below/right a narrow clean callout card 'Khả năng của máy' with CPU available, GPU acceleration 'Chưa kiểm tra', small text 'Có thiết bị không đồng nghĩa tác vụ đã chạy được.'. Footer 'Dữ liệu minh họa · Thiết kế đề xuất'. Use crisp consistent outline icons, 12px corners, logical spacious alignment, polished controls, visible hierarchy. Content is synthetic only. Avoid terminal code, code snippets, cloud upsells, invented dashboard graphs, giant gradients, charts, 3D artwork, watermark, fake performance certification. This is a proposed interface, not an implemented product screenshot.
```

## windows-environment-dark-v01

- Ngày: 22/10/2026; công cụ: built-in `image_gen`; loại: `ui-mockup`, chỉnh theme.
- Ảnh đầu vào: [light v01](mockups/windows-environment-light-v01.png), vai trò edit target.
- Nền không trong suốt; model không được công cụ công bố.
- Kết quả: [PNG](mockups/windows-environment-dark-v01.png), 1506 × 1045 px; `review`.
- Prompt thực tế:

```text
Use case: ui-mockup, theme variant edit. Edit this NuvoKit Windows Environment & Hardware mockup into an equally polished DARK THEME. Preserve exactly the screen layout, all Vietnamese labels, cards, nav items, title, controls, icon shapes, app window framing and content hierarchy. Change only theme colors and subtle surface treatment: charcoal navy main canvas #10131c, sidebar #141822, cards #1a1f2d, borders #2a3040, near-white primary text #edf0f8, muted slate text #9ba5b8, lavender indigo primary accent #9384ff, subdued emerald readiness banner on dark green #142b26. Maintain high contrast text and readable small labels, tasteful restrained glow only on selected nav accent, no added charts, artwork, gradients or components. Keep 'Dữ liệu minh họa · Thiết kế đề xuất' footer. Single full front-on app window, landscape, same aspect ratio as reference. All data synthetic, draft design not actual implemented screenshot.
```
