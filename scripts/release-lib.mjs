const versionPattern = /^\d+\.\d+\.\d+$/;
export function makeManifest(version, signature, notes, now = new Date().toISOString()) {
  if (!versionPattern.test(version) || typeof signature !== "string" || !/^[A-Za-z0-9+/=]+$/.test(signature) || signature.length > 4096 || signature.length < 80) throw new Error("Invalid release version/signature.");
  return { version, notes, pub_date: now, platforms: { "windows-x86_64": { signature, url: `https://github.com/nguyen-hung-dev/nuvokit/releases/download/v${version}/NuvoKit_${version}_x64-update.exe` } } };
}
export function releasePlan(version, channel, files) {
  if (!versionPattern.test(version) || !["stable", "preview"].includes(channel)) throw new Error("Invalid version or channel.");
  const expected = [`NuvoKit_${version}_x64-setup.exe`, `NuvoKit_${version}_x64-update.exe`, `NuvoKit_${version}_x64-update.exe.sig`, "latest.json", "SHA256SUMS.txt", "THIRD_PARTY_LICENSES.txt"];
  if (expected.some(name => !files.includes(name))) throw new Error("Missing release artifact.");
  return { tag: `v${version}`, prerelease: channel === "preview", feed: `updates/${channel}.json`, assets: expected };
}
