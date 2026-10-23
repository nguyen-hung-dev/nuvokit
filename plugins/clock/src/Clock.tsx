import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, CheckCircle2, ChevronRight, Circle, CircleAlert, Clock3, FileText, LoaderCircle, Pause, Play, Settings2, Square, Timer, X } from "lucide-react";
import { elapsedClock, formatClock, type ClockLayout, type ClockMode, type ClockSession, type ClockTheme } from "@nuvokit/core";
import { type ClockController } from "./useClock";
import "./clock.css";
export { useClock } from "./useClock";

const modes: { id: ClockMode; label: string; icon: typeof Timer }[] = [
  { id: "focus", label: "Tập trung", icon: Timer },
  { id: "countdown", label: "Đếm ngược", icon: Timer },
  { id: "stopwatch", label: "Bấm giờ", icon: Clock3 },
];
const layouts: { id: ClockLayout; label: string; detail: string }[] = [
  { id: "minimal", label: "Tối giản", detail: "Đồng hồ ở giữa, lịch sử bên dưới" },
  { id: "session", label: "Phiên làm việc", detail: "Đồng hồ cùng tên phiên, ghi chú và lịch sử" },
  { id: "digital", label: "Kỹ thuật số", detail: "Chữ số lớn, tùy chỉnh thời lượng bên cạnh" },
];
const themes: { id: ClockTheme; label: string }[] = [{ id: "app", label: "Theo ứng dụng" }, { id: "light", label: "Sáng" }, { id: "dark", label: "Tối" }];
const sessionName = (item: { title: string; mode: ClockMode }) => item.title.trim() || modes.find(mode => mode.id === item.mode)!.label;
const durationLabel = (ms: number) => ms >= 60_000 ? `${Math.floor(ms / 60_000)} phút${Math.floor(ms / 1000) % 60 ? ` ${Math.floor(ms / 1000) % 60} giây` : ""}` : `${Math.floor(ms / 1000)} giây`;

