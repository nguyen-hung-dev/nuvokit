# Gói plugin & SDK tối thiểu v1

Ngày: **23/10/2026**. Hợp đồng nội bộ đã chốt theo [0009](../decisions/0009-plugin-ui-package-sdk.md).
Thực có: UI bản mẫu, validator/schema, SDK client và test. Native loader và bridge
thực chưa có; hợp đồng này không biến NuvoKit 0.1.3 phát hành thành plugin host.

## Source và phân phối

- Lõi/SDK/UI kit và plugin chính chủ cùng monorepo; về sau `plugins/<slug>/` có
  source, manifest, test và cấu hình build riêng. Plugin cộng đồng có repo riêng.
- Gói phát hành độc lập, ví dụ `clock-0.1.0.nuvoplugin`, tải qua danh mục có metadata
  tin cậy. GitHub Releases phù hợp vòng đầu; chưa cần một dịch vụ marketplace.
- Người dùng tải gói đã build. Không Git clone, npm install, shell script hoặc
  biên dịch source trên máy khách. JS/CSS vẫn là mã/tài nguyên dùng để chạy.
- Gói native Tauri/Rust thuộc bản build của host. Native worker/engine bên ngoài
  cần hợp đồng phân phối riêng; không thuộc package/API v1 này.

## Container

ZIP UTF-8, phần mở rộng `.nuvoplugin`, không password/encryption:

```text
manifest.json
ui/index.html
ui/...                JS/CSS/assets đã build, không import runtime từ Internet
assets/icon.svg       SVG tĩnh: không script, external ref hoặc foreignObject
LICENSE               Văn bản tương ứng license khai báo
THIRD_PARTY_LICENSES.txt   Khi có thành phần bên thứ ba
```

Không thêm thư mục bao ngoài. Chỉ chấp nhận các file root trên và file dưới `ui/`,
`assets/`; không `.git`, source map/source TS, dependency tree, dữ liệu thật, model,
binary native hoặc script cài. Gói dùng cùng web assets giữa các nền tảng khi các
API cần dùng có sẵn; khai báo nền tảng không thay cho kiểm chứng runtime từng OS.

Giới hạn bắt buộc của loader tương lai:

- Manifest ≤16 KiB UTF-8; archive ≤16 MiB; tổng giải nén ≤32 MiB; ≤256 file;
  một file giải nén ≤8 MiB. Kiểm đếm bytes thực, không tin riêng metadata ZIP.
- Từ chối absolute/UNC/drive path, `..`, `.` segment, backslash, NUL/control,
  symlink/reparse/hardlink, entry trùng (kể cả hoa/thường), tên reserved của Windows
  và tên có dấu chấm/space cuối. Giải nén vào staging mới, kiểm tra đường dẫn nằm
  trong staging, không ghi trực tiếp lên bản đang dùng.
- Từ chối định dạng/thuật toán ZIP không hỗ trợ. Đọc manifest/kiểm entry, hash,
  chữ ký, quyền và tương thích xong mới kích hoạt. Không chạy file lúc giải nén.

Đây là yêu cầu cho loader, chưa phải kiểm tra archive đã được triển khai.

## Manifest

[JSON Schema](../../packages/plugin-sdk/manifest.schema.json) là schema đóng,
`additionalProperties: false`. [Ví dụ](../../packages/plugin-sdk/examples/manifest.json)
là fixture hợp đồng, không phải plugin có thể cài.

| Field | Hợp đồng |
| --- | --- |
| `formatVersion` | `1`: định dạng container/manifest |
| `apiVersion` | `1`: API host; từ chối version khác |
| `id` | Reverse DNS lowercase, tối thiểu ba phần, ≤120 ký tự; không đổi khi update |
| `name`, `description` | Tối đa 60/240 ký tự Unicode, không rỗng/control/space ở hai đầu |
| `version` | `MAJOR.MINOR.PATCH`, không số 0 thừa, ≤32 ký tự; v1 chưa nhận prerelease/ranges |
| `publisher` | Tên hiển thị ≤80 ký tự; không phải bằng chứng danh tính tác giả |
| `license` | Mã/nhãn giấy phép ≤80 ký tự, khớp file LICENSE; ví dụ dùng UNLICENSED, không chọn giấy phép NuvoKit |
| `entry`, `icon` | Cố định `ui/index.html`, `assets/icon.svg` |
| `platforms` | Mảng không trùng, có ít nhất một trong windows/macos/web |
| `permissions` | Mảng không trùng: storage.read, storage.write; có thể rỗng |

