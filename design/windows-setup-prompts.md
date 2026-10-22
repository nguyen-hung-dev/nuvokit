# Prompt — Bộ cài môi trường Windows

Ngày: **22/10/2026**. Công cụ: built-in `image_gen`; loại `ui-mockup`.
Ảnh D02 light là style reference thực tế được đính kèm từng lần gọi. Ba ảnh mới
là ba bố cục độc lập cùng trạng thái cài WebView2, không phải ba bước liên tiếp.
Mẫu wizard đã được chủ dự án chọn và cho triển khai ở lượt tiếp theo. Hai hướng
còn lại giữ `review`; prompt bên dưới là lịch sử tạo ảnh, không phải screenshot app.

## Ràng buộc chung

```text
Use case: ui-mockup. Create realistic, production-quality UI designs with clear hierarchy, strong typography, and purposeful spacing.
Asset type: proposed native Windows installer screen for NuvoKit, intended for ordinary nontechnical users.
Input image: attached NuvoKit Environment light mockup is a STYLE REFERENCE ONLY. Preserve its small purple N brand mark, Segoe UI-like typography, pale surfaces and indigo accent; create a new installer layout, do not copy the app navigation or claim this is a running implementation.
Target dimensions: 1100 x 760 px, natural landscape viewport, one complete front-facing Windows setup window filling the canvas. Include a thin Windows title bar, no device bezel, desktop wallpaper, browser chrome, scene perspective, or external presentation board. No collage or multiple ideas.
Visual system: main background #f6f7fb, white surface #ffffff, primary text #17203a, muted text #626f84, indigo accent #6657e8, subtle lines #e4e8f1, restrained success green #21845b. Use spacing/grouping/typography first, subtle row dividers second, few borders, very little shadow. No cards nested inside cards. Body text at a realistic readable 14–16 px baseline, no more than two fonts, no clipped labels.
Shared scenario: this is the prerequisite preparation step BEFORE the NuvoKit React UI can launch. Windows 11 x64 check has passed. Microsoft WebView2 is CURRENTLY INSTALLING, not downloading. App file installation and completion are still pending. Do not show the app as installed or ready. Do not show a percent or countdown because the external Microsoft installer is not reporting numeric progress; use an indeterminate progress bar with a short moving segment illustrated statically.
Copy in Vietnamese, render these strings accurately: titlebar "Cài đặt NuvoKit"; section "Chuẩn bị môi trường"; active component "Microsoft WebView2"; purpose "Thành phần hiển thị giao diện NuvoKit."; source "Nguồn: Microsoft"; active status "Đang cài đặt…"; checked system "Windows 11 · 64-bit"; pending app "Cài NuvoKit"; final pending "Hoàn tất". Secondary action "Xem chi tiết". Bottom right "Hủy" is visually DISABLED with clear low emphasis; adjacent explanation "Chưa thể hủy trong bước này." Small bottom footer "Dữ liệu minh họa · Chờ duyệt".
Only synthetic states. Do not include accounts, usernames, real personal paths, terminal windows, CLI commands, Node/npm/Rust/Git, license acceptance for an unchosen product license, invented apps, charts, AI/OCR engines, GPU claims, exact download sizes, developer diagnostics or marketing slogans. This is a focused installer, no app sidebar with Environment/Hardware/Settings navigation. Dates are unnecessary; if unavoidable anchor to 2026-10-22.
```

## windows-setup-wizard-light-v01

- Hướng: **Trình hướng dẫn**.
- Đầu vào: [style reference D02 light](mockups/windows-environment-light-v01.png).
- Nền không trong suốt; đề nghị 1100 × 760 px; kích thước thực ghi sau khi lưu.
- Prompt thực tế = toàn bộ Ràng buộc chung ở trên + đoạn riêng bên dưới.
- Trạng thái: `approved` — chủ dự án chọn mẫu 1 và cho triển khai/phát hành ngày 22/10/2026.
- Kết quả: [PNG](mockups/windows-setup-wizard-light-v01.png), 1508 × 1043 px, 1279329 byte.
- SHA-256: `b79112eb6ba6fd8da16e9349d96efdcb61aa6d8821164b8030b43506dfb9aa7b`.

