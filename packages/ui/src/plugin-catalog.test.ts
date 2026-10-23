import { expect, it } from "vitest";
import { filterPlugins, initialDemoIds, pluginCatalog } from "./plugin-catalog";
const installed = new Set(initialDemoIds);
it("searches Vietnamese with or without diacritics and combines filters", () => {
  expect(filterPlugins(pluginCatalog, "dong ho", "all", false, installed, "suggested").map(p => p.slug)).toEqual(["clock"]);
  expect(filterPlugins(pluginCatalog, "thu vien", "productivity", false, installed, "suggested")).toEqual([]);
  expect(filterPlugins(pluginCatalog, "", "reading", true, installed, "suggested").map(p => p.slug)).toEqual(["books"]);
  expect(filterPlugins(pluginCatalog, "   KHÔNG TỒN TẠI  ", "all", false, installed, "suggested")).toEqual([]);
});
it("sorts without mutating the catalogue and never invents a download URL", () => {
  const before = pluginCatalog.map(p => p.slug);
  const sorted = filterPlugins(pluginCatalog, "", "all", false, installed, "name");
  expect(sorted[0].manifest.name).toBe("Công việc");
  expect(pluginCatalog.map(p => p.slug)).toEqual(before);
  expect(pluginCatalog.every(p => !("downloadUrl" in p))).toBe(true);
});
