import type {
  CoreAdapter,
  EnvironmentReport,
  JobProgress,
  Preferences,
} from "@nuvokit/core";
import { isTauri, invoke, Channel } from "@tauri-apps/api/core";
import { probeWebGpu } from "./gpu";

const desktop: CoreAdapter = {
  mode: "desktop",
  scan: () => invoke("scan_environment"),
  install: async (packageId, progress) => {
    const channel = new Channel<JobProgress>();
    channel.onmessage = progress;
    await invoke("install_dependency", { packageId, onEvent: channel });
  },
  cancelInstall: () => invoke("cancel_install"),
  getPreferences: () => invoke("get_preferences"),
  setPreferences: (preferences) => invoke("set_preferences", { preferences }),
  getHistory: () => invoke("get_history"),
  getStorageInfo: () => invoke("get_storage_info"),
  exportBackup: () => invoke("export_backup"),
  prepareRestore: () => invoke("prepare_restore"),
  discardRestore: (token) => invoke("discard_restore", { token }),
  restoreBackup: (token) => invoke("restore_backup", { token }),
  clearTemporaryData: () => invoke("clear_temporary_data"),
  openDataFolder: () => invoke("open_data_folder"),
  probeGpu: probeWebGpu,
  uiReady: () => invoke("ui_ready"),
  finishVerification: (result) => invoke("finish_verification", { result }),
};

function sampleReport(): EnvironmentReport {
  return {
    schemaVersion: 1,
    source: "preview",
    scannedAt: new Date().toISOString(),
    scanMs: 0,
    os: {
      name: "Windows 11",
      version: "Dữ liệu mẫu",
      arch: "x86_64",
      supported: true,
    },
    cpu: { name: "CPU mẫu · 8 luồng", logicalCores: 8 },
    memory: { totalBytes: 16 * 1024 ** 3, availableBytes: 10 * 1024 ** 3 },
    disk: { availableBytes: 128 * 1024 ** 3 },
    gpus: [
      {
        name: "GPU tích hợp · dữ liệu mẫu",
        dedicatedBytes: null,
        software: false,
      },
    ],
    gpuError: null,
    dependencies: [
      {
        id: "webview2",
        name: "WebView2",
        description: "Thành phần hiển thị giao diện ứng dụng.",
        version: "Minh họa",
        status: "ready",
        required: true,
        installable: false,
        bytes: null,
        source: "Microsoft",
        license: null,
      },
      {
        id: "sqlite",
        name: "Lưu trữ cục bộ",
        description: "SQLite tích hợp · lưu cài đặt và lịch sử tác vụ.",
        version: "Minh họa",
        status: "ready",
        required: true,
        installable: false,
        bytes: null,
        source: null,
        license: null,
      },
      {
        id: "ocr-vie-fast",
        name: "Dữ liệu OCR tiếng Việt",
        description: "Tùy chọn · chỉ là dữ liệu ngôn ngữ, chưa có engine OCR.",
        version: "tessdata_fast · 8741641",
        status: "missing",
        required: false,
        installable: true,
        bytes: 531275,
        source: "https://github.com/tesseract-ocr/tessdata_fast",
        license: "Apache-2.0",
      },
    ],
  };
}
const preview: CoreAdapter = {
  mode: "preview",
  scan: async () => sampleReport(),
  install: async () => {
    throw new Error(
      "Mở app Windows để cài thành phần. Bản web này chỉ xem trước thiết kế.",
    );
  },
  cancelInstall: async () => {},
  getPreferences: async () => {
    try {
      return {
        theme:
          localStorage.getItem("nuvokit-theme") === "dark" ? "dark" : "light",
      };
    } catch {
      return { theme: "light" };
    }
  },
  setPreferences: async (preferences: Preferences) => {
    try {
      localStorage.setItem("nuvokit-theme", preferences.theme);
    } catch {
      throw new Error("Trình duyệt không cho lưu theme.");
    }
  },
  getHistory: async () => [],
  getStorageInfo: async () => ({
    schemaVersion: 2, databaseBytes: 65536, packageBytes: 531275,
    temporaryBytes: 32768, recoveryBytes: 4096, recoveryCount: 1,
    lastBackupAt: null, dataDirectory: "Dữ liệu minh họa · chỉ có trên app Windows", temporarySession: false,
  }),
  exportBackup: async () => { throw new Error("Mở app Windows để sao lưu dữ liệu thật."); },
  prepareRestore: async () => { throw new Error("Mở app Windows để khôi phục dữ liệu thật."); },
  discardRestore: async () => {},
  restoreBackup: async () => { throw new Error("Mở app Windows để khôi phục dữ liệu thật."); },
  clearTemporaryData: async () => { throw new Error("Mở app Windows để dọn file tạm."); },
  openDataFolder: async () => { throw new Error("Mở app Windows để xem thư mục dữ liệu."); },
  probeGpu: probeWebGpu,
  uiReady: async () => false,
  finishVerification: async () => {},
};
export function createAdapter(): CoreAdapter {
  return isTauri() ? desktop : preview;
}
