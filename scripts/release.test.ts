import { describe, expect, it } from "vitest";
import { makeManifest, releasePlan } from "./release-lib.mjs";
const version = "0.1.4", signature = "A".repeat(120);
const assets = [`NuvoKit_${version}_x64-setup.exe`, `NuvoKit_${version}_x64-update.exe`, `NuvoKit_${version}_x64-update.exe.sig`, "latest.json", "SHA256SUMS.txt", "THIRD_PARTY_LICENSES.txt"];
describe("release contract", () => {
  it("points a signed manifest to the immutable versioned NSIS payload", () => {
    const result=makeManifest(version,signature,"Changes","2026-10-24T00:00:00Z");
    expect(result.platforms["windows-x86_64"].url).toBe("https://github.com/nguyen-hung-dev/nuvokit/releases/download/v0.1.4/NuvoKit_0.1.4_x64-update.exe");
    expect(result.platforms["windows-x86_64"].signature).toBe(signature);
    expect(result.version).toBe(version);
  });
  it.each(["../evil", "0.1.4-beta", "v0.1.4", "https://evil.test"])("rejects invalid version %s", input => expect(()=>makeManifest(input,signature,"")).toThrow());
  it.each(["", "https://example.com/file.sig", "../key", "A".repeat(4097)])("rejects invalid signature metadata", input => expect(()=>makeManifest(version,input,"")).toThrow());
  it("requires the setup, updater, signature, manifest, checksums and notices", () => {
    for(const missing of assets) expect(()=>releasePlan(version,"preview",assets.filter(file=>file!==missing))).toThrow();
  });
  it("keeps stable and preview feeds separate", () => {
    expect(releasePlan(version,"preview",assets)).toMatchObject({prerelease:true,feed:"updates/preview.json"});
    expect(releasePlan(version,"stable",assets)).toMatchObject({prerelease:false,feed:"updates/stable.json"});
    expect(()=>releasePlan(version,"other",assets)).toThrow();
  });
});
