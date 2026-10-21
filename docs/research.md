# Nghiên cứu sản phẩm liên quan

Khảo sát nền: **22/10/2026**, trước khi khởi tạo NuvoKit. Nguồn chính chủ gồm repo,
tài liệu, manifest, cây file, release và metadata GitHub. Các repo/nhánh có thể đổi.

Đã rà soát 20 repo gồm app, framework, SDK và kho plugin. Chưa cài chạy thử hoặc
benchmark; không suy số người dùng, doanh thu hay chất lượng từ sao GitHub.

## Nhóm gần nhất

| Repo | Bằng chứng đáng chú ý | Bài học/giới hạn |
| --- | --- | --- |
| [Eidos](https://github.com/mayneyao/eidos) | [Plugin page/file/table, commands và quyền](https://github.com/mayneyao/eidos/blob/dev/apps/docs/src/content/docs/plugins/concepts.mdx) | Cần đối chiếu trực tiếp trước khi tự xây nền tảng mới |
| [Rubick](https://github.com/rubickCenter/rubick) | Kho UI/system plugin và cài/gỡ dựa trên npm | Học trải nghiệm cài công cụ; chưa xác nhận workflow dữ liệu như NuvoKit |
| [Super Productivity](https://github.com/super-productivity/super-productivity) | [SDK, UI, hooks và plugin mẫu](https://github.com/super-productivity/super-productivity/blob/master/docs/plugin-development.md) | [Tài liệu API](https://github.com/super-productivity/super-productivity/blob/master/docs/wiki/3.01-API.md) nói plugin có đặc quyền, không cô lập mạnh |
| [SiYuan](https://github.com/siyuan-note/siyuan) | [Bazaar](https://github.com/siyuan-note/bazaar) và [plugin mẫu](https://github.com/siyuan-note/plugin-sample) | Học metadata, tương thích, theme và xuất bản cộng đồng |
| [Compass](https://github.com/sandgraal/compass) | Life OS, MCP và luồng đề xuất thay đổi | [Roadmap](https://github.com/sandgraal/compass/blob/main/wiki/Roadmap-and-Status.md) còn public plugin API/marketplace; README ghi proprietary/UNLICENSED |
| [Helios](https://github.com/Cube-Oakley/helios) | [Module sở hữu UI/data/tools/events](https://github.com/Cube-Oakley/helios/blob/main/docs/architecture.md) | Early beta, nhiều dịch vụ Docker; mock LLM không chứng minh AI thật miễn phí |
| [FlaskToolkit](https://github.com/ReconLeo/FlaskToolkit) | Gói plugin, event bus và lifecycle | README nêu chạy cùng process, tin tác giả; không coi khai báo quyền là sandbox |
| [DucKI Agent](https://github.com/davidduckwitz/ducKI-Agent) | Mini-app frontend, tools và SQLite trong manifest | README/source/giấy phép theo thành phần cần đối chiếu; không mặc định mọi app liệt kê đã có |

## Repo liền kề và hệ mở rộng

- [Logseq](https://github.com/logseq/logseq), [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy),
  [AFFiNE](https://github.com/toeverything/AFFiNE), [Anytype](https://github.com/anyproto/anytype-ts):
  workspace/tri thức/dữ liệu cá nhân; loại plugin và giấy phép không giống nhau.
- [AppFlowy-Plugins](https://github.com/AppFlowy-IO/AppFlowy-Plugins): repo được khảo
  sát chứa block editor, không tự chứng minh marketplace mini-app tổng quát.
- [Blinko](https://github.com/blinkospace/blinko): ghi chú AI và cơ chế plugin.
- [Aureus](https://github.com/pablonortiz/aureus): Android hub với module nội bộ;
  chưa thấy bằng chứng SDK cài plugin bên thứ ba trong snapshot đã đọc.
- [Life OS](https://github.com/J0hnWIcks/life-os), [Noi](https://github.com/lencx/Noi):
  thêm đối chiếu về hub cá nhân/công cụ; chưa xác nhận tương đương nền tảng dự kiến.
- [Raycast extensions](https://github.com/raycast/extensions): học [UI kit và developer
  experience](https://developers.raycast.com/); repo extension không phải toàn bộ lõi.
- [Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin): mẫu
  plugin không phải giấy phép lõi Obsidian. Đã có timer như [Time Tools](https://github.com/steries/time-tools).

## Kết luận để kiểm chứng

Ý tưởng plugin + tiện ích cá nhân + AI đã có người làm. NuvoKit phải chứng minh
trải nghiệm dùng ngay, thiết kế thống nhất, phối hợp dữ liệu bền vững và SDK hữu ích.
Không định vị bằng tuyên bố chưa ai làm hoặc Obsidian không có đồng hồ.

Chưa dùng source đối thủ làm nền NuvoKit. Trước tái sử dụng, đọc giấy phép chính
xác theo thành phần; repo công khai hoặc badge không đủ để suy quyền sử dụng.
