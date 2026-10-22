import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Setup requires a numeric three-part version.");
export const output = path.join(root, "output", "windows-setup");
export const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
export function payloadApplicationHash() {
  const meta = JSON.parse(readFileSync(path.join(output, "nsis-application.json"), "utf8"));
  if (meta.product !== "NuvoKit" || meta.version !== version || !/^[a-f0-9]{64}$/.test(meta.applicationSha256) || !(meta.applicationBytes > 0))
    throw new Error("Missing or stale NSIS application hash; rebuild the installer.");
  return meta.applicationSha256;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", windowsHide: true, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} failed (${result.status}).`);
}

export function compile({ testing = false, qa = false, payload, applicationHash, previousPayload }) {
  if (process.platform !== "win32") throw new Error("Windows Setup is built on Windows.");
  const compiler = path.join(process.env.WINDIR || "C:\\Windows", "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");
  if (!existsSync(compiler)) throw new Error("The Windows .NET Framework compiler is missing.");
  const generated = path.join(output, testing ? (qa ? "integration" : "tests") : "build");
  mkdirSync(generated, { recursive: true });
  const info = path.join(generated, "BuildInfo.cs");
  writeFileSync(info, `using System.Reflection;\n[assembly: AssemblyTitle("NuvoKit Setup")]\n[assembly: AssemblyProduct("NuvoKit")]\n[assembly: AssemblyVersion("${version}.0")]\n[assembly: AssemblyFileVersion("${version}.0")]\n[assembly: System.Runtime.Versioning.TargetFramework(".NETFramework,Version=v4.8")]\nnamespace NuvoKit.Setup { internal static class BuildInfo { public const string Version = "${version}"; public const string PayloadHash = "${hash(payload)}"; public const string ApplicationHash = "${applicationHash}"; } }\n`, "utf8");
  const iconRoot = path.join(root, "apps", "desktop", "src-tauri", "icons");
  for (const name of ["icon.ico", "128x128.png"]) {
    if (!existsSync(path.join(iconRoot, name))) throw new Error("Run npm ci to generate source icons first.");
  }
  const executable = testing ? path.join(generated, "nuvokit-setup-tests.exe") : path.join(output, `NuvoKit_${version}_x64-setup.exe`);
  const source = path.join(root, "apps", "windows-setup");
  const args = ["/nologo", "/utf8output", "/codepage:65001", "/langversion:5", "/optimize+", "/debug-", "/platform:x64", testing ? "/target:exe" : "/target:winexe", `/out:${executable}`, `/win32manifest:${path.join(source, "app.manifest")}`, `/win32icon:${path.join(iconRoot, "icon.ico")}`, "/reference:System.dll", "/reference:System.Core.dll", "/reference:System.Drawing.dll", "/reference:System.Windows.Forms.dll", "/reference:System.Net.Http.dll", `/resource:${payload},NuvoKit.Payload`, `/resource:${path.join(iconRoot, "128x128.png")},NuvoKit.Mark`, `/resource:${path.join(iconRoot, "icon.ico")},NuvoKit.Icon`, info, ...["SetupCore.cs", "WindowsOperations.cs", "Program.cs"].map(f => path.join(source, f))];
  if (testing) args.push("/define:SETUP_TESTS", "/main:NuvoKit.Setup.Tests.Runner", path.join(source, "Tests.cs"));
  if (testing && qa && previousPayload) args.push(`/resource:${previousPayload},NuvoKit.PreviousPayload`);
  run(compiler, args);
  return executable;
}
