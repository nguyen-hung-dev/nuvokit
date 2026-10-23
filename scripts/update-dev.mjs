import { execFileSync, spawnSync } from "node:child_process";
const checkOnly = process.argv[2] === "check";
const git = (...args) => execFileSync("git", args, {encoding:"utf8",windowsHide:true}).trim();
if (!/^https:\/\/github\.com\/nguyen-hung-dev\/nuvokit(?:\.git)?$/.test(git("remote", "get-url", "origin"))) throw new Error("Source updates require this project's GitHub origin.");
const branch = git("branch", "--show-current");
if (!branch) throw new Error("Detached HEAD: switch to your working branch before updating source.");
const upstream = git("rev-parse", "--abbrev-ref", "@{upstream}");
if (!upstream.startsWith("origin/")) throw new Error("Set an origin upstream for the current branch first.");
const dirty = git("status", "--porcelain");
if (!checkOnly && dirty) throw new Error("Working tree contains edits. Commit or stash them before source:update; nothing was replaced.");
git("fetch", "origin", "--prune");
const [ahead,behind] = git("rev-list", "--left-right", "--count", `HEAD...${upstream}`).split(/\s+/).map(Number);
console.log(JSON.stringify({branch,upstream,ahead,behind,localEdits:!!dirty,checkOnly}));
if (checkOnly) process.exit(0);
if (ahead && behind) throw new Error("Branches have diverged. Reconcile your commits before updating; no reset or rebase was performed.");
if (!behind) { console.log("Source is already current."); process.exit(0); }
git("merge", "--ff-only", upstream);
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run source:update.");
for (const args of [["ci"],["run","check"]]) {
  const child=spawnSync(process.execPath,[npmCli,...args],{stdio:"inherit",windowsHide:true});
  if(child.error || child.status!==0) throw new Error("Source was updated, but dependency/check step failed. Resolve it before launching the app.");
}
console.log("Source and dependencies updated. Run npm run desktop to launch the development build.");
