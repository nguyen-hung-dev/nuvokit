export * from "./manifest";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type PluginTheme = "light" | "dark";
export const STORAGE_LIMITS = { keyLength: 128, valueBytes: 65_536, depth: 32, totalBytes: 1_048_576 } as const;
export type PluginErrorCode = "INVALID_ARGUMENT" | "DISPOSED" | "PERMISSION_DENIED" | "NOT_FOUND" | "QUOTA_EXCEEDED" | "HOST_UNAVAILABLE" | "CANCELLED" | "INTERNAL";
export interface PluginContext {
  apiVersion: 1;
  pluginId: string;
  pluginVersion: string;
  platform: import("./manifest").PluginPlatform;
  locale: string;
  theme: PluginTheme;
}

/** Host-owned, identity-bound transport. Implementations must enforce permissions
 * server-side. This contract grants no native/filesystem/SQL/network access. */
export interface PluginTransport {
  request(method: "context.get", params: Record<string, never>): Promise<PluginContext>;
  request(method: "storage.get", params: { key: string }): Promise<JsonValue | null>;
  request(method: "storage.set", params: { key: string; value: JsonValue }): Promise<void>;
  request(method: "storage.remove", params: { key: string }): Promise<void>;
  subscribe(event: "theme.changed", listener: (theme: PluginTheme) => void): () => void;
  dispose(): void;
}
export interface PluginSdk {
  getContext(): Promise<PluginContext>;
  storage: {
    get(key: string): Promise<JsonValue | null>;
    set(key: string, value: JsonValue): Promise<void>;
    remove(key: string): Promise<void>;
  };
  onThemeChanged(listener: (theme: PluginTheme) => void): () => void;
  dispose(): void;
}

export class PluginSdkError extends Error {
  constructor(public readonly code: PluginErrorCode, message: string) { super(message); this.name = "PluginSdkError"; }
}

function jsonBytes(value: JsonValue): number {
  const visited = new Set<object>();
  const inspect = (item: unknown, depth: number): void => {
    if (depth > STORAGE_LIMITS.depth) throw new PluginSdkError("INVALID_ARGUMENT", "Dữ liệu lồng quá 32 cấp.");
    if (item === null || typeof item === "string" || typeof item === "boolean" || (typeof item === "number" && Number.isFinite(item))) return;
    if (typeof item !== "object" || visited.has(item) || (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null)) throw new PluginSdkError("INVALID_ARGUMENT", "Chỉ chấp nhận dữ liệu JSON.");
    visited.add(item);
    for (const child of Object.values(item)) inspect(child, depth + 1);
    visited.delete(item);
  };
  inspect(value, 0);
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function createPluginSdk(transport: PluginTransport): PluginSdk {
  let disposed = false;
  const subscriptions = new Set<() => void>();
  const active = () => { if (disposed) throw new PluginSdkError("DISPOSED", "Plugin đã dừng."); };
  const key = (value: string) => {
    active();
    if (typeof value !== "string" || value.length > STORAGE_LIMITS.keyLength || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value) || ["__proto__", "prototype", "constructor"].includes(value)) throw new PluginSdkError("INVALID_ARGUMENT", "Khóa dữ liệu không hợp lệ.");
    return value;
  };
  return {
    getContext: () => { active(); return transport.request("context.get", {}); },
    storage: {
      get: (value) => transport.request("storage.get", { key: key(value) }),
      set: (name, value) => {
        const checked = key(name);
        if (jsonBytes(value) > STORAGE_LIMITS.valueBytes) throw new PluginSdkError("INVALID_ARGUMENT", "Dữ liệu vượt giới hạn 64 KiB.");
        return transport.request("storage.set", { key: checked, value });
      },
      remove: (value) => transport.request("storage.remove", { key: key(value) }),
    },
    onThemeChanged: (listener) => {
      active();
      const stop = transport.subscribe("theme.changed", theme => { if (!disposed && (theme === "light" || theme === "dark")) listener(theme); });
      const unsubscribe = () => { if (subscriptions.delete(unsubscribe)) stop(); };
      subscriptions.add(unsubscribe);
      return unsubscribe;
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      try { for (const stop of subscriptions) stop(); }
      finally { transport.dispose(); }
    },
  };
}
