# 0001 — Tên NuvoKit và khởi tạo repository

- Status: **Accepted**.
- Date: **2026-10-22**.
- Source: Project owner confirmed the name and requested a local Git repository,
  foundational Markdown documents, an Obsidian link, and an initial commit.

## Context

Dự án hướng đến nền tảng app cá nhân có mini-app cài thêm, giao diện thống nhất,
dữ liệu phối hợp và AI tùy chọn. Cần một nơi quản lý source và tài liệu sản phẩm.

## Decision

- Tên hiển thị **NuvoKit**, tên repository **nuvokit**.
- Tạo repo Git local trên nhánh **main**, với tài liệu và cấu hình nền.
- Repo giữ tài liệu sản phẩm/triển khai; Obsidian giữ ghi chú cá nhân và liên kết
  đến repo. Không đưa hồ sơ cá nhân trong vault vào Git.
- Commit đầu bao gồm tài liệu và cấu hình, chưa có source ứng dụng.

## Consequences

Mọi triển khai tiếp theo có nguồn tài liệu và decision log trong repo. Stack,
giấy phép, MVP và ngày phát hành chưa được chọn bởi quyết định này. Tạo remote,
push hoặc phát hành công khai cần yêu cầu riêng.
