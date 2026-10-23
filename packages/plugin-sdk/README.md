# @nuvokit/plugin-sdk

SDK tối thiểu nội bộ: **package 0.1.0 / API 1 / format 1**. Chưa publish npm.
Có validator manifest, TypeScript contracts và client wrapper cho transport do
host cung cấp. Chưa có transport native, loader hoặc plugin runtime hoạt động.

```ts
import { createPluginSdk, parseManifest, type PluginTransport } from "@nuvokit/plugin-sdk";

const result = parseManifest(manifestText);
if (!result.valid) throw new Error(result.errors.join(" "));

// Transport do host cấp sau khi xác minh gói và gắn danh tính guest.
// Không tự tạo transport từ invoke Tauri hoặc nhận namespace từ người dùng.
declare const transport: PluginTransport;
const sdk = createPluginSdk(transport);
const context = await sdk.getContext();
const saved = await sdk.storage.get("reading.page");
await sdk.storage.set("reading.page", 42);
const unsubscribe = sdk.onThemeChanged(theme => applyTheme(theme));

// Khi đóng guest:
unsubscribe();
sdk.dispose();
```

`manifestText` và `applyTheme` do ứng dụng mẫu cung cấp. Đoạn trên minh họa cách
dùng contract, không phải một plugin đã build/cài được.

- [Đặc tả gói/API/quyền và giới hạn](../../docs/specs/plugin-package-v1.md).
- [JSON Schema](manifest.schema.json); [manifest ví dụ](examples/manifest.json).
- Chạy `npm run check` / `npm test` ở gốc repo.
- SDK không cấp quyền filesystem/shell/SQL/network. Host vẫn phải xác thực quyền
  và hạn mức; kiểm tra ở client chỉ giúp phát hiện lỗi sớm.
- Không có giấy phép mới được chọn bởi việc tạo package; UNLICENSED trong fixture
  không phải tuyên bố cấp giấy phép nguồn NuvoKit.
