import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Cpu,
  Database,
  FileText,
  HardDrive,
  Layers3,
  LoaderCircle,
  MemoryStick,
  Monitor,
  Moon,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from "lucide-react";
import {
  coreReady,
  formatBytes,
  jobRunning,
  safePercent,
  type CoreAdapter,
  type Dependency,
  type EnvironmentReport,
  type GpuProbe,
  type HistoryEntry,
  type JobProgress,
  type Preferences,
} from "@nuvokit/core";

type Page = "environment" | "hardware" | "dependencies" | "settings";
const pages = [
  { id: "environment" as const, label: "Môi trường", icon: Monitor },
  { id: "hardware" as const, label: "Phần cứng", icon: Cpu },
  { id: "dependencies" as const, label: "Thành phần", icon: Box },
  { id: "settings" as const, label: "Cài đặt", icon: Settings2 },
];
const titles: Record<Page, [string, string]> = {
  environment: ["Môi trường & Phần cứng", "Mọi thứ bạn cần để bắt đầu."],
  hardware: [
    "Hiểu chiếc máy của bạn",
    "Phần cứng hiện có và những khả năng đã được kiểm tra.",
  ],
  dependencies: [
    "Thành phần môi trường",
    "Bổ sung công cụ khi bạn cần. Giữ không gian của bạn gọn nhẹ.",
  ],
  settings: [
    "Cài đặt không gian",
    "Một giao diện quen thuộc, theo cách của bạn.",
  ],
};
const stageLabels: Record<string, string> = {
  downloading: "Đang tải",
  verifying: "Đang kiểm tra",
  installing: "Đang cài",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  failed: "Thất bại",
};
const statusLabels: Record<string, string> = {
  ready: "Sẵn sàng",
  missing: "Chưa cài",
  error: "Cần kiểm tra",
  unknown: "Chưa xác định",
};

