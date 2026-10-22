// Called by makensis while Tauri's bundle-type patch is still applied to the
// application. The standalone target/release executable is restored afterwards.
import { basename } from "node:path";
import { statSync, writeFileSync, mkdirSync } from "node:fs";
import { hash, output, version } from "./setup-build-lib.mjs";
import path from "node:path";

const [application, product, bundleVersion] = process.argv.slice(2);
// Isolated NSIS fixtures use distinct product names and must not overwrite the
// production payload metadata when the uninstall QA suite compiles them.
if (product !== "NuvoKit") process.exit(0);
if (!application || basename(application).toLowerCase() !== "nuvokit.exe" || bundleVersion !== version)
  throw new Error("Unexpected application/version in the NSIS payload.");
mkdirSync(output, { recursive: true });
writeFileSync(path.join(output, "nsis-application.json"), JSON.stringify({
  product, version, applicationSha256: hash(application), applicationBytes: statSync(application).size,
}, null, 2) + "\n");
