// Run only after source checks/build and before exposing a feed to clients.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { root, output, version, hash } from "./setup-build-lib.mjs";
import { releasePlan } from "./release-lib.mjs";
const repo = "nguyen-hung-dev/nuvokit";
const channel = process.argv[2] || "preview";
const plan = releasePlan(version, channel, readdirSync(output));
const run = (command, args, options = {}) => execFileSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"], ...options });
const gh = (...args) => run("gh", args);
let manifest = JSON.parse(readFileSync(path.join(output, "latest.json"), "utf8"));
if (manifest.version !== version || manifest.platforms?.["windows-x86_64"]?.url !== `https://github.com/${repo}/releases/download/${plan.tag}/NuvoKit_${version}_x64-update.exe`) throw new Error("Release metadata does not match the built version.");
const commit = run("git", ["rev-parse", "HEAD"]).trim();
let existing;
try { existing = JSON.parse(gh("release", "view", plan.tag, "--repo", repo, "--json", "isDraft,tagName")); } catch (error) { if (!String(error.stderr).includes("release not found")) throw error; }
if (existing && !existing.isDraft && !process.argv.includes("--refresh-feed")) throw new Error("This version is already published. Bump the app version; use --refresh-feed only to recover a failed metadata publication.");
if (existing && !existing.isDraft) {
  const release=JSON.parse(gh("api",`repos/${repo}/releases/tags/${plan.tag}`));
  const asset=release.assets.find(item=>item.name==="latest.json");
  if(!asset) throw new Error("Published release has no updater manifest.");
  const bytes=run("gh",["api",`repos/${repo}/releases/assets/${asset.id}`,"-H","Accept: application/octet-stream"],{encoding:null});
  manifest=JSON.parse(bytes.toString("utf8"));
  if(manifest.version!==version || manifest.platforms?.["windows-x86_64"]?.url!==`https://github.com/${repo}/releases/download/${plan.tag}/NuvoKit_${version}_x64-update.exe`) throw new Error("Published manifest does not match this release.");
} else {
if (!existing) gh("release", "create", plan.tag, "--repo", repo, "--target", commit, "--draft", "--title", `NuvoKit ${version} — Windows ${channel === "preview" ? "preview" : "stable"}`, "--notes-file", `docs/releases/${version}.md`, ...(plan.prerelease ? ["--prerelease"] : []));
gh("release", "upload", plan.tag, "--repo", repo, ...plan.assets.map(name => path.join(output, name)), "--clobber");
// Confirm uploaded assets and server digests before changing the channel pointer.
const release = JSON.parse(gh("api", `repos/${repo}/releases/tags/${plan.tag}`));
if (release.target_commitish !== commit && release.target_commitish !== "main") throw new Error("Draft release points to a different source revision.");
if (plan.assets.some(name => !release.assets.some(asset => asset.name === name && asset.size > 0))) throw new Error("Release assets are incomplete.");
for (const name of plan.assets) { const asset = release.assets.find(item => item.name === name); if (asset.digest !== `sha256:${hash(path.join(output,name))}`) throw new Error(`Uploaded asset digest mismatch: ${name}`); }
gh("release", "edit", plan.tag, "--repo", repo, "--draft=false", `--prerelease=${plan.prerelease}`, `--latest=${!plan.prerelease}`);
}
// GitHub Contents API updates only this one small metadata file on main. The
// encrypted signing key and binary outputs never enter a source commit.
let prior;
try { prior = JSON.parse(gh("api", `repos/${repo}/contents/${plan.feed}?ref=main`)); } catch (error) { if (!String(error.stderr).includes("404")) throw error; }
const body = { message: `release: point ${channel} updates to ${version}`, content: Buffer.from(JSON.stringify(manifest, null, 2) + "\n").toString("base64"), branch: "main", ...(prior ? { sha: prior.sha } : {}) };
run("gh", ["api", "--method", "PUT", `repos/${repo}/contents/${plan.feed}`, "--input", "-"], { input: JSON.stringify(body) });
console.log(JSON.stringify({ published: true, version, channel, sourceCommit: commit, url: `https://github.com/${repo}/releases/tag/${plan.tag}`, feed: plan.feed }));
