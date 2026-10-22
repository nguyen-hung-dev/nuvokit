import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { root, output } from "./setup-build-lib.mjs";

export function collectNotices() {
  const cargo = JSON.parse(execFileSync("cargo", ["metadata", "--locked", "--format-version", "1", "--manifest-path", "apps/desktop/src-tauri/Cargo.toml", "--filter-platform", "x86_64-pc-windows-msvc"], { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, windowsHide: true }));
  const groups = new Map();
  const add = (name, directory, licenseFile, key) => {
    const candidates = readdirSync(directory, { withFileTypes: true }).filter(e => e.isFile() && /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$/i.test(e.name)).map(e => path.join(directory, e.name));
    if (licenseFile && existsSync(path.join(directory, licenseFile))) candidates.push(path.join(directory, licenseFile));
    if (!candidates.length && key) {
      const folder = path.join(root, "apps", "windows-setup", "upstream-licenses");
      const sources = JSON.parse(readFileSync(path.join(folder, "sources.json"), "utf8"));
      const fallback = path.join(folder, key + ".txt");
      if (sources[key] && existsSync(fallback)) {
        const digest = createHash("sha256").update(readFileSync(fallback)).digest("hex");
        if (digest !== sources[key].sha256) throw new Error(`Upstream license checksum mismatch: ${key}`);
        candidates.push(fallback);
      }
    }
    if (!candidates.length) throw new Error(`Missing upstream license text: ${name}`);
    for (const file of new Set(candidates)) {
      const body = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
      const digest = createHash("sha256").update(body).digest("hex");
      if (!groups.has(digest)) groups.set(digest, { names: new Set(), body });
      groups.get(digest).names.add(name);
    }
  };
  for (const pkg of cargo.packages.filter(p => p.source)) add(`${pkg.name} ${pkg.version} (${pkg.license || "see upstream"})\nSource: https://crates.io/crates/${pkg.name}/${pkg.version}`, path.dirname(pkg.manifest_path), pkg.license_file, `${pkg.name}-${pkg.version}`);
  // These are the shipped frontend runtime packages; build tools are excluded.
  for (const name of ["react", "react-dom", "scheduler", "lucide-react", "@tauri-apps/api"]) {
    const dir = path.join(root, "node_modules", name);
    const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
    add(`${name} ${pkg.version} (${pkg.license || "see upstream"})`, dir);
  }
  const text = "NuvoKit — upstream third-party notices\nNuvoKit's own license is not selected. These are upstream terms only.\nIncludes registry crates for the Windows dependency graph, including build-time crates.\nWindows/.NET/WebView2/Segoe UI are provided under Microsoft's own terms.\n\n" + [...groups.values()].map(g => "=".repeat(72) + "\n" + [...g.names].sort().join("\n") + "\n\n" + g.body).join("\n\n");
  mkdirSync(output, { recursive: true });
  const target = path.join(output, "THIRD_PARTY_LICENSES.txt");
  if (!existsSync(target) || readFileSync(target, "utf8") !== text) writeFileSync(target, text, "utf8");
  return target;
}
