import type { ClockRepository } from "./clock";
export * from "./clock";
export * from "./updates";
import type { UpdateAdapter } from "./updates";
export type ComponentStatus = "ready" | "missing" | "error" | "unknown";
export type JobStage =
  | "downloading"
  | "verifying"
  | "installing"
  | "completed"
  | "cancelled"
  | "failed";
export interface Dependency {
  id: string;
  name: string;
  description: string;
  version: string | null;
  status: ComponentStatus;
  required: boolean;
  installable: boolean;
  bytes: number | null;
  source: string | null;
  license: string | null;
}
export interface GpuInfo {
  name: string;
  dedicatedBytes: number | null;
  software: boolean;
}
export interface EnvironmentReport {
  schemaVersion: 1;
  source: "desktop" | "preview";
  scannedAt: string;
  scanMs: number;
  os: { name: string; version: string; arch: string; supported: boolean };
  cpu: { name: string; logicalCores: number };
  memory: { totalBytes: number; availableBytes: number };
  disk: { availableBytes: number | null };
  gpus: GpuInfo[];
  gpuError: string | null;
  dependencies: Dependency[];
}
export interface JobProgress {
  id: string;
  packageId: string;
  stage: JobStage;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  message: string;
}
export interface Preferences {
  theme: "light" | "dark";
}
export interface HistoryEntry {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
}
export interface GpuProbe {
  status: "passed" | "unsupported" | "failed";
  message: string;
  elapsedMs: number;
}
export interface StorageInfo {
  schemaVersion: number;
  databaseBytes: number;
  packageBytes: number;
  temporaryBytes: number;
  recoveryBytes: number;
  recoveryCount: number;
  lastBackupAt: string | null;
  dataDirectory: string;
  temporarySession: boolean;
}
export interface RestorePreview {
  token: string;
  fileName: string;
  createdAt: string;
  appVersion: string;
  schemaVersion: number;
  historyEntries: number;
  clockSessions: number | null;
  theme: Preferences["theme"];
}
export interface RestoreResult {
  preferences: Preferences;
  recoveryFile: string;
}
export interface CoreAdapter {
  readonly mode: "desktop" | "preview";
  readonly clock: ClockRepository;
  readonly updates: UpdateAdapter;
  scan(): Promise<EnvironmentReport>;
  install(
    packageId: string,
    progress: (event: JobProgress) => void,
  ): Promise<void>;
  cancelInstall(): Promise<void>;
  getPreferences(): Promise<Preferences>;
  setPreferences(preferences: Preferences): Promise<void>;
  getHistory(): Promise<HistoryEntry[]>;
  getStorageInfo(): Promise<StorageInfo>;
  exportBackup(): Promise<boolean>;
  prepareRestore(): Promise<RestorePreview | null>;
  discardRestore(token: string): Promise<void>;
  restoreBackup(token: string): Promise<RestoreResult>;
  clearTemporaryData(): Promise<number>;
  openDataFolder(): Promise<void>;
  probeGpu(): Promise<GpuProbe>;
  uiReady(): Promise<boolean>;
  finishVerification(result: {
    phase: "baseline" | "post-gpu";
    gpuStatus: string;
    channelEvents: number;
    themePersistence: boolean;
    clockPersistence: boolean;
  }): Promise<void>;
}
export function coreReady(report: EnvironmentReport): boolean {
  return (
    report.os.supported &&
    report.dependencies
      .filter((item) => item.required)
      .every((item) => item.status === "ready")
  );
}
export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0)
    return "Chưa xác định";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2)
    return `${(bytes / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} KB`;
  if (bytes < 1024 ** 3)
    return `${(bytes / 1024 ** 2).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
  return `${(bytes / 1024 ** 3).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} GB`;
}
export function jobRunning(job: JobProgress | null): boolean {
  return (
    job !== null &&
    ["downloading", "verifying", "installing"].includes(job.stage)
  );
}
export function safePercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}