Validator còn áp dụng kiểm tra semantic về whitespace/control ngoài các ràng buộc
JSON Schema. Không coi nội dung manifest là lệnh hoặc nguồn SQL. Version plugin
độc lập version host; tương thích v1 kiểm `apiVersion` và nền tảng. V1 không có
dependency giữa các plugin. Tính năng cần API chưa có phải chờ phiên bản hợp đồng mới.

## SDK client

Workspace [`@nuvokit/plugin-sdk`](../../packages/plugin-sdk/README.md), version
package 0.1.0; chưa publish npm, API/format ở version 1. Không import Tauri/Node/DOM.
Host cung cấp transport riêng đã gắn danh tính guest; plugin không truyền ID hoặc
namespace tùy ý khi gọi storage.

| SDK | Quyền / Kết quả |
| --- | --- |
| `getContext()` | ID/version đã xác minh, API version, platform, locale, theme |
| `storage.get(key)` | `storage.read`, trả JSON hoặc null nếu chưa có |
| `storage.set(key, value)` | `storage.write`, một giá trị JSON ≤64 KiB UTF-8 |
| `storage.remove(key)` | `storage.write`, xóa key của plugin đó |
| `onThemeChanged(listener)` | Theme light/dark, trả unsubscribe |
| `dispose()` | Ngừng subscriptions, đóng transport; gọi lặp an toàn |

Key: 1–128 ký tự ASCII chữ/số/`._-`, bắt đầu chữ/số; không dùng reserved prototype
keys, đường dẫn hoặc namespace bên ngoài. JSON chỉ có null/boolean/string/finite
number/array/plain object, tối đa 32 cấp; không cycle/undefined/function.
Host giới hạn tổng key/value UTF-8 của mỗi plugin ở 1 MiB, ghi vượt quota phải
thất bại nguyên tử với QUOTA_EXCEEDED. Client chưa có host storage để thực thi quota.

Transport phải reject bằng mã `PERMISSION_DENIED`, `NOT_FOUND` (resource host không
còn), `QUOTA_EXCEEDED`, `HOST_UNAVAILABLE`, `CANCELLED` hoặc `INTERNAL`. Key không có
trả null, không phải NOT_FOUND. Client có `INVALID_ARGUMENT`, `DISPOSED` cho lỗi local.
Lỗi host không bị biến thành thành công. Host kiểm lại mọi giới hạn ở biên nhận.

Transport là port nội bộ có phương thức cố định, không phải API public `invoke`
native của app shell. Không định nghĩa một arbitrary-method bridge hoặc generic
SQL API. Wire protocol/handshake guest cụ thể phải qua PoC trước khi activate gói.

## Yêu cầu runtime trước khi mở cài thật

- Guest context không dùng chung JavaScript có quyền với shell. Chỉ nạp UI đang
  được mở, dọn guest/listener/job khi đóng hoặc tắt; giới hạn cache thay vì giữ một
  WebView chạy cho mọi plugin đã cài.
- Host gắn danh tính từ instance đã xác minh và kiểm quyền từng request. CSP,
  cô lập storage/origin và chặn network/file/native ngoài bridge phải được thử,
  không chỉ khai báo trong manifest. Không coi SDK client là sandbox.
- Catalog/metadata phát hành gắn ID/version, URL, kích thước, SHA-256 và chữ ký
  Ed25519 của bytes gói, key ID tin cậy do host pin. Key đặt trong manifest hoặc
  gói tự ký không tạo ra tin cậy. Chưa phát sinh key/chữ ký hoặc catalog thật.
- Cập nhật tăng quyền phải xác nhận lại; giữ version cũ cho rollback. Đổi dữ liệu
  phải có recovery/transaction; bản backup lõi hiện tại mới chứa theme/history,
  cần mở rộng hợp đồng backup trước khi có dữ liệu plugin thực.
- Gói và dữ liệu nằm ở vùng riêng do host quản lý, không trong source repo hoặc
  install directory của app. Gỡ có lựa chọn giữ/xuất dữ liệu, mặc định giữ.
- Store/macOS/web cần kiểm tra chính sách kênh và khả năng guest riêng trước phát hành.

## Kiểm tra hiện có

`npm run check` kiểm TypeScript, `npm test` chạy manifest/SDK/catalog tests.
Không có lệnh cài gói thật được công bố. SDK transport test dùng mock, không coi
đó là bằng chứng kiểm quyền hoặc cô lập của native host.

Nguồn: [JSON Schema 2020-12](https://json-schema.org/draft/2020-12),
[Tauri capabilities](https://v2.tauri.app/security/capabilities/).
