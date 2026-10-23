import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, CheckCircle2, CircleAlert, Download, LoaderCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { formatBytes, safePercent, type UpdateAdapter, type UpdateChannel, type UpdateProgress, type UpdateStatus } from "@nuvokit/core";

export function useUpdates(adapter: UpdateAdapter) {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [phase, setPhase] = useState<"" | "checking" | "downloading" | "installing">("");
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState("");
  const alive = useRef(false), working = useRef(false);
  const perform = useCallback(async (phase: "checking" | "downloading" | "installing", action: () => Promise<UpdateStatus | void>) => {
    if (working.current) return;
    working.current = true; setPhase(phase); setError("");
    if (phase === "downloading") setProgress(null);
    try { const value = await action(); if (alive.current && value) setStatus(value); }
    catch (reason) { if (alive.current) setError(String(reason instanceof Error ? reason.message : reason)); }
    finally { working.current = false; if (alive.current) setPhase(""); }
  }, []);
  useEffect(() => {
    alive.current = true;
    let closed = false;
    let timer: number | undefined;
    void adapter.status().then(value => {
      if (!alive.current || closed) return;
      setStatus(value);
      if (value.supported) {
        void perform("checking", () => adapter.check(false));
        timer = window.setInterval(() => void perform("checking", () => adapter.check(false)), 24 * 60 * 60 * 1000);
      }
    }).catch(reason => { if (alive.current) setError(String(reason)); });
    return () => { closed = true; alive.current = false; if (timer !== undefined) clearInterval(timer); };
  }, [adapter, perform]);
  return { status, phase, progress, error,
    check: () => perform("checking", () => adapter.check(true)),
    channel: (channel: UpdateChannel) => perform("checking", async () => {
      const next = await adapter.channel(channel); if (alive.current) setStatus(next);
      return next.supported ? adapter.check(true) : next;
    }),
    download: () => status?.available && perform("downloading", () => adapter.download(status.available!.token, event => { if (alive.current) setProgress(event); })),
    cancel: () => void adapter.cancel().catch(reason => { if (alive.current) setError(String(reason)); }),
    install: () => status?.available && perform("installing", () => adapter.install(status.available!.token)),
  };
}
export type UpdatesController = ReturnType<typeof useUpdates>;
export function UpdateSettings({ updates, blocked, clockActive }: { updates: UpdatesController; blocked: boolean; clockActive: boolean }) {
  const { status, phase, progress, error } = updates;
  const [confirm, setConfirm] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirm) { dialog.current?.showModal(); cancel.current?.focus(); } else dialog.current?.close(); }, [confirm]);
  const unavailable = !status?.supported;
  const offer = status?.available;
  const downloading = phase === "downloading", installing = phase === "installing";
  return <section className="panel update-panel" aria-labelledby="update-title">
    <div className="section-heading"><h2 id="update-title"><Download size={21}/>Cập nhật ứng dụng</h2><span className="version-pill">v{status?.currentVersion ?? "…"}</span></div>
    <p className="muted">Nhận bản mới từ GitHub Releases. Đồng hồ tích hợp được cập nhật cùng ứng dụng.</p>
    <div className="update-controls"><label>Kênh cập nhật<select value={status?.channel ?? "preview"} disabled={!status || !!phase || blocked} onChange={event => void updates.channel(event.target.value as UpdateChannel)}><option value="stable">Ổn định</option><option value="preview">Thử nghiệm</option></select></label>
      <button className="button secondary" disabled={unavailable || !!phase || blocked} onClick={() => void updates.check()}><RefreshCw size={17} className={phase === "checking" ? "spin" : ""}/>{phase === "checking" ? "Đang kiểm tra…" : "Kiểm tra cập nhật"}</button></div>
    {error && <div className="error-banner" role="alert"><CircleAlert size={18}/><span>{error}</span></div>}
    {status?.message && <p className="note" role="status"><ShieldCheck size={18}/>{status.message}</p>}
    {offer ? <div className="update-offer"><div className="section-heading"><h3>NuvoKit {offer.version}</h3><span className="badge badge-ready"><CheckCircle2 size={14}/>{offer.downloaded ? "Đã xác minh chữ ký" : "Có bản cập nhật"}</span></div>
      {offer.notes && <p className="update-notes">{offer.notes}</p>}
      {downloading && <div className="update-progress" role="status"><span>{progress?.stage === "verifying" ? "Đang xác minh chữ ký…" : "Đang tải cập nhật…"} {formatBytes(progress?.downloadedBytes ?? 0)}{progress?.totalBytes ? ` / ${formatBytes(progress.totalBytes)}` : ""}</span><progress aria-label="Tiến trình cập nhật" max={100} value={progress?.totalBytes ? safePercent(progress.downloadedBytes / progress.totalBytes * 100) : undefined}/></div>}
      <div className="update-actions">{downloading ? <button className="button secondary" onClick={updates.cancel}><X size={17}/>Hủy tải</button> : offer.downloaded ? <button className="button primary" disabled={!!phase || blocked || clockActive || !status.canInstall} onClick={() => setConfirm(true)}>{installing ? <LoaderCircle size={17} className="spin"/> : <CheckCircle2 size={17}/>}Cài đặt và mở lại</button> : <button className="button primary" disabled={!!phase || blocked} onClick={() => void updates.download()}><ArrowDownToLine size={17}/>Tải cập nhật</button>}</div>
      {offer.downloaded && !status.canInstall && <p className="muted small">Phiên kiểm thử hoặc bản chạy rời chỉ xác minh gói. Cài bằng bộ cài Windows để bật cài cập nhật.</p>}
    </div> : status?.supported && !phase && !error && !status.message && <p className="data-success update-current" role="status"><CheckCircle2 size={18}/>Bạn đang dùng phiên bản mới nhất của kênh này.</p>}
    {clockActive && <p className="note"><CircleAlert size={18}/>Kết thúc phiên Đồng hồ trước khi cài cập nhật. Bạn vẫn có thể kiểm tra và tải gói.</p>}
    {blocked && <p className="muted small">Chờ tác vụ hoặc dữ liệu hiện tại được lưu xong trước khi cập nhật.</p>}
    <p className="muted small">{status?.lastCheckedAt ? `Kiểm tra gần nhất: ${new Date(status.lastCheckedAt * 1000).toLocaleString("vi-VN")}. ` : ""}Tự kiểm tra khi mở app, tối đa mỗi 24 giờ. Bạn chọn thời điểm cài.</p>
    <dialog ref={dialog} className="install-dialog" aria-labelledby="update-confirm-title" onCancel={event => { if (installing) event.preventDefault(); else setConfirm(false); }}>
      <div className="dialog-heading"><span className="section-icon"><ShieldCheck size={24}/></span></div><h2 id="update-confirm-title">Cài NuvoKit {offer?.version}?</h2><p className="muted">NuvoKit sẽ lưu bản phục hồi dữ liệu, đóng ứng dụng và mở trình cài cập nhật. Cài đặt, lịch sử và dữ liệu Đồng hồ được giữ lại.</p>
      {error && <p role="alert" className="error-banner">{error}</p>}
      <div className="dialog-actions"><button ref={cancel} className="button secondary" disabled={installing} onClick={() => setConfirm(false)}>Để sau</button><button className="button primary" disabled={!!phase || blocked || clockActive || !status?.canInstall} onClick={() => void updates.install()}>{installing ? "Đang mở trình cài…" : "Cài đặt và mở lại"}</button></div>
    </dialog>
  </section>;
}
