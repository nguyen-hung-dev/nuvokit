import { describe, expect, it, vi } from "vitest";
import example from "../examples/manifest.json";
import { addedPermissions, checkCompatibility, createPluginSdk, parseManifest, validateManifest, type JsonValue, type PluginTransport } from "./index";

describe("manifest format 1", () => {
  it("accepts the reference and returns a detached validated value", () => {
    const source = structuredClone(example);
    const result = validateManifest(source);
    expect(result.valid).toBe(true);
    if (!result.valid) throw Error(result.errors.join(" "));
    source.platforms.length = 0;
    expect(result.manifest.platforms).toHaveLength(3);
    expect(parseManifest(JSON.stringify(example)).valid).toBe(true);
  });
  it.each([
    { formatVersion: 2 }, { apiVersion: 2 }, { id: "../clock" }, { id: "dev.nuvokit.Clock" },
    { version: "01.2.3" }, { entry: "../../outside.js" }, { entry: "https://example.test/plugin.js" },
    { icon: "../icon.svg" }, { permissions: ["shell.execute"] }, { permissions: ["storage.read", "storage.read"] },
    { platforms: [] }, { platforms: ["windows", "windows"] }, { scripts: { postinstall: "run" } },
    { name: " " }, { name: "Clock\u0000" }, { description: "x".repeat(241) },
  ])("rejects incompatible/untrusted manifest fields: %j", patch => {
    expect(validateManifest({ ...example, ...patch }).valid).toBe(false);
  });
  it("rejects missing metadata, malformed JSON and over-limit bytes", () => {
    expect(validateManifest({}).valid).toBe(false);
    expect(parseManifest("not json").valid).toBe(false);
    expect(parseManifest(" ".repeat(16_385)).valid).toBe(false);
    expect(parseManifest('"' + "ệ".repeat(6000) + '"').valid).toBe(false);
  });
  it("checks API/platform and identifies permission increases independently of version", () => {
    const result = validateManifest(example);
    if (!result.valid) throw Error("Invalid reference fixture");
    const manifest = result.manifest;
    expect(checkCompatibility(manifest, { apiVersion: 1, platform: "windows" })).toBeNull();
    expect(checkCompatibility(manifest, { apiVersion: 2, platform: "windows" })).toBeTruthy();
    expect(checkCompatibility({ ...manifest, platforms: ["windows"] }, { apiVersion: 1, platform: "web" })).toBeTruthy();
    expect(addedPermissions({ ...manifest, permissions: ["storage.read"] }, manifest)).toEqual(["storage.write"]);
  });
});

describe("minimal SDK client", () => {
  function fixture() {
    const request = vi.fn(async () => null);
    const stop = vi.fn();
    const transport = { request, subscribe: vi.fn(() => stop), dispose: vi.fn() } as unknown as PluginTransport;
    return { sdk: createPluginSdk(transport), request, stop, transport };
  }
  it("uses only fixed scoped methods without accepting a plugin namespace argument", async () => {
    const { sdk, request } = fixture();
    await sdk.storage.set("reading.page", 42);
    await sdk.storage.get("reading.page");
    await sdk.storage.remove("reading.page");
    expect(request.mock.calls).toEqual([["storage.set", { key: "reading.page", value: 42 }], ["storage.get", { key: "reading.page" }], ["storage.remove", { key: "reading.page" }]]);
    expect(() => sdk.storage.get("../other-plugin")).toThrow();
    expect(() => sdk.storage.get("__proto__")).toThrow();
  });
  it("rejects oversized, non-JSON and cyclic values before transport", () => {
    const { sdk, request } = fixture();
    expect(() => sdk.storage.set("large", "ệ".repeat(30_000))).toThrow();
    expect(() => sdk.storage.set("nan", Number.NaN)).toThrow();
    expect(() => sdk.storage.set("missing", undefined as unknown as JsonValue)).toThrow();
    const cycle: { self?: JsonValue } = {}; cycle.self = cycle as JsonValue;
    expect(() => sdk.storage.set("cycle", cycle as JsonValue)).toThrow();
    expect(request).not.toHaveBeenCalled();
  });
  it("preserves host permission errors and disposes subscriptions once", async () => {
    const { sdk, request, stop, transport } = fixture();
    request.mockRejectedValueOnce(new Error("PERMISSION_DENIED"));
    await expect(sdk.storage.set("key", true)).rejects.toThrow("PERMISSION_DENIED");
    const unsubscribe = sdk.onThemeChanged(() => {});
    sdk.dispose(); unsubscribe(); sdk.dispose();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(transport.dispose).toHaveBeenCalledTimes(1);
    expect(() => sdk.getContext()).toThrow("Plugin đã dừng");
  });
  it("closes the transport even when an unsubscribe fails", () => {
    const { sdk, stop, transport } = fixture();
    stop.mockImplementation(() => { throw new Error("unsubscribe failure"); });
    sdk.onThemeChanged(() => {});
    expect(() => sdk.dispose()).toThrow("unsubscribe failure");
    expect(transport.dispose).toHaveBeenCalledTimes(1);
    expect(() => sdk.storage.get("key")).toThrow("Plugin đã dừng");
  });
});
