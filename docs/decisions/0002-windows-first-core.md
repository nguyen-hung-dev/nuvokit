# 0002 — Windows trước và lõi môi trường/phần cứng

- Status: **Accepted**.
- Date: **2026-10-22**.
- Source: Chủ dự án xác nhận tập trung Windows trước, cần giao diện kiểm tra môi
  trường, tự cài thành phần phụ thuộc, phát hiện phần cứng khả dụng và yêu cầu đưa
  phần này lên đầu roadmap để làm lõi trước.

## Context

Tài liệu ban đầu chỉ coi Windows là ứng viên dùng thử đầu tiên. Chưa đặc tả trải
nghiệm chuẩn bị môi trường hoặc khả năng máy, trong khi các mini-app về sau có thể
cần runtime, tài nguyên hoặc tăng tốc khác nhau.

## Decision

- Ưu tiên triển khai app Windows.
- Đặt **Giai đoạn 0 — Lõi Windows** trước các giai đoạn mini-app/SDK.
- Lõi có giao diện kiểm tra môi trường, quản lý cài thành phần phụ thuộc và phát
  hiện phần cứng/khả năng sử dụng; các mini-app dùng lại dịch vụ này.
- Chuẩn bị ranh giới đa nền tảng cho macOS/web và kênh Microsoft Store về sau;
  chưa yêu cầu triển khai các đích này trong giai đoạn đầu.

## Consequences

Roadmap phải có đầu ra và điều kiện hoàn thành cụ thể cho lõi Windows. UI và nghiệp
vụ cần tách khỏi thao tác hệ điều hành, đồng thời công bố khả năng theo nền tảng.
Các chi tiết kiểm tra, cài đặt, phục hồi và hiệu năng trong roadmap là đề xuất kỹ
thuật để kiểm chứng, chưa phải chức năng đã triển khai.

Quyết định này chưa chọn Tauri/Electron/framework, phiên bản Windows tối thiểu,
danh mục runtime/GPU backend, phạm vi MVP mini-app hoặc lịch phát hành. Đề xuất
kiến trúc không tự trở thành quyết định stack. Chưa có benchmark, bộ cài hoặc bản
Store; chưa cho phép tạo remote, push, publish hoặc deploy.