```text
Direction: Guided wizard. A narrow softly tinted left rail (about 250 px) contains NuvoKit brand and a vertical FOUR-STEP indicator: "Kiểm tra máy" completed with a check; "Chuẩn bị môi trường" active indigo; "Cài NuvoKit" pending; "Hoàn tất" pending. The main right surface presents a prominent heading "Chuẩn bị môi trường", one calm WebView2 component area, purpose and source, and indeterminate progress. A small passed Windows line appears below the introduction, not a hardware dashboard. Bottom aligned footer holds secondary details action and disabled Cancel. The main hierarchy must emphasize the active step, why WebView2 is needed, and what happens next. Preserve generous whitespace and buildable native control proportions.
```

## windows-setup-focus-light-v01

- Hướng: **Tiến trình tập trung**.
- Đầu vào: [style reference D02 light](mockups/windows-environment-light-v01.png).
- Nền không trong suốt; đề nghị 1100 × 760 px; kích thước thực ghi sau khi lưu.
- Prompt thực tế = toàn bộ Ràng buộc chung ở trên + đoạn riêng bên dưới.
- Trạng thái: `review`; chưa duyệt.
- Kết quả: [PNG](mockups/windows-setup-focus-light-v01.png), 1508 × 1043 px, 1228766 byte.
- SHA-256: `74a8f6c09d3de513c88a97489ebf48511550b3aba4a23009070be18b8bd463fd`.

```text
Direction: Focused current step. Use the full light base window without a left rail. NuvoKit brand is top left. A thin compact horizontal step indicator across the top marks "Kiểm tra máy" done, "Môi trường" active, "Cài NuvoKit" pending and "Hoàn tất" pending. In the open main area use a large left-aligned heading "Chuẩn bị môi trường", a single prominent line "Đang cài Microsoft WebView2", readable purpose, and one wide indeterminate progress bar. Place passed Windows check and Microsoft source in one compact secondary line. Keep everything on a single unboxed surface with strong whitespace, not a centered card on another page. A collapsed "Xem chi tiết" row sits under the progress region. Bottom right disabled Cancel plus explanation. The active task is the hero; supporting information is visually quiet.
```

## windows-setup-timeline-light-v01

- Hướng: **Nhật ký rõ ràng**.
- Đầu vào: [style reference D02 light](mockups/windows-environment-light-v01.png).
- Nền không trong suốt; đề nghị 1100 × 760 px; kích thước thực ghi sau khi lưu.
- Prompt thực tế = toàn bộ Ràng buộc chung ở trên + đoạn riêng bên dưới.
- Trạng thái: `review`; chưa duyệt.
- Kết quả: [PNG](mockups/windows-setup-timeline-light-v01.png), 1508 × 1043 px, 1273194 byte.
- SHA-256: `9bce9e34c1ee2fa61ab0888278de3b305ef6cef494123784b896e6c87dc1fdce`.

```text
Direction: Clear task timeline. No left navigation rail and no horizontal wizard across top. NuvoKit brand and "Chuẩn bị môi trường" heading at top. The primary content is ONE open, spacious vertically connected task list with four rows: completed "Kiểm tra máy" with green check and "Windows 11 · 64-bit"; expanded active "Microsoft WebView2" with indigo live indicator, purpose, "Đang cài đặt…", indeterminate progress and Microsoft source; pending "Cài NuvoKit"; pending "Hoàn tất". Use subtle row dividers, no individual bordered cards. Status labels align to a clear right-hand column: "Đã kiểm tra", "Đang cài", "Đang chờ", "Đang chờ". The active row is emphasized by a pale indigo wash and plenty of breathing room. Secondary details action under the task list. Disabled Cancel plus explanation in bottom footer. This direction puts the visible work history and remaining tasks first without exposing raw logs or developer jargon.
```
