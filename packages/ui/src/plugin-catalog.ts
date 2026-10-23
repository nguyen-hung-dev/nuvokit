import { validateManifest, type PluginManifest } from "@nuvokit/plugin-sdk";

export type PluginCategory = "productivity" | "reading" | "utilities";
export interface CatalogPlugin {
  manifest: PluginManifest;
  slug: string;
  category: PluginCategory;
  tagline: string;
  features: string[];
  tone: string;
}
export const categories = [
  { id: "all", label: "Tất cả" },
  { id: "productivity", label: "Năng suất" },
  { id: "reading", label: "Đọc & học" },
  { id: "utilities", label: "Tiện ích" },
] as const;
export type CategoryFilter = typeof categories[number]["id"];

function plugin(slug: string, name: string, category: PluginCategory, description: string, tagline: string, tone: string, features: string[]): CatalogPlugin {
  const result = validateManifest({
    formatVersion: 1, apiVersion: 1, id: `dev.nuvokit.${slug}`, name, version: "0.1.0",
    description, publisher: "NuvoKit", license: "UNLICENSED", entry: "ui/index.html", icon: "assets/icon.svg",
    platforms: ["windows", "macos", "web"], permissions: ["storage.read", "storage.write"],
  });
  if (!result.valid) throw new Error(result.errors.join(" "));
  return { slug, category, tagline, tone, features, manifest: result.manifest };
}

// UI fixtures only. These descriptors have no download URL and never enter the
// native dependency installer. No external code is loaded from this catalogue.
export const pluginCatalog: readonly CatalogPlugin[] = [
  plugin("clock", "Đồng hồ", "productivity", "Tập trung, nghỉ ngơi và lưu phiên làm việc.", "Tập trung theo nhịp của bạn", "purple", ["Tập trung theo phiên", "Theo dõi thời gian", "Xem lại lịch sử"]),
  plugin("books", "Sách", "reading", "Theo dõi thư viện và tiến độ đọc.", "Tiếp tục hành trình đọc", "gold", ["Sắp xếp thư viện", "Lưu tiến độ đọc", "Tiếp tục sách gần đây"]),
  plugin("tasks", "Công việc", "productivity", "Danh sách việc cần làm, gọn trong một nơi.", "Sắp xếp điều cần làm", "green", ["Tạo danh sách việc", "Sắp xếp ưu tiên", "Theo dõi việc hoàn thành"]),
  plugin("calendar", "Lịch", "productivity", "Sắp xếp lịch cá nhân theo ngày.", "Kế hoạch trong tầm mắt", "blue", ["Xem kế hoạch trong ngày", "Tạo sự kiện cá nhân", "Sắp xếp lịch theo nhu cầu"]),
  plugin("notes", "Ghi chú", "utilities", "Ghi lại ý tưởng và những điều cần nhớ.", "Giữ lại những ý tưởng", "peach", ["Tạo ghi chú", "Tìm lại nội dung", "Sắp xếp ý tưởng"]),
  plugin("habits", "Thói quen", "utilities", "Duy trì những việc nhỏ mỗi ngày.", "Từng bước, mỗi ngày", "teal", ["Tạo thói quen", "Ghi nhận mỗi ngày", "Xem lại tiến trình"]),
];
export const initialDemoIds = pluginCatalog.slice(0, 3).map(plugin => plugin.manifest.id);
export function filterPlugins(plugins: readonly CatalogPlugin[], query: string, category: CategoryFilter, installedOnly: boolean, installed: ReadonlySet<string>, sort: "suggested" | "name") {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi-VN");
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const result = plugins.filter(plugin => (category === "all" || category === plugin.category)
    && (!installedOnly || installed.has(plugin.manifest.id))
    && terms.every(term => normalize(`${plugin.manifest.name} ${plugin.manifest.description}`).includes(term)));
  return sort === "name" ? result.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name, "vi-VN")) : result;
}
