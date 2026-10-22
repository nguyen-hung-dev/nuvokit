# 0004 — Repository mã nguồn công khai

- Status: **Accepted**.
- Date: **2026-10-22**.
- Source: Chủ dự án yêu cầu bổ sung lệnh cài vào README, commit local, tạo repo
  GitHub công khai trùng tên và push nội dung dự án; giữ file riêng tư trên máy.

## Context

Core Windows đã có source, tài liệu, thiết kế và bằng chứng kiểm chứng. Cần chia
sẻ dự án mà không đưa môi trường phát triển hoặc dữ liệu cá nhân lên GitHub.

## Decision

- Tạo repository công khai `nguyen-hung-dev/nuvokit`, nhánh chính `main`.
- Version source, lockfile, cấu hình dùng chung, tài liệu và design asset có chủ
  đích; giữ các ảnh mockup được yêu cầu trong `design/mockups/`.
- Loại build/binary, dependency, cache, CodeGraph, output QA, database, gói tải về,
  cấu hình máy, credentials và ghi chú cá nhân khỏi Git. Giữ file local nguyên vẹn.
- Rà soát cả nội dung và metadata lịch sử trước khi push. Dùng email GitHub noreply
  cho lịch sử công khai; bản lịch sử chứa email cá nhân được giữ bằng ref local.
- Hướng dẫn build/cài từ source. Chưa phát hành binary, chưa chọn giấy phép.

## Consequences

Source có thể được đọc công khai; điều đó không tự cấp giấy phép nguồn mở.
Repo công khai không chứa bộ cài hoặc dữ liệu thực trên máy phát triển. Mỗi lần
commit/push tiếp theo vẫn cần rà soát file phát sinh và thông tin riêng tư.
