// Exercise the generated NSIS uninstaller against isolated synthetic files.
// This never installs/uninstalls the real NuvoKit product or uses its AppData.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { root, run, version, targetRoot } from "./setup-build-lib.mjs";

if (process.platform !== "win32") throw new Error("Windows NSIS QA requires Windows.");
const generated = path.join(targetRoot, "release/nsis/x64");
const template = readFileSync(path.join(generated, "installer.nsi"), "utf8");
assert(template.includes(`!define VERSION "${version}"`), "Build the current installer first.");
assert(template.includes("windows\\hooks.nsh") || template.includes("windows/hooks.nsh"), "Production uninstall hooks must be configured.");
const id = randomUUID().replaceAll("-", "");
const qaRoot = path.join(root, "output", "uninstall-qa", id);
mkdirSync(qaRoot, { recursive: true });
const inside = (file) => {
  const resolved = path.resolve(file);
  assert(resolved.startsWith(qaRoot + path.sep), "QA paths must stay inside their unique workspace directory.");
  return resolved;
};
const fixture = inside(path.join(qaRoot, "nuvokit-qa.exe"));
const source = inside(path.join(qaRoot, "Fixture.cs"));
writeFileSync(source, "internal static class Program { private static void Main() {} }\n");
run(path.join(process.env.WINDIR, "Microsoft.NET/Framework64/v4.0.30319/csc.exe"), ["/nologo", "/target:winexe", `/out:${fixture}`, source]);
const compiler = path.join(process.env.LOCALAPPDATA, "tauri/NSIS/makensis.exe");
assert(existsSync(compiler), "Build the installer first to prepare the NSIS toolchain.");
const registry = (key, value) => spawnSync("reg.exe", ["query", key, ...(value ? ["/v", value] : [])], { encoding: "utf8", windowsHide: true });
const realKey = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NuvoKit";
const realBefore = registry(realKey).stdout;
const manufacturerKey = `HKCU\\Software\\nuvokit-qa-${id}`;
assert.notEqual(registry(manufacturerKey).status, 0, "QA registry namespace must not already exist.");
const results = [];

for (const mode of ["silent", "passive", "update", "selected-cleanup"]) {
  const caseRoot = inside(path.join(qaRoot, mode));
  mkdirSync(caseRoot);
  const product = `NuvoKit-QA-${id}-${mode}`;
  const key = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${product}`;
  assert.notEqual(registry(key).status, 0, "Never overwrite an existing registration.");
  const install = inside(path.join(caseRoot, "app"));
  const local = inside(path.join(caseRoot, "local-data"));
  const roaming = inside(path.join(caseRoot, "roaming-data"));
  const exports = inside(path.join(caseRoot, "exported-document.txt"));
  const outside = inside(path.join(caseRoot, "sibling-app-data", "keep.txt"));
  for (const folder of [local, roaming, path.dirname(outside)]) mkdirSync(folder, { recursive: true });
  for (const file of [path.join(local, "core.sqlite"), path.join(roaming, "cache.txt"), exports, outside])
    writeFileSync(file, "Synthetic NuvoKit QA fixture, not user data.\n");
  for (const include of ["utils.nsh", "FileAssociation.nsh"]) copyFileSync(path.join(generated, include), path.join(caseRoot, include));
  let script = template;
  const define = (name, value) => {
    const pattern = new RegExp(`^!define ${name} ".*"$`, "m");
    assert(pattern.test(script), `NSIS template contract changed: ${name}`);
    script = script.replace(pattern, () => `!define ${name} "${value}"`);
  };
  define("PRODUCTNAME", product);
  define("MANUFACTURER", `nuvokit-qa-${id}`);
  define("BUNDLEID", `com.nuvokit.qa.${id}.${mode}`);
  define("MAINBINARYNAME", "nuvokit-qa");
  define("MAINBINARYSRCPATH", fixture);
  define("OUTFILE", inside(path.join(caseRoot, "fixture-setup.exe")));
  // Only the fixture's data/shortcut destinations change. The generated NSIS
  // registration, preservation guards and removal section are exercised as built.
  assert(script.includes('"$APPDATA\\${BUNDLEID}"'));
  assert(script.includes('"$LOCALAPPDATA\\${BUNDLEID}"'));
  script = script.replaceAll('"$APPDATA\\${BUNDLEID}"', `"${roaming}"`)
    .replaceAll('"$LOCALAPPDATA\\${BUNDLEID}"', `"${local}"`)
    .replaceAll("$DESKTOP", inside(path.join(caseRoot, "desktop")))
    .replaceAll("$SMPROGRAMS", inside(path.join(caseRoot, "start-menu")));
  if (mode === "selected-cleanup") {
    // QA only: after testing the real silent-mode guard, inject the equivalent
    // of a confirmed interactive checkbox choice. Production has no such flag.
    // This tests removal semantics, not clicking the destructive dialog.
    const hook = "!insertmacro NSIS_HOOK_PREUNINSTALL";
    assert.equal(script.split(hook).length, 2);
    script = script.replace(hook, hook + '\n    ${If} $DeleteAppDataCheckboxState != 0\n      SetErrorLevel 93\n      Quit\n    ${EndIf}\n    StrCpy $DeleteAppDataCheckboxState 1');
  }
  const file = inside(path.join(caseRoot, "installer.nsi"));
  writeFileSync(file, script);
  run(compiler, ["-V1", file], { cwd: caseRoot });
  run(path.join(caseRoot, "fixture-setup.exe"), ["/S", "/NS", "/D=" + install], { timeout: 60000 });
  const uninstall = inside(path.join(install, "uninstall.exe"));
  assert(existsSync(uninstall), "Uninstaller must be installed.");
  assert(existsSync(path.join(install, "nuvokit-qa.exe")), "Fixture executable must exist before uninstall.");
  assert(registry(key, "UninstallString").stdout.includes(`"${uninstall}"`));
  assert(registry(key, "QuietUninstallString").stdout.includes(`"${uninstall}" /S`));
  assert(registry(key, "DisplayVersion").stdout.includes(version));
  const command = [mode === "passive" ? "/P" : "/S", ...(mode === "update" ? ["/UPDATE"] : [])];
  // _?= runs this synthetic uninstaller in place so the process can be waited
  // on reliably. It leaves its own file behind; this is not a self-removal test.
  run(uninstall, [...command, "_?=" + install], { timeout: 60000 });
  assert(!existsSync(path.join(install, "nuvokit-qa.exe")), "Program must be removed.");
  assert.notEqual(registry(key).status, 0, "Windows Apps registration must be removed.");
  assert.equal(existsSync(local), mode !== "selected-cleanup", "Local data choice");
  assert.equal(existsSync(roaming), mode !== "selected-cleanup", "Roaming data choice");
  assert(existsSync(exports) && existsSync(outside), "Exports and sibling data stay untouched.");
  assert.equal(registry(realKey).stdout, realBefore, "Real NuvoKit registration must stay unchanged.");
  results.push({ mode, passed: true });
}
if (registry(manufacturerKey).status === 0) run("reg.exe", ["delete", manufacturerKey, "/f"]);
writeFileSync(path.join(qaRoot, "results.json"), JSON.stringify({ version, actualNuvoKitModified: false, cases: results }, null, 2) + "\n");
console.log(JSON.stringify({ version, isolatedNsisCases: results, actualNuvoKitModified: false }));
