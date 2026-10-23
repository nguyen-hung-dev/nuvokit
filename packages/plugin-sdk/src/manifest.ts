import schema from "../manifest.schema.json";

export const PLUGIN_API_VERSION = 1 as const;
export const PACKAGE_LIMITS = { manifestBytes: 16_384, archiveBytes: 16_777_216, expandedBytes: 33_554_432, fileBytes: 8_388_608, files: 256 } as const;
export type PluginPlatform = "windows" | "macos" | "web";
export type PluginPermission = "storage.read" | "storage.write";
export interface PluginManifest {
  formatVersion: 1;
  apiVersion: 1;
  id: string;
  name: string;
  version: string;
  description: string;
  publisher: string;
  license: string;
  entry: "ui/index.html";
  icon: "assets/icon.svg";
  platforms: PluginPlatform[];
  permissions: PluginPermission[];
}
export type ManifestResult = { valid: true; manifest: PluginManifest } | { valid: false; errors: string[] };

// Small, bounded validator for this closed schema only. No remote refs, code or
// plugin-provided validation logic are evaluated. Schema is the source of bounds.
export function validateManifest(value: unknown): ManifestResult {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, errors: ["Manifest phải là object JSON."] };
  const object = value as Record<string, unknown>;
  const properties = schema.properties as Record<string, { const?: unknown; type?: string; minLength?: number; maxLength?: number; pattern?: string; minItems?: number; maxItems?: number; items?: { enum: string[] } }>;
  for (const key of Object.keys(object)) if (!Object.hasOwn(properties, key)) errors.push(`Trường không hỗ trợ: ${key}.`);
  for (const key of schema.required) {
    const rule = properties[key];
    const item = object[key];
    if (!Object.hasOwn(object, key)) { errors.push(`Thiếu ${key}.`); continue; }
    if ("const" in rule && item !== rule.const) errors.push(`${key} không được hỗ trợ.`);
    if (rule.type === "string") {
      if (typeof item !== "string" || [...item].length < (rule.minLength ?? 0) || [...item].length > (rule.maxLength ?? Infinity) || (rule.pattern && !new RegExp(rule.pattern).test(item)) || item.trim() !== item || /[\u0000-\u001f\u007f]/.test(item)) errors.push(`${key} không hợp lệ.`);
    }
    if (rule.type === "array") {
      if (!Array.isArray(item) || item.length < (rule.minItems ?? 0) || item.length > (rule.maxItems ?? Infinity) || new Set(item).size !== item.length || item.some(v => typeof v !== "string" || !rule.items?.enum.includes(v))) errors.push(`${key} không hợp lệ.`);
    }
  }
  if (errors.length) return { valid: false, errors };
  return { valid: true, manifest: structuredClone(object) as unknown as PluginManifest };
}

export function parseManifest(text: string): ManifestResult {
  if (new TextEncoder().encode(text).length > PACKAGE_LIMITS.manifestBytes) return { valid: false, errors: ["Manifest vượt 16 KiB."] };
  try { return validateManifest(JSON.parse(text)); }
  catch { return { valid: false, errors: ["Manifest không phải JSON hợp lệ."] }; }
}

export function checkCompatibility(manifest: PluginManifest, host: { apiVersion: number; platform: PluginPlatform }): string | null {
  if (manifest.apiVersion !== host.apiVersion) return "Phiên bản API của host không phù hợp.";
  if (!manifest.platforms.includes(host.platform)) return "Plugin không hỗ trợ nền tảng hiện tại.";
  return null;
}

export function addedPermissions(previous: PluginManifest, next: PluginManifest): PluginPermission[] {
  return next.permissions.filter(permission => !previous.permissions.includes(permission));
}
