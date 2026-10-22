import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compile, hash, output, root, run, version } from "./setup-build-lib.mjs";
import { collectNotices } from "./collect-notices.mjs";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this command through npm run desktop:bundle.");
collectNotices();
run(process.execPath, [npmCli, "run", "desktop:payload"]);
const base = path.join(root, "apps", "desktop", "src-tauri", "target", "release");
const payload = path.join(base, "bundle", "nsis", `NuvoKit_${version}_x64-setup.exe`);
const app = path.join(base, "nuvokit.exe");
if (!existsSync(payload) || !existsSync(app)) throw new Error("Tauri did not produce the expected x64 payload.");
mkdirSync(output, { recursive: true });
const setup = compile({ payload, applicationHash: hash(app) });
// .NET Framework is provided by Windows 11. The startup config is embedded as
// a manifest target too; the published setup is a single executable.
const checksum = hash(setup);
writeFileSync(path.join(output, "SHA256SUMS.txt"), `${checksum}  ${path.basename(setup)}\n${hash(path.join(output, "THIRD_PARTY_LICENSES.txt"))}  THIRD_PARTY_LICENSES.txt\n`);
writeFileSync(path.join(output, "build-manifest.json"), JSON.stringify({ version, setup: path.basename(setup), setupSha256: checksum, payloadSha256: hash(payload), applicationSha256: hash(app) }, null, 2) + "\n");
console.log(`GUI installer: ${setup}\nSHA-256: ${checksum}`);
