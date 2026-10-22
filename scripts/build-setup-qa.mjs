import { compile, hash, root, version } from "./setup-build-lib.mjs";
import path from "node:path";
const base = path.join(root, "apps", "desktop", "src-tauri", "target", "release");
const executable = compile({ testing: true, qa: true, payload: path.join(base, "bundle", "nsis", `NuvoKit_${version}_x64-setup.exe`), applicationHash: hash(path.join(base, "nuvokit.exe")) });
console.log(`QA-only helper: ${executable}`);
