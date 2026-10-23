import { existsSync, mkdirSync, writeFileSync, rmSync, copyFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { compile, hash, output, root, run, version, payloadApplicationHash, targetRoot } from "./setup-build-lib.mjs";
import { collectNotices } from "./collect-notices.mjs";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this command through npm run desktop:bundle.");
collectNotices();
// Require fresh compile-time evidence for this payload, not a prior build.
rmSync(path.join(output, "nsis-application.json"), { force: true });
run(process.execPath, [npmCli, "run", "desktop:payload"]);
const base = path.join(targetRoot, "release");
const payload = path.join(base, "bundle", "nsis", `NuvoKit_${version}_x64-setup.exe`);
const app = path.join(base, "nuvokit.exe");
if (!existsSync(payload) || !existsSync(app)) throw new Error("Tauri did not produce the expected x64 payload.");
mkdirSync(output, { recursive: true });
const applicationHash = payloadApplicationHash();
const setup = compile({ payload, applicationHash });
// .NET Framework is provided by Windows 11. The startup config is embedded as
// a manifest target too; the published setup is a single executable.
const checksum = hash(setup);
writeFileSync(path.join(output, "SHA256SUMS.txt"), `${checksum}  ${path.basename(setup)}\n${hash(path.join(output, "THIRD_PARTY_LICENSES.txt"))}  THIRD_PARTY_LICENSES.txt\n`);
writeFileSync(path.join(output, "build-manifest.json"), JSON.stringify({ version, setup: path.basename(setup), setupSha256: checksum, payloadSha256: hash(payload), applicationSha256: applicationHash, unbundledApplicationSha256: hash(app) }, null, 2) + "\n");
console.log(`GUI installer: ${setup}\nSHA-256: ${checksum}`);

const update = path.join(output, `NuvoKit_${version}_x64-update.exe`);
const signature = `${payload}.sig`;
if (!existsSync(signature)) throw new Error("Signed updater payload missing. Set TAURI_SIGNING_PRIVATE_KEY and its password before release build.");
copyFileSync(payload, update);
copyFileSync(signature, `${update}.sig`);
const { makeManifest } = await import("./release-lib.mjs");
const notes = readFileSync(path.join(root, "docs/releases", `${version}.md`), "utf8");
writeFileSync(path.join(output, "latest.json"), JSON.stringify(makeManifest(version, readFileSync(`${update}.sig`, "utf8").trim(), notes), null, 2) + "\n");
writeFileSync(path.join(output, "SHA256SUMS.txt"), [setup, update, `${update}.sig`, path.join(output,"latest.json"),path.join(output,"THIRD_PARTY_LICENSES.txt")].map(file => `${hash(file)}  ${path.basename(file)}`).join("\n") + "\n");