export function Clock({ clock, disabled = false, openSettings = false, onSettingsOpened }: { clock: ClockController; disabled?: boolean; openSettings?: boolean; onSettingsOpened?(): void }) {
  const { state, history, active } = clock;
  const [settings, setSettings] = useState(false);
  const [finish, setFinish] = useState(false);
  const [selected, setSelected] = useState<ClockSession | null>(null);
  const [reload, setReload] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const locked = disabled || !clock.loaded || !!clock.error;
  useEffect(() => { if (openSettings) { setSettings(true); onSettingsOpened?.(); } }, [openSettings, onSettingsOpened]);
  useEffect(() => {
    if (settings || finish || selected || reload) { dialog.current?.showModal(); closeButton.current?.focus(); }
    else dialog.current?.close();
  }, [settings, finish, selected, reload]);
  useEffect(() => { if (!active) setFinish(false); }, [active]);
  const close = () => { setSettings(false); setFinish(false); setSelected(null); setReload(false); };

  function details() {
    return <div className="clock-fields"><label>{state.status === "finished" ? "Tên phiên tiếp theo" : "Tên phiên"}<input value={state.title} maxLength={120} disabled={locked} onChange={event => clock.edit({ title: event.target.value })} placeholder="Bạn muốn dành thời gian cho điều gì?"/></label>
      <label>{state.status === "finished" ? "Ghi chú phiên tiếp theo" : "Ghi chú"}<textarea rows={3} value={state.note} maxLength={500} disabled={locked} onChange={event => clock.edit({ note: event.target.value })} placeholder="Một điều bạn muốn ghi nhớ…"/></label>
    </div>;
  }
  function presets() {
    if (state.mode === "stopwatch") return <p className="clock-help">Bắt đầu từ 00:00. Tạm dừng và tiếp tục khi bạn cần.</p>;
    return <div className="clock-presets" role="group" aria-label="Thời lượng gợi ý">{(state.mode === "focus" ? [25, 45, 60] : [5, 10, 15]).map(value => <button key={value} disabled={locked || active} aria-pressed={(state.mode === "focus" ? state.focusMinutes : state.countdownSeconds / 60) === value} onClick={() => clock.duration(state.mode === "focus" ? value : value * 60)}>{value} phút</button>)}</div>;
  }
  function countdownFields() {
    const total = state.countdownSeconds;
    const values = [Math.floor(total / 3600), Math.floor(total % 3600 / 60), total % 60];
    return <div className="clock-time-fields">{["Giờ", "Phút", "Giây"].map((label, index) => <label key={label}>{label}<input type="number" inputMode="numeric" min={0} max={index === 0 ? 23 : 59} value={String(values[index]).padStart(2, "0")} disabled={locked || active} onChange={event => {
      const number = Number(event.target.value);
      if (!Number.isInteger(number) || number < 0 || number > (index === 0 ? 23 : 59)) return;
      const next = [...values]; next[index] = number;
      const seconds = next[0] * 3600 + next[1] * 60 + next[2];
      // Keep a valid non-zero duration; zero is represented by a one-second timer.
      clock.duration(Math.max(1, seconds));
    }}/></label>)}</div>;
  }
  function controls() {
    return <div className="clock-actions"><button className="button primary" disabled={locked} onClick={state.status === "running" ? clock.pause : clock.start}>{state.status === "running" ? <Pause size={22}/> : <Play size={22}/>} {state.status === "running" ? "Tạm dừng" : state.status === "paused" ? "Tiếp tục" : state.status === "finished" ? "Bắt đầu phiên mới" : "Bắt đầu"}</button>
      {active && <button className="button secondary" disabled={locked} onClick={() => setFinish(true)}><Square size={20}/>Kết thúc phiên</button>}</div>;
  }
  function sessions() {
    return <section className="clock-history" aria-labelledby="clock-history-title"><h2 id="clock-history-title">{state.layout === "session" ? "Phiên đã lưu" : "Phiên gần đây"}</h2>
      {history.length ? <div className="clock-history-list">{history.map(item => <button key={item.id} onClick={() => setSelected(item)}><span className="clock-history-icon"><FileText size={23}/></span><span><strong>{sessionName(item)}</strong><small>{durationLabel(item.elapsedMs)} · {item.outcome === "completed" ? "Hoàn thành" : "Đã kết thúc"}</small></span><ChevronRight size={21}/></button>)}</div> : <p className="clock-history-empty">Phiên đã hoàn thành sẽ được lưu tại đây.</p>}
    </section>;
  }
  const remainingFraction = state.mode === "stopwatch" ? 1 : Math.max(0, Math.min(1, clock.remaining / state.durationMs));
  const status = state.status === "running" ? state.mode === "focus" ? "Đang tập trung" : "Đang chạy" : state.status === "paused" ? "Đã tạm dừng" : state.status === "finished" ? "Phiên đã lưu" : "Sẵn sàng khi bạn muốn";
  const timeLabel = formatClock(clock.remaining, state.layout === "digital" || (state.mode === "countdown" && state.countdownSeconds >= 3600), state.mode !== "stopwatch");

  return <div className={`clock-plugin clock-layout-${state.layout} clock-is-${state.status}`}>
    <div className="breadcrumb">Ứng dụng<ChevronRight size={14}/><span>Đồng hồ</span></div>
    <div className="workspace-heading"><div><h1>Đồng hồ</h1><p>Tập trung theo nhịp của bạn.</p></div><button className="button secondary clock-settings-button" aria-label="Cài đặt Đồng hồ" disabled={locked} onClick={() => setSettings(true)}><Settings2 size={19}/><span>Cài đặt Đồng hồ</span></button></div>
    {clock.error && <div className="error-banner" role="alert"><CircleAlert size={19}/><span>{clock.loaded ? "Chưa lưu được Đồng hồ" : "Chưa đọc được Đồng hồ"}: {clock.error} Dữ liệu đang chờ được giữ trong phiên này.</span><button className="button secondary compact" onClick={clock.retry}>Thử lại</button><button className="button secondary compact" onClick={() => setReload(true)}>Đọc lại bản đã lưu</button></div>}
    {!clock.loaded && !clock.error ? <div className="loading-state" role="status"><LoaderCircle className="spin" size={28}/>Đang đọc Đồng hồ…</div> : <>
      <div className="clock-tabs" role="group" aria-label="Chế độ Đồng hồ">{modes.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={state.mode === id} disabled={locked || (active && state.mode !== id)} onClick={() => { if (state.mode !== id) clock.mode(id); }}><Icon size={23}/>{label}</button>)}</div>
      <div className="clock-body"><section className="clock-stage" aria-label="Đồng hồ hiện tại">
        <div className="clock-status" role="status">{state.status === "finished" ? <CheckCircle2 size={16}/> : <Clock3 size={16}/>} {status}</div>
        {state.layout !== "digital" && <h2 className="clock-session-label">{state.mode === "stopwatch" ? "Thời gian của bạn" : state.mode === "focus" ? `Phiên ${state.focusMinutes} phút` : `Đếm ngược ${durationLabel(state.durationMs)}`}</h2>}
        {state.layout === "minimal" && <label className="clock-name">{state.status === "finished" ? "Tên phiên tiếp theo" : "Tên phiên"}<input value={state.title} maxLength={120} disabled={locked} onChange={event => clock.edit({ title: event.target.value })} placeholder="Bạn muốn tập trung vào điều gì?"/></label>}
        <div className="clock-face" role="timer" aria-label={`${modes.find(mode => mode.id === state.mode)!.label}: ${timeLabel}`} aria-live="off">
          {state.layout !== "digital" && <><Circle className="clock-ring-track" size={340} viewBox="1.5 1.5 21 21" strokeWidth={0.65} aria-hidden="true"/><Circle className="clock-ring-progress" size={340} viewBox="1.5 1.5 21 21" strokeWidth={0.65} aria-hidden="true" style={{ "--clock-arc": `${remainingFraction * 62.8319} 62.8319` } as CSSProperties}/></>}
          <div className="clock-digits">{state.layout === "minimal" && <small>{state.status === "idle" ? "Sẵn sàng" : status}</small>}<strong>{timeLabel}</strong><span>{state.status === "finished" ? "đã kết thúc" : state.mode === "stopwatch" ? "đã trôi qua" : "còn lại"}</span></div>
        </div>
        {state.layout === "minimal" && <>{presets()}{state.mode === "countdown" && countdownFields()}</>}
        {state.layout !== "digital" && controls()}
        <p className="clock-help">{active ? "Bạn có thể tạm dừng bất cứ lúc nào." : state.status === "finished" ? "Một khoảng thời gian dành cho bạn." : "Một việc tại một thời điểm."}</p>
      </section>
      {state.layout !== "minimal" && <aside className="clock-session-panel"><h2>{state.layout === "session" ? "Phiên hiện tại" : "Đặt thời lượng"}</h2>
        {state.layout === "digital" && <>{state.mode === "countdown" && countdownFields()}{presets()}</>}
        {state.layout === "digital" ? <details className="clock-optional-fields"><summary>Tên và ghi chú phiên</summary>{details()}</details> : details()}
        {state.layout === "session" && !active && presets()}
        {state.layout === "session" && state.mode === "countdown" && !active && countdownFields()}
        {state.layout === "digital" && <>{controls()}<p className="clock-help">{active ? "Bạn có thể tạm dừng bất cứ lúc nào." : "Chọn thời lượng trước khi bắt đầu."}</p></>}
        {state.layout === "session" && sessions()}
      </aside>}</div>
      {state.layout !== "session" && sessions()}
      <footer className="clock-footer"><span>{clock.error ? "Có thay đổi chưa lưu" : clock.pending ? "Đang lưu trên thiết bị…" : "Lưu trên thiết bị của bạn"}</span><span>Đổi bố cục bất cứ lúc nào trong Cài đặt Đồng hồ</span></footer>
    </>}
    <dialog ref={dialog} className="install-dialog clock-dialog" aria-labelledby="clock-dialog-title" onCancel={close}>
      <div className="dialog-heading"><span className="section-icon">{settings ? <Settings2 size={24}/> : <Clock3 size={24}/>}</span><button ref={closeButton} className="icon-button" aria-label="Đóng hộp thoại Đồng hồ" onClick={close}><X size={21}/></button></div>
      <h2 id="clock-dialog-title">{reload ? "Đọc lại Đồng hồ đã lưu?" : settings ? "Cài đặt Đồng hồ" : finish ? "Kết thúc và lưu phiên?" : selected ? sessionName(selected) : "Đồng hồ"}</h2>
      {reload ? <><p className="muted">Bỏ các thay đổi chưa lưu trong cửa sổ này và đọc phiên mới nhất từ thiết bị. Các phiên và cài đặt đã lưu vẫn được giữ.</p><div className="dialog-actions"><button className="button secondary" onClick={close}>Giữ thay đổi</button><button className="button primary" onClick={() => { close(); void clock.readStored(); }}>Đọc lại bản đã lưu</button></div></> : settings ? <><p className="muted">Thay đổi được áp dụng ngay. Phiên đang chạy vẫn tiếp tục.</p><fieldset className="clock-choice-group"><legend>Bố cục</legend>{layouts.map(item => <label key={item.id} className={state.layout === item.id ? "selected" : ""}><input type="radio" name="clock-layout" value={item.id} checked={state.layout === item.id} disabled={locked} onChange={() => clock.edit({ layout: item.id })}/><span><strong>{item.label}</strong><small>{item.detail}</small></span>{state.layout === item.id && <Check size={18}/>}</label>)}</fieldset><fieldset className="clock-choice-group clock-theme-choices"><legend>Giao diện</legend>{themes.map(item => <label key={item.id} className={state.theme === item.id ? "selected" : ""}><input type="radio" name="clock-theme" checked={state.theme === item.id} disabled={locked} onChange={() => clock.edit({ theme: item.id })}/>{item.label}</label>)}</fieldset><div className="dialog-actions"><button className="button primary" onClick={close}>Xong</button></div></> : finish ? <><p className="muted">Lưu “{sessionName(state)}” với {durationLabel(elapsedClock(state, clock.now))} đã thực hiện. Bạn có thể bắt đầu phiên mới sau đó.</p><div className="dialog-actions"><button className="button secondary" onClick={close}>Quay lại</button><button className="button primary" disabled={locked} onClick={() => { clock.finish(); close(); }}>Kết thúc và lưu</button></div></> : selected && <><dl className="detail-list"><div><dt>Chế độ</dt><dd>{modes.find(mode => mode.id === selected.mode)!.label}</dd></div><div><dt>Thời lượng</dt><dd>{durationLabel(selected.elapsedMs)}</dd></div><div><dt>Thời gian</dt><dd>{new Date(selected.endedAt).toLocaleString("vi-VN")}</dd></div><div><dt>Trạng thái</dt><dd>{selected.outcome === "completed" ? "Hoàn thành" : "Đã kết thúc sớm"}</dd></div></dl>{selected.note && <p className="clock-saved-note">{selected.note}</p>}<div className="dialog-actions"><button className="button primary" onClick={close}>Đóng</button></div></>}
    </dialog>
  </div>;
}
