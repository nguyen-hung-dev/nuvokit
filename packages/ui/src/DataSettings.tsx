import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, ArrowDownToLine, CheckCircle2, CircleAlert, Database, FolderOpen, HardDrive, LoaderCircle, RefreshCw, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { formatBytes, type CoreAdapter, type Preferences, type RestorePreview, type StorageInfo } from "@nuvokit/core";

export function DataSettings({ adapter, installing, restoreBlocked = false, onRestored, onBusy }: {
  adapter: CoreAdapter;
  installing: boolean;
  restoreBlocked?: boolean;
  onRestored(preferences: Preferences): Promise<void>;
  onBusy(busy: boolean): void;
}) {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [restore, setRestore] = useState<RestorePreview | null>(null);
  const [confirmCache, setConfirmCache] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const blocked = installing || working !== "" || adapter.mode === "preview";
  const refreshing = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++refreshing.current;
    setLoading(true);
    try {
      const value = await adapter.getStorageInfo();
      if (mounted.current && id === refreshing.current) { setInfo(value); setError(""); }
    } catch (reason) {
      if (mounted.current && id === refreshing.current) setError(String(reason));
    } finally {
      if (mounted.current && id === refreshing.current) setLoading(false);
    }
  }, [adapter]);
  useEffect(() => { mounted.current = true; void refresh(); return () => { mounted.current = false; refreshing.current++; }; }, [refresh]);
  useEffect(() => {
    if (restore || confirmCache) { dialog.current?.showModal(); cancelButton.current?.focus(); }
    else dialog.current?.close();
  }, [restore, confirmCache]);
  useEffect(() => () => { if (restore) void adapter.discardRestore(restore.token).catch(() => {}); }, [adapter, restore]);

  const run = async (name: string, work: () => Promise<void>) => {
    if (blocked) return;
    setWorking(name); onBusy(true); setError(""); setNotice("");
    try { await work(); }
    catch (reason) { if (mounted.current) { setError(String(reason)); if (name === "restore") setRestore(null); } }
    finally {
      if (mounted.current) setWorking("");
      onBusy(false);
    }
  };
  const close = () => {
    if (working) return;
    if (restore) void adapter.discardRestore(restore.token).catch(() => {});
    setRestore(null); setConfirmCache(false);
  };
  const exportBackup = () => run("backup", async () => {
    if (await adapter.exportBackup()) {
      await refresh();
      if (mounted.current) setNotice("Đã lưu bản sao dữ liệu. Hãy giữ file ở nơi riêng để có thể khôi phục khi cần.");
    }
  });
  const prepare = () => run("prepare", async () => {
    if (restoreBlocked) return;
    const value = await adapter.prepareRestore();
    if (mounted.current) setRestore(value);
    else if (value) await adapter.discardRestore(value.token);
  });
  const confirm = () => run(restore ? "restore" : "cache", async () => {
    if (restore) {
      if (restoreBlocked) return;
      const result = await adapter.restoreBackup(restore.token);
      if (mounted.current) {
        setRestore(null);
        setNotice(`Đã khôi phục. Dữ liệu trước đó được giữ trong backups/${result.recoveryFile}.`);
      }
      await onRestored(result.preferences);
    } else if (confirmCache) {
      const bytes = await adapter.clearTemporaryData();
      if (mounted.current) { setConfirmCache(false); setNotice(`Đã dọn ${formatBytes(bytes)} file tạm. Dữ liệu và gói đã cài được giữ nguyên.`); }
    }
    await refresh();
  });

  return <section className="panel data-panel" aria-labelledby="data-title">
    <div className="section-heading">
      <h2 id="data-title"><Database size={21} />Dữ liệu & sao lưu</h2>
      <button className="icon-button" aria-label="Cập nhật dung lượng dữ liệu" disabled={loading || !!working} onClick={() => void refresh()}>
        <RefreshCw size={17} className={loading ? "spin" : ""} />
      </button>
    </div>
    <p className="muted">Giữ một bản sao riêng, khôi phục khi cần. Dữ liệu luôn nằm trên thiết bị của bạn.</p>
    {adapter.mode === "preview" && <p className="preview-note">Dung lượng minh họa. Mở app Windows để sao lưu, khôi phục và quản lý dữ liệu thật.</p>}
    {info?.temporarySession && <p className="preview-note">Phiên kiểm thử riêng: dữ liệu tạm, không dùng dữ liệu NuvoKit đã cài và sẽ được dọn khi thoát.</p>}
    {error && <div className="data-message error-banner" role="alert"><CircleAlert size={18}/><span>{error}</span></div>}
    {notice && <div className="data-message data-success" role="status"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    {installing && <p className="note"><LoaderCircle size={17} className="spin"/>Chờ tác vụ hiện tại hoàn tất để quản lý dữ liệu.</p>}
    {restoreBlocked && <p className="note"><CircleAlert size={17}/>Kết thúc phiên Đồng hồ trước khi khôi phục dữ liệu. Bạn vẫn có thể sao lưu phiên đang chạy.</p>}
    <div className="storage-grid" aria-busy={loading}>
      {[
        { label: "Cài đặt & lịch sử", value: info?.databaseBytes, icon: Database },
        { label: "Gói đã tải", value: info?.packageBytes, icon: HardDrive },
        { label: "File tạm", value: info?.temporaryBytes, icon: Trash2 },
        { label: "Bản phục hồi", value: info?.recoveryBytes, icon: Archive },
      ].map(({ label, value, icon: Icon }) => <div className="storage-stat" key={label}>
        <Icon size={18}/><span>{label}</span><strong>{loading ? "Đang đọc…" : formatBytes(value ?? null)}</strong>
      </div>)}
    </div>
    <div className="data-actions">
      <div className="data-action-copy"><strong>Sao lưu & khôi phục</strong>
        <p>Gồm giao diện sáng/tối, lịch sử tác vụ, cài đặt và các phiên Đồng hồ. Gói tải thêm và cache không nằm trong bản sao; có thể tải lại gói trong Thành phần.</p>
        <span className="muted small">{info?.lastBackupAt ? `Lần sao lưu gần nhất: ${new Date(info.lastBackupAt).toLocaleString("vi-VN")}` : "Chưa ghi nhận bản sao lưu thủ công."} File .nuvobak không mã hóa.</span>
      </div>
      <div className="data-action-buttons">
        <button className="button primary" disabled={blocked} onClick={() => void exportBackup()}>
          {working === "backup" ? <LoaderCircle size={17} className="spin"/> : <ArrowDownToLine size={17}/>}Sao lưu dữ liệu
        </button>
        <button className="button secondary" disabled={blocked || restoreBlocked} onClick={() => void prepare()}>
          {working === "prepare" ? <LoaderCircle size={17} className="spin"/> : <Upload size={17}/>}Khôi phục từ file
        </button>
      </div>
    </div>
    <div className="data-actions">
      <div className="data-action-copy"><strong>Giữ không gian gọn nhẹ</strong>
        <p>Chỉ dọn file tạm và lượt tải dở do NuvoKit quản lý. Giữ cài đặt, lịch sử, gói hoàn chỉnh và các bản phục hồi.</p>
        <span className="muted small">{info ? `${info.recoveryCount} bản phục hồi tự động · Dữ liệu phiên bản ${info.schemaVersion}` : "Không đọc được thông tin dữ liệu."}</span>
      </div>
      <button className="button secondary" disabled={blocked || loading || !info?.temporaryBytes} onClick={() => setConfirmCache(true)}><Trash2 size={17}/>Dọn file tạm</button>
    </div>
    <div className="data-location">
      <span className="muted small">{info?.dataDirectory ?? "Chưa đọc được thư mục dữ liệu"}</span>
      <button className="text-button" disabled={blocked} onClick={() => void run("folder", async () => { await adapter.openDataFolder(); })}><FolderOpen size={16}/>Mở thư mục dữ liệu</button>
    </div>
    <dialog ref={dialog} className="install-dialog" onCancel={(event) => { if (working) event.preventDefault(); else close(); }} aria-labelledby="data-dialog-title">
      <div className="dialog-heading"><span className="section-icon"><ShieldCheck size={23}/></span><button className="icon-button" aria-label="Đóng xác nhận dữ liệu" disabled={!!working} onClick={close}><X size={20}/></button></div>
      <h2 id="data-dialog-title">{restore ? "Khôi phục dữ liệu?" : "Dọn file tạm?"}</h2>
      {restore ? <>
        <p className="muted">Thay cài đặt và lịch sử hiện tại bằng bản đã kiểm tra. NuvoKit tự lưu một bản phục hồi trước khi thay đổi; các gói đã cài vẫn được giữ.</p>
        <dl className="detail-list">
          <div><dt>File</dt><dd className="source-url">{restore.fileName}</dd></div>
          <div><dt>Ngày sao lưu</dt><dd>{new Date(restore.createdAt).toLocaleString("vi-VN")}</dd></div>
          <div><dt>Phiên bản ứng dụng</dt><dd>{restore.appVersion}</dd></div>
          <div><dt>Lịch sử tác vụ</dt><dd>{restore.historyEntries.toLocaleString("vi-VN")} mục</dd></div>
          <div><dt>Phiên Đồng hồ</dt><dd>{restore.clockSessions == null ? "Bản cũ: giữ Đồng hồ hiện tại" : `${restore.clockSessions.toLocaleString("vi-VN")} phiên`}</dd></div>
          <div><dt>Giao diện</dt><dd>{restore.theme === "dark" ? "Tối" : "Sáng"}</dd></div>
        </dl>
      </> : <p className="muted">Dọn khoảng {formatBytes(info?.temporaryBytes ?? null)} file tạm. Không xóa dữ liệu, gói đã cài, cache WebView đang dùng hoặc bản phục hồi.</p>}
      {error && <p className="preview-note" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button ref={cancelButton} className="button secondary" disabled={!!working} onClick={close}>Hủy</button>
        <button className="button primary" disabled={!!working || installing || (!!restore && restoreBlocked)} onClick={() => void confirm()}>{working ? <LoaderCircle size={17} className="spin"/> : restore ? <Upload size={17}/> : <Trash2 size={17}/>} {working ? "Đang xử lý…" : restore ? "Khôi phục dữ liệu" : "Dọn file tạm"}</button>
      </div>
    </dialog>
  </section>;
}