function Badge({ status, children }: { status: string; children: ReactNode }) {
  const Icon =
    status === "ready" || status === "completed" || status === "passed"
      ? CheckCircle2
      : status === "error" || status === "failed"
        ? CircleAlert
        : CircleHelp;
  return (
    <span className={`badge badge-${status}`}>
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
  );
}
function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="summary-card">
      <span className="summary-icon">{icon}</span>
      <div>
        <span className="eyebrow">{label}</span>
        <strong title={value}>{value}</strong>
        <span className="card-detail">{detail}</span>
      </div>
    </article>
  );
}
function ConfirmInstall({
  dependency,
  preview,
  close,
  confirm,
}: {
  dependency: Dependency | null;
  preview: boolean;
  close(): void;
  confirm(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (dependency) ref.current?.showModal();
    else ref.current?.close();
  }, [dependency]);
  return (
    <dialog
      ref={ref}
      className="install-dialog"
      onCancel={close}
      aria-labelledby="install-title"
    >
      {dependency && (
        <>
          <div className="dialog-heading">
            <span className="section-icon">
              <ArrowDownToLine size={23} />
            </span>
            <button
              className="icon-button"
              aria-label="Đóng chi tiết cài đặt"
              onClick={close}
            >
              <X size={20} />
            </button>
          </div>
          <h2 id="install-title">{dependency.name}</h2>
          <p className="muted">
            Gói được tải vào vùng dữ liệu riêng của NuvoKit. Không thay đổi PATH
            hoặc cài driver hệ thống.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Dung lượng</dt>
              <dd>{formatBytes(dependency.bytes)}</dd>
            </div>
            <div>
              <dt>Phiên bản</dt>
              <dd>{dependency.version}</dd>
            </div>
            <div>
              <dt>Giấy phép thành phần</dt>
              <dd>{dependency.license}</dd>
            </div>
            <div>
              <dt>Nguồn chính chủ</dt>
              <dd className="source-url">{dependency.source}</dd>
            </div>
            <div>
              <dt>Xác minh</dt>
              <dd>SHA-256 cố định · kiểm tra trước khi dùng</dd>
            </div>
          </dl>
          <div className="note">
            <CircleHelp size={18} />
            <span>
              Đây là dữ liệu ngôn ngữ. Cài gói này chưa cung cấp chức năng nhận
              dạng OCR.
            </span>
          </div>
          {preview && (
            <p className="preview-note">
              Bản xem trước dùng dữ liệu mẫu. Mở app Windows để cài thành phần
              thật.
            </p>
          )}
          <div className="dialog-actions">
            <button className="button secondary" onClick={close}>
              Để sau
            </button>
            <button
              className="button primary"
              disabled={preview}
              onClick={confirm}
            >
              <ArrowDownToLine size={17} />
              Cài đặt · {formatBytes(dependency.bytes)}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

export function App({ adapter }: { adapter: CoreAdapter }) {
  const [page, setPage] = useState<Page>("environment");
  const [report, setReport] = useState<EnvironmentReport | null>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState<Preferences>({
    theme: "light",
  });
  const [savingTheme, setSavingTheme] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [job, setJob] = useState<JobProgress | null>(null);
  const [selected, setSelected] = useState<Dependency | null>(null);
  const [probe, setProbe] = useState<GpuProbe | null>(null);
  const [probing, setProbing] = useState(false);
  const generation = useRef(0);
  const announcedReady = useRef(false);
  const ready = report ? coreReady(report) : false;
  const busy = jobRunning(job);

  const refresh = async () => {
    const current = ++generation.current;
    setScanning(true);
    setError("");
    try {
      const result = await adapter.scan();
      if (current === generation.current) setReport(result);
    } catch (reason) {
      if (current === generation.current) setError(String(reason));
    } finally {
      if (current === generation.current) setScanning(false);
    }
  };
  useEffect(() => {
    let mounted = true;
    void refresh();
    void adapter
      .getPreferences()
      .then((value) => {
        if (mounted) setPreferences(value);
      })
      .catch((reason) => {
        if (mounted) setError(String(reason));
      });
    void adapter
      .getHistory()
      .then((value) => {
        if (mounted) setHistory(value);
      })
      .catch(() => {});
    return () => {
      mounted = false;
      generation.current += 1;
    };
  }, [adapter]);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);
  useEffect(() => {
    if (!report || scanning || announcedReady.current) return;
    announcedReady.current = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        void adapter
          .uiReady()
          .then(async (verify) => {
            if (!verify) return;
            // Explicit --verify-core only: use normal adapters/IPC with a temporary host database.
            const original = await adapter.getPreferences();
            await adapter.setPreferences({ theme: "dark" });
            const themePersistence =
              (await adapter.getPreferences()).theme === "dark";
            await adapter.setPreferences(original);
            let channelEvents = 0;
            await adapter.install("ocr-vie-fast", (event) => {
              channelEvents++;
              setJob(event);
            });
            setReport(await adapter.scan());
            await adapter.finishVerification({
              phase: "baseline",
              gpuStatus: "not-run",
              channelEvents,
              themePersistence,
            });
            const graphics = await adapter.probeGpu();
            setProbe(graphics);
            await adapter.finishVerification({
              phase: "post-gpu",
              gpuStatus: graphics.status,
              channelEvents,
              themePersistence,
            });
          })
          .catch((reason) => setError(String(reason)));
      }),
    );
  }, [report, scanning, adapter]);
  const changeTheme = async (theme: Preferences["theme"]) => {
    if (savingTheme) return;
    const previous = preferences;
    setPreferences({ theme });
    setSavingTheme(true);
    try {
      await adapter.setPreferences({ theme });
    } catch (reason) {
      setPreferences(previous);
      setError(String(reason));
    } finally {
      setSavingTheme(false);
    }
  };
  const startInstall = async () => {
    if (!selected || busy || adapter.mode !== "desktop") return;
    const dependency = selected;
    setSelected(null);
    setError("");
    setJob({
      id: "starting",
      packageId: dependency.id,
      stage: "downloading",
      percent: 0,
      downloadedBytes: 0,
      totalBytes: dependency.bytes ?? 0,
      message: "Đang chuẩn bị…",
    });
    try {
      await adapter.install(dependency.id, setJob);
    } catch (reason) {
      if (!String(reason).includes("Đã hủy")) {
        setError(String(reason));
        setJob((previous) =>
          previous
            ? { ...previous, stage: "failed", message: String(reason) }
            : null,
        );
      }
    } finally {
      await refresh();
      try {
        setHistory(await adapter.getHistory());
      } catch {
        /* A completed installation is not reverted by history display failure. */
      }
    }
  };
  const testGpu = async () => {
    if (probing) return;
    setProbing(true);
    try {
      setProbe(await adapter.probeGpu());
    } finally {
      setProbing(false);
    }
  };

  const dependencyPanel = (
    <section className="panel">
      <div className="section-heading">
        <h2>
          <Layers3 size={21} />
          Thành phần môi trường
        </h2>
        <span className="muted small">
          {report?.dependencies.length ?? 0} thành phần
        </span>
      </div>
      <div
        className="dependency-table"
        role="table"
        aria-label="Trạng thái thành phần"
      >
        <div className="dependency-header" role="row">
          <span role="columnheader">Tên thành phần</span>
          <span role="columnheader">Trạng thái</span>
          <span role="columnheader">Hành động</span>
        </div>
        {report?.dependencies.map((dependency) => {
          const Icon =
            dependency.id === "webview2"
              ? Monitor
              : dependency.id === "sqlite"
                ? Database
                : FileText;
          return (
            <div className="dependency-row" role="row" key={dependency.id}>
              <div className="dependency-name" role="cell">
                <Icon size={24} />
                <div>
                  <strong>{dependency.name}</strong>
                  <span>{dependency.description}</span>
                  <small>
                    {dependency.version}{" "}
                    {dependency.bytes
                      ? `· ${formatBytes(dependency.bytes)}`
                      : ""}
                  </small>
                </div>
              </div>
              <div role="cell">
                <Badge status={dependency.status}>
                  {statusLabels[dependency.status]}
                </Badge>
              </div>
              <div role="cell">
                {dependency.installable ? (
                  <button
                    className="button secondary compact"
                    disabled={busy || scanning}
                    onClick={() => setSelected(dependency)}
                  >
                    <ArrowDownToLine size={16} />
                    {dependency.status === "ready"
                      ? "Xem chi tiết"
                      : dependency.status === "error"
                        ? "Cài lại"
                        : "Cài đặt"}
                  </button>
                ) : (
                  <span className="muted small">
                    {dependency.status === "ready"
                      ? "Đang hoạt động"
                      : "Kiểm tra bộ cài"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="panel-footnote">
        <ShieldCheck size={15} />
        Các thành phần tùy chọn không ảnh hưởng đến chức năng cơ bản.
      </div>
    </section>
  );

  const capabilityPanel = (
    <section className="panel capability-panel">
      <div className="section-heading">
        <h2>
          <Activity size={21} />
          Khả năng của máy
        </h2>
        <span className="subtle-label">KIỂM TRA THỰC TẾ</span>
      </div>
      <div className="capability-grid">
        <div className="capability-item">
          <span className="neutral-icon">
            <Cpu size={25} />
          </span>
          <div>
            <h3>CPU khả dụng</h3>
            <p>Chức năng cơ bản dùng CPU</p>
            <span className="muted small">
              {report?.cpu.logicalCores ?? "—"} luồng xử lý được nhận diện.
            </span>
          </div>
        </div>
        <div className="capability-item">
          <span className="neutral-icon">
            <Zap size={25} />
          </span>
          <div>
            <h3>Phép thử WebGPU</h3>
            <p>
              {probing
                ? "Đang chạy phép tính mẫu…"
                : probe
                  ? probe.status === "passed"
                    ? "Phép tính đã được xác minh"
                    : "Chưa xác nhận khả năng"
                  : "Chưa kiểm tra"}
            </p>
            <span className="muted small">
              {probe?.message ??
                "Kiểm tra riêng; không suy khả năng OCR/AI từ tên GPU."}
            </span>
            <button
              className="text-button"
              disabled={probing}
              onClick={() => void testGpu()}
            >
              {probing ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <ArrowRight size={15} />
              )}
              {probing ? "Đang kiểm tra" : "Chạy phép thử"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>NuvoKit</span>
          <span className="version-pill">CORE PREVIEW</span>
        </div>
        <div className="topbar-right">
          <span
            className={`connection-dot ${adapter.mode === "preview" ? "demo" : ""}`}
          />
          <span className="small muted">
            {adapter.mode === "preview"
              ? "Bản xem trước · dữ liệu mẫu"
              : "Không gian cục bộ"}
          </span>
          <button
            className="icon-button"
            aria-label={
              preferences.theme === "light"
                ? "Chuyển sang giao diện tối"
                : "Chuyển sang giao diện sáng"
            }
            disabled={savingTheme}
            onClick={() =>
              void changeTheme(preferences.theme === "light" ? "dark" : "light")
            }
          >
            {preferences.theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <p className="nav-caption">KHÔNG GIAN CÁ NHÂN</p>
        <nav aria-label="Điều hướng chính">
          {pages.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
              aria-current={page === id ? "page" : undefined}
              title={label}
            >
              <Icon size={21} />
              <span>{label}</span>
              {page === id && (
                <ChevronRight size={15} className="nav-chevron" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="local-icon">
              <ShieldCheck size={19} />
            </span>
            <div>
              <strong>Dữ liệu của bạn</strong>
              <span>Lưu trên thiết bị</span>
            </div>
          </div>
          <span className="sidebar-version">NuvoKit · Core v0.1.1</span>
        </div>
      </aside>
      <main id="main-content" className="main-content">
        <div className="breadcrumb">
          Không gian cá nhân
          <ChevronRight size={13} />
          <span>{pages.find((item) => item.id === page)?.label}</span>
        </div>
        <div className="page-heading">
          <div>
            <h1>{titles[page][0]}</h1>
            <p>{titles[page][1]}</p>
          </div>
          {page !== "settings" && (
            <button
              className="button primary"
              onClick={() => void refresh()}
              disabled={scanning}
            >
              <RefreshCw size={17} className={scanning ? "spin" : ""} />
              {scanning ? "Đang kiểm tra" : "Kiểm tra lại"}
            </button>
          )}
        </div>
        {adapter.mode === "preview" && (
          <div className="preview-banner">
            <Monitor size={16} />
            <span>
              Đang xem giao diện với dữ liệu minh họa. App Windows cung cấp kiểm
              tra và cài đặt thực tế.
            </span>
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <CircleAlert size={20} />
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label="Đóng thông báo lỗi"
              onClick={() => setError("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {scanning && !report && (
          <div className="loading-state" role="status">
            <LoaderCircle size={28} className="spin" />
            <h2>Đang chuẩn bị không gian…</h2>
            <p>Kiểm tra môi trường và phần cứng của bạn.</p>
          </div>
        )}
        {!scanning && !report && (
          <div className="loading-state">
            <CircleAlert size={30} />
            <h2>Chưa đọc được môi trường</h2>
            <button className="button secondary" onClick={() => void refresh()}>
              Thử lại
            </button>
          </div>
        )}
        {report && (
          <>
            {page === "environment" && (
              <>
                <section
                  className={`readiness ${ready ? "is-ready" : "needs-attention"}`}
                >
                  <span className="readiness-icon">
                    {ready ? <Check size={26} /> : <CircleAlert size={26} />}
                  </span>
                  <div>
                    <h2>
                      {ready
                        ? "Sẵn sàng cho những việc quan trọng"
                        : "Cần kiểm tra thêm trước khi bắt đầu"}
                    </h2>
                    <p>
                      {ready
                        ? "Các chức năng cơ bản đã sẵn sàng. Bổ sung công cụ khi bạn cần."
                        : "Kiểm tra hệ điều hành và các thành phần bắt buộc bên dưới."}
                    </p>
                  </div>
                  <span className="platform-tag">
                    <Monitor size={15} />
                    Windows · {report.os.arch}
                  </span>
                </section>
                <section
                  className="summary-grid"
                  aria-label="Tổng quan phần cứng"
                >
                  <SummaryCard
                    icon={<Monitor size={25} />}
                    label="Hệ điều hành"
                    value={report.os.name}
                    detail={report.os.version}
                  />
                  <SummaryCard
                    icon={<Cpu size={25} />}
                    label="Bộ xử lý"
                    value={report.cpu.name}
                    detail={`${report.cpu.logicalCores} luồng xử lý`}
                  />
                  <SummaryCard
                    icon={<MemoryStick size={25} />}
                    label="Bộ nhớ"
                    value={`${formatBytes(report.memory.totalBytes)} RAM`}
                    detail={`${formatBytes(report.memory.availableBytes)} khả dụng`}
                  />
                  <SummaryCard
                    icon={<Box size={25} />}
                    label="Đồ họa"
                    value={
                      report.gpus.find((gpu) => !gpu.software)?.name ??
                      "Chưa xác định"
                    }
                    detail="Khả năng tăng tốc kiểm tra riêng"
                  />
                </section>
                {dependencyPanel}
                {capabilityPanel}
              </>
            )}
            {page === "hardware" && (
              <>
                <div className="hardware-grid">
                  <section className="panel">
                    <div className="section-heading">
                      <h2>
                        <Cpu size={21} />
                        Bộ xử lý & bộ nhớ
                      </h2>
                    </div>
                    <dl className="detail-list">
                      <div>
                        <dt>CPU</dt>
                        <dd>{report.cpu.name}</dd>
                      </div>
                      <div>
                        <dt>Luồng xử lý</dt>
                        <dd>{report.cpu.logicalCores}</dd>
                      </div>
                      <div>
                        <dt>RAM tổng</dt>
                        <dd>{formatBytes(report.memory.totalBytes)}</dd>
                      </div>
                      <div>
                        <dt>RAM khả dụng</dt>
                        <dd>{formatBytes(report.memory.availableBytes)}</dd>
                      </div>
                      <div>
                        <dt>Đĩa trống tại vùng app</dt>
                        <dd>{formatBytes(report.disk.availableBytes)}</dd>
                      </div>
                    </dl>
                  </section>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>
                        <Monitor size={21} />
                        Thiết bị đồ họa
                      </h2>
                      <span className="muted small">
                        {report.gpus.length} thiết bị
                      </span>
                    </div>
                    {report.gpus.map((gpu) => (
                      <article key={gpu.name} className="gpu-device">
                        <strong>{gpu.name}</strong>
                        <p className="muted small">
                          Bộ nhớ riêng: {formatBytes(gpu.dedicatedBytes)}
                        </p>
                        <Badge status="unknown">
                          {gpu.software
                            ? "Adapter phần mềm"
                            : "Đã nhận diện · chưa xác nhận tác vụ"}
                        </Badge>
                      </article>
                    ))}
                    {report.gpuError && (
                      <p className="muted">{report.gpuError}</p>
                    )}
                    {!report.gpus.length && !report.gpuError && (
                      <p className="muted">
                        Không có thông tin GPU được trả về.
                      </p>
                    )}
                  </section>
                </div>
                {capabilityPanel}
              </>
            )}
            {page === "dependencies" && (
              <>
                {dependencyPanel}
                <section className="panel">
                  <div className="section-heading">
                    <h2>
                      <Activity size={21} />
                      Lịch sử cài đặt
                    </h2>
                  </div>
                  {history.length ? (
                    <ul className="history-list">
                      {history.map((entry) => (
                        <li key={entry.id}>
                          <span>
                            {entry.kind === "ocr-vie-fast"
                              ? "Dữ liệu OCR tiếng Việt"
                              : entry.kind}
                          </span>
                          <Badge status={entry.status}>
                            {stageLabels[entry.status] ?? entry.status}
                          </Badge>
                          <time>
                            {new Date(entry.createdAt).toLocaleString("vi-VN")}
                          </time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-state">
                      <ArrowDownToLine size={24} />
                      <p>Chưa có tác vụ cài đặt.</p>
                      <span>Các thành phần bạn cài sẽ xuất hiện tại đây.</span>
                    </div>
                  )}
                </section>
              </>
            )}
            {page === "settings" && (
              <>
                <section className="panel">
                  <div className="section-heading">
                    <h2>
                      <Sun size={21} />
                      Diện mạo
                    </h2>
                    <span className="muted small">Tự lưu trên thiết bị</span>
                  </div>
                  <p className="muted">
                    Chọn giao diện phù hợp với không gian làm việc của bạn.
                  </p>
                  <div className="theme-options">
                    {(["light", "dark"] as const).map((theme) => (
                      <button
                        key={theme}
                        className={`theme-option ${preferences.theme === theme ? "selected" : ""}`}
                        onClick={() => void changeTheme(theme)}
                        disabled={savingTheme}
                        aria-pressed={preferences.theme === theme}
                      >
                        <span className={`theme-preview ${theme}`}>
                          <i />
                          <b />
                          <b />
                          <b />
                        </span>
                        <span>
                          {theme === "light" ? (
                            <Sun size={17} />
                          ) : (
                            <Moon size={17} />
                          )}
                          {theme === "light" ? "Sáng" : "Tối"}
                          {preferences.theme === theme && (
                            <CheckCircle2 size={17} />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <h2>
                      <HardDrive size={21} />
                      Về bản lõi này
                    </h2>
                  </div>
                  <p className="muted">
                    NuvoKit Core v0.1.1 · bản preview cho Windows 11
                    x64.
                  </p>
                  <div className="note">
                    <ShieldCheck size={18} />
                    <span>
                      Cài đặt và lịch sử được lưu cục bộ. Bản này chưa có đồng
                      bộ cloud, engine OCR hoặc kho mini-app.
                    </span>
                  </div>
                </section>
              </>
            )}
            <footer className="content-footer">
              <span>
                <span className="connection-dot" />
                {adapter.mode === "preview"
                  ? "Dữ liệu minh họa"
                  : `Kiểm tra lúc ${new Date(report.scannedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`}
              </span>
              <span>
                {adapter.mode === "desktop"
                  ? `${report.scanMs} ms · Chỉ lưu cài đặt và lịch sử`
                  : "Thiết kế có thể tương tác · Core preview"}
              </span>
            </footer>
          </>
        )}
      </main>
      {job && (
        <aside
          className={`job-toast ${job.stage === "failed" ? "job-error" : ""}`}
          aria-label="Tiến trình cài đặt"
        >
          <div className="job-heading">
            <span className="section-icon">
              {busy ? (
                <LoaderCircle size={19} className="spin" />
              ) : job.stage === "completed" ? (
                <CheckCircle2 size={19} />
              ) : (
                <CircleAlert size={19} />
              )}
            </span>
            <div>
              <strong>Dữ liệu OCR tiếng Việt</strong>
              <span>{stageLabels[job.stage]}</span>
            </div>
            {busy ? (
              <button
                className="text-button"
                onClick={() =>
                  void adapter
                    .cancelInstall()
                    .catch((reason) => setError(String(reason)))
                }
              >
                Hủy
              </button>
            ) : (
              <button
                className="icon-button"
                aria-label="Đóng tiến trình"
                onClick={() => setJob(null)}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <progress
            aria-label="Tiến trình cài gói"
            value={safePercent(job.percent)}
            max={100}
          />
          <div className="job-detail" role="status">
            <span>{job.message}</span>
            <strong>{Math.round(safePercent(job.percent))}%</strong>
          </div>
        </aside>
      )}
      <ConfirmInstall
        dependency={selected}
        preview={adapter.mode === "preview"}
        close={() => setSelected(null)}
        confirm={() => void startInstall()}
      />
    </div>
  );
}
