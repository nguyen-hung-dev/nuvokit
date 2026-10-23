import { spawnSync } from "node:child_process";
import path from "node:path";
import { root, targetRoot, version } from "./setup-build-lib.mjs";
const local = process.argv[2] !== "remote";
let result;
for (let attempt=0;attempt<(local?1:6);attempt++) {
  result=spawnSync(path.join(targetRoot,"release/nuvokit.exe"),[local?"--verify-update-local":"--verify-update"],{cwd:root,encoding:"utf8",windowsHide:true,timeout:90_000});
  if(!result.error && result.status===0) break;
  if(!local && attempt<5) { console.log("Waiting for published channel metadata to reach GitHub's CDN…"); await new Promise(resolve=>setTimeout(resolve,15_000)); }
}
if(result.error || result.status!==0) throw new Error(`Update verification failed: ${result.error?.message || result.stderr}`);
const report=result.stdout.split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line);}catch{return null;}}).find(value=>value?.updateVerificationPassed);
if(!report || report.version!==version || !report.signatureAndVersionVerified || !report.tamperedPackageRejected || !report.relabeledVersionRejected || report.installerExecuted || report.actualUserDataModified) throw new Error("Missing or invalid updater verification report.");
console.log(JSON.stringify(report));
