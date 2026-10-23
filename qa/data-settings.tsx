// Browser-only fixture: no native commands, real files or production test flags.
import { createRoot } from "react-dom/client";
import { App } from "../packages/ui/src/App";
import { createAdapter } from "../apps/desktop/src/platform";
import type { CoreAdapter, Preferences, StorageInfo } from "@nuvokit/core";
import "../packages/ui/src/styles.css";

const qa = { events: [] as string[], failNext: "", cancelledExport: false, cancelledImport: false };
Object.assign(window, { nuvoDataQA: qa });
let preferences: Preferences = { theme: "light" };
let token: string | null = null;
let sequence = 0;
const info: StorageInfo = {
  schemaVersion: 3, databaseBytes: 65536, packageBytes: 531275,
  temporaryBytes: 32768, recoveryBytes: 4096, recoveryCount: 1,
  lastBackupAt: null, dataDirectory: "Dữ liệu tổng hợp cho QA · không đọc AppData", temporarySession: false,
};
const event = async (name: string) => {
  qa.events.push(name);
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (qa.failNext === name) { qa.failNext = ""; throw new Error("Fixture: file hỏng hoặc không đủ quyền ghi. Dữ liệu hiện tại được giữ."); }
};
const adapter: CoreAdapter = {
  ...createAdapter(), mode: "desktop",
  getPreferences: async () => preferences,
  setPreferences: async (value) => { preferences = value; },
  getStorageInfo: async () => ({ ...info }),
  exportBackup: async () => {
    await event("export"); if (qa.cancelledExport) return false;
    info.lastBackupAt = new Date().toISOString(); return true;
  },
  prepareRestore: async () => {
    await event("prepare"); if (qa.cancelledImport) return null;
    token = "fixture-" + ++sequence;
    return { token, fileName: "NuvoKit-fixture.nuvobak", createdAt: "2026-10-23T00:00:00Z", appVersion: "0.1.3", schemaVersion: 3, historyEntries: 30, clockSessions: 0, theme: "dark" };
  },
  discardRestore: async (id) => { qa.events.push("discard"); if (token === id) token = null; },
  restoreBackup: async (id) => {
    await event("restore"); if (id !== token) throw new Error("Fixture: stale restore token"); token = null;
    preferences = { theme: "dark" }; info.recoveryCount++;
    return { preferences, recoveryFile: "recovery-fixture.nuvobak" };
  },
  clearTemporaryData: async () => { await event("clear"); const bytes = info.temporaryBytes; info.temporaryBytes = 0; return bytes; },
  openDataFolder: async () => { await event("folder"); },
};
createRoot(document.getElementById("root")!).render(<App adapter={adapter}/>);
