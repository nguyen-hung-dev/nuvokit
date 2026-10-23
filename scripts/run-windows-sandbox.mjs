import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { root, version, compile, payloadApplicationHash, hash, targetRoot } from "./setup-build-lib.mjs";

if (process.platform !== "win32") throw new Error("Windows Sandbox QA requires Windows.");
const mode = process.argv[2] || "online";
if (!["online", "offline"].includes(mode)) throw new Error("Choose online or offline.");
const prepareOnly = process.argv.includes("prepare");
const binaryRoot = path.join(targetRoot, "release");
const payload = path.join(binaryRoot, "bundle/nsis", `NuvoKit_${version}_x64-setup.exe`);
if (!existsSync(payload)) throw new Error("Run npm run desktop:bundle first.");
const id = randomUUID().replaceAll("-", "");
const runRoot = path.join(root, "output/windows-sandbox", id);
const input = path.join(runRoot, "input"), results = path.join(runRoot, "results");
mkdirSync(input, { recursive: true }); mkdirSync(results);
const previous = JSON.parse(readFileSync(path.join(root, "qa/windows-previous-release.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(previous.version) || !/^[a-f0-9]{64}$/.test(previous.sha256)
    || previous.url !== `https://github.com/nguyen-hung-dev/nuvokit/releases/download/v${previous.version}/NuvoKit_${previous.version}_x64-setup.exe`)
  throw new Error("Previous-release QA metadata must identify an exact NuvoKit release.");
const previousSetup = path.join(input, "previous-setup.exe");
const response = await fetch(previous.url, { signal: AbortSignal.timeout(60000) });
if (!response.ok) throw new Error("Could not download the pinned prior release for upgrade QA.");
const previousBytes = Buffer.from(await response.arrayBuffer());
if (previousBytes.length > 16 * 1024 * 1024) throw new Error("Previous release exceeds the QA size limit.");
writeFileSync(previousSetup, previousBytes);
if (hash(previousSetup) !== previous.sha256) throw new Error("Previous release SHA-256 mismatch.");
// Extract the verified .NET setup's embedded NSIS payload, without executing
// the old installer on the host. Only the WDAG guest will install this resource.
const previousPayload = path.join(input, "previous-payload.exe");
const extraction = `param([string]$Source,[string]$Target)
$assembly=[Reflection.Assembly]::LoadFile($Source)
$expected=$assembly.GetType('NuvoKit.Setup.BuildInfo').GetField('PayloadHash').GetRawConstantValue()
$stream=$assembly.GetManifestResourceStream('NuvoKit.Payload')
if ($null -eq $stream) { throw 'Previous setup has no payload' }
$file=[IO.File]::Create($Target)
try { $stream.CopyTo($file) } finally { $file.Dispose(); $stream.Dispose() }
if ((Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Previous payload checksum mismatch' }
`;
const extractor = path.join(input, "extract-previous.ps1"); writeFileSync(extractor, extraction);
const extracted = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", extractor, "-Source", previousSetup, "-Target", previousPayload], { encoding: "utf8", windowsHide: true });
if (extracted.error || extracted.status !== 0) throw new Error("Could not verify/extract the prior NSIS payload: " + extracted.stderr);
const helper = compile({ testing: true, qa: true, payload, applicationHash: payloadApplicationHash(), previousPayload });
copyFileSync(helper, path.join(input, "nuvokit-setup-tests.exe"));
copyFileSync(path.join(root, "qa/windows-sandbox-worker.ps1"), path.join(input, "worker.ps1"));
writeFileSync(path.join(input, "expected.json"), JSON.stringify({ applicationHash: payloadApplicationHash() }));
const xml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const config = path.join(runRoot, `${mode}.wsb`);
const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\\NuvoKitSetup\\worker.ps1 -RunId ${id} -Mode ${mode}`.replaceAll("\\\\", "\\");
writeFileSync(config, `<Configuration>
  <vGPU>Disable</vGPU><Networking>${mode === "online" ? "Enable" : "Disable"}</Networking>
  <AudioInput>Disable</AudioInput><VideoInput>Disable</VideoInput><ClipboardRedirection>Disable</ClipboardRedirection><PrinterRedirection>Disable</PrinterRedirection>
  <MemoryInMB>4096</MemoryInMB>
  <MappedFolders>
    <MappedFolder><HostFolder>${xml(input)}</HostFolder><SandboxFolder>C:\\NuvoKitSetup</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>${xml(results)}</HostFolder><SandboxFolder>C:\\NuvoKitQAResults</SandboxFolder><ReadOnly>false</ReadOnly></MappedFolder>
  </MappedFolders>
  <LogonCommand><Command>${xml(command)}</Command></LogonCommand>
</Configuration>\n`.replaceAll("\\\\", "\\"));
const read = (file) => JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const realKey = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NuvoKit";
const registration = () => spawnSync("reg.exe", ["query", realKey], { encoding: "utf8", windowsHide: true }).stdout;
const before = registration();
console.log(JSON.stringify({ runId: id, mode, prepared: true, config }));
if (prepareOnly) process.exit(0);
// Use an explicit owned Sandbox ID so a completed test can release its VM
// without touching a Sandbox that was started by somebody else.
const existing = spawnSync("wsb.exe", ["list", "--raw"], { encoding: "utf8", windowsHide: true });
if (existing.error || existing.status !== 0) throw new Error("Automated QA needs the Windows Sandbox CLI (Windows 11 24H2+). The prepared .wsb is available for manual use.");
const environments = JSON.parse(existing.stdout).WindowsSandboxEnvironments;
if (!Array.isArray(environments) || environments.length) throw new Error("Another Sandbox is already running. This runner will not stop unrelated sessions.");
const sandboxId = `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
const created = spawnSync("wsb.exe", ["start", "--id", sandboxId, "--config", readFileSync(config, "utf8"), "--raw"], { encoding: "utf8", windowsHide: true, timeout: 120000 });
if (created.error || created.status !== 0) throw new Error("Could not start the owned Windows Sandbox: " + (created.error?.message || created.stderr || created.stdout));
writeFileSync(path.join(runRoot, "owner.json"), JSON.stringify({ runId: id, sandboxId }));
const child = spawn("wsb.exe", ["connect", "--id", sandboxId], { windowsHide: true, stdio: "ignore" });
let launchError;
child.on("error", (error) => { launchError = error.message; });
const evidence = { version, payloadSha256: hash(payload), applicationSha256: payloadApplicationHash(), setupSha256: hash(path.join(root, "output/windows-setup", `NuvoKit_${version}_x64-setup.exe`)) };
let status = { runId: id, mode, ...evidence, success: false, state: "waiting" };
const start = Date.now(); let announced = false;
while (Date.now() - start < 600_000) {
  if (launchError) { status = { ...status, state: "launch-failed", error: launchError }; break; }
  const report = path.join(results, "result.json");
  if (existsSync(report)) {
    const value = read(report);
    if (value.runId !== id || value.mode !== mode) throw new Error("Sandbox report belongs to a different run.");
    status = { ...value, ...evidence, state: value.success ? "passed" : "failed" }; break;
  }
  const started = path.join(results, "started.json");
  if (existsSync(started) && !announced) {
    if (read(started).runId !== id) throw new Error("Guest startup marker mismatch.");
    console.log("Guest started; waiting for actual installation/data/uninstall results."); announced = true;
  }
  if (!announced && Date.now() - start > 90_000) { status = { ...status, state: "guest-not-started" }; break; }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
if (status.state === "waiting") status.state = "timeout";
const stopped = spawnSync("wsb.exe", ["stop", "--id", sandboxId], { encoding: "utf8", windowsHide: true, timeout: 60000 });
status.sandboxStopped = !stopped.error && stopped.status === 0;
if (registration() !== before) throw new Error("Host NuvoKit registration changed unexpectedly.");
writeFileSync(path.join(runRoot, "host-status.json"), JSON.stringify(status, null, 2) + "\n");
console.log(JSON.stringify(status));
process.exitCode = status.success ? 0 : 2;
