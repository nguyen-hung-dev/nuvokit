# Plugin chính chủ

Source plugin chính chủ về sau nằm ở `plugins/<slug>/`, dùng SDK workspace và
phát hành gói/version riêng. Plugin cộng đồng có thể dùng repo riêng của tác giả.

`clock/src/` là module React chính chủ được bundle cùng host, dùng repository
riêng cho SQLite/IndexedDB. [Đồng hồ v1](../docs/specs/clock-v1.md) dùng được.
Manifest/package fixtures của SDK được giữ tách khỏi module bundle;
không coi fixture SDK là artifact phát hành hoặc guest runtime.

Chưa có loader/bridge thực thi gói bên ngoài; catalog các plugin khác vẫn là dữ
liệu tổng hợp. Không clone repo vào máy khách để chạy plugin.

[Hợp đồng gói/SDK v1](../docs/specs/plugin-package-v1.md) ·
[SDK nội bộ](../packages/plugin-sdk/README.md).
