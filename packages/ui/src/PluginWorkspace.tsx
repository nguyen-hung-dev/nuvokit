import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, CircleMinus, Clock3, Database, ExternalLink, Info, LayoutGrid, List, ListChecks, Plus, Puzzle, Search, SearchX, ShieldCheck, Sprout, StickyNote, Trash2, X } from "lucide-react";
import { categories, filterPlugins, initialDemoIds, pluginCatalog, type CatalogPlugin, type CategoryFilter } from "./plugin-catalog";
import "./plugin-workspace.css";

export type WorkspacePage = "home" | "library" | "installed";
type LibraryView = "grid" | "details";
const iconMap = { clock: Clock3, books: BookOpen, tasks: ListChecks, calendar: CalendarDays, notes: StickyNote, habits: Sprout };
function PluginIcon({ plugin, large = false }: { plugin: CatalogPlugin; large?: boolean }) {
  const Icon = iconMap[plugin.slug as keyof typeof iconMap] ?? Puzzle;
  return <span className={`plugin-icon tone-${plugin.tone} ${large ? "large" : ""}`}><Icon size={large ? 48 : 31} strokeWidth={1.8}/></span>;
}
function PluginStatus({ installed }: { installed: boolean }) {
  return <span className={`plugin-status ${installed ? "is-installed" : ""}`}>{installed ? <CheckCircle2 size={15}/> : <CircleMinus size={15}/>} {installed ? "Đã cài" : "Chưa cài"}</span>;
}
function initialView(): LibraryView { try { return localStorage.getItem("nuvokit.library.view.v1") === "details" ? "details" : "grid"; } catch { return "grid"; } }

export function PluginWorkspace({ page, onNavigate, onOpenClock }: { page: WorkspacePage | null; onNavigate(page: WorkspacePage): void; onOpenClock(): void }) {
  const [view, setView] = useState<LibraryView>(initialView);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<"suggested" | "name">("suggested");
  const [installed, setInstalled] = useState(() => new Set(initialDemoIds));
  const [selectedId, setSelectedId] = useState("dev.nuvokit.calendar");
  const [dialog, setDialog] = useState<{ plugin: CatalogPlugin; action: "install" | "open" | "remove" } | null>(null);
  const [notice, setNotice] = useState("");
  const modal = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const previousPage = useRef(page);
  useEffect(() => { try { localStorage.setItem("nuvokit.library.view.v1", view); } catch { /* View switching still works without persistence. */ } }, [view]);
  useEffect(() => { if (dialog) { modal.current?.showModal(); cancelButton.current?.focus(); } else modal.current?.close(); }, [dialog]);
  useEffect(() => { if (page !== previousPage.current) { setDialog(null); setNotice(""); previousPage.current = page; } }, [page]);
  const visible = filterPlugins(pluginCatalog, query, category, page === "installed", installed, sort);
  const selected = visible.find(plugin => plugin.manifest.id === selectedId) ?? visible[0];
  const owned = filterPlugins(pluginCatalog, query, "all", true, installed, "suggested");
  const navigate = (target: WorkspacePage) => { setQuery(""); setCategory("all"); setNotice(""); onNavigate(target); };
  const open = (plugin: CatalogPlugin) => { if (plugin.slug === "clock") onOpenClock(); else setDialog({ plugin, action: "open" }); };
  const details = (plugin: CatalogPlugin) => { setSelectedId(plugin.manifest.id); setView("details"); };
  const resetFilters = () => { setQuery(""); setCategory("all"); };
  const confirm = () => {
    if (!dialog) return;
    const { plugin, action } = dialog;
    setInstalled(previous => { const next = new Set(previous); if (action === "install") next.add(plugin.manifest.id); else if (action === "remove") next.delete(plugin.manifest.id); return next; });
    setNotice(`${action === "install" ? "Đã thêm" : "Đã gỡ"} ${plugin.manifest.name} trong bản mẫu. Không thay đổi gói hoặc dữ liệu trên máy.`);
    setDialog(null);
  };
  const detailPanel = (plugin: CatalogPlugin) => <section className="plugin-detail" aria-label={`Chi tiết ${plugin.manifest.name}`}>
    <div className="plugin-detail-title"><PluginIcon plugin={plugin} large/><div><h2>{plugin.manifest.name}</h2><p>NuvoKit · {plugin.slug === "clock" ? "Tích hợp sẵn" : "Gói minh họa"}</p><PluginStatus installed={installed.has(plugin.manifest.id)}/></div></div>
    <p className="plugin-description">{plugin.manifest.description}</p>
    <h3>Bạn có thể</h3>
    <ul className="plugin-features">{plugin.features.map((feature, index) => <li key={feature}>{index === 0 ? <CalendarDays size={20}/> : index === 1 ? <Plus size={20}/> : <Check size={20}/>}<span>{feature}</span></li>)}</ul>
    <div className="plugin-permissions"><h3>Quyền sử dụng</h3><div><Database size={23}/><span><strong>Dữ liệu của plugin</strong><small>Đọc và lưu dữ liệu riêng trên thiết bị</small></span></div></div>
    <p className="plugin-permission-note"><Info size={16}/>{plugin.slug === "clock" ? "Có sẵn cùng ứng dụng NuvoKit." : "Bạn được xem và xác nhận quyền trước khi cài."}</p>
    <button className="button primary plugin-main-action" onClick={() => installed.has(plugin.manifest.id) ? open(plugin) : setDialog({ plugin, action: "install" })}>{installed.has(plugin.manifest.id) ? <ExternalLink size={18}/> : <ArrowDownToLine size={18}/>} {installed.has(plugin.manifest.id) ? "Mở" : "Cài plugin"}</button>
    {installed.has(plugin.manifest.id) && plugin.slug !== "clock" && <button className="text-button plugin-remove" onClick={() => setDialog({ plugin, action: "remove" })}><Trash2 size={15}/>Gỡ khỏi bản mẫu</button>}
    <p className="plugin-fixture-footnote">{plugin.slug === "clock" ? "Đồng hồ tích hợp sẵn · Lưu phiên trên thiết bị" : "Gói minh họa · Chưa tải hoặc chạy mã plugin."}</p>
  </section>;
  if (!page) return null;
  return <div className="plugin-workspace">
    <div className="workspace-heading"><div><h1>{page === "home" ? "Không gian của bạn" : page === "installed" ? "Ứng dụng đã cài" : "Thư viện plugin"}</h1><p>{page === "home" ? "Mở những công cụ bạn dùng mỗi ngày." : page === "installed" ? "Những công cụ trong không gian của bạn." : "Thêm công cụ phù hợp với cách bạn làm việc."}</p></div>
      {page === "home" && <div className="workspace-heading-actions"><label className="plugin-search home-search"><Search size={20}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm ứng dụng..." aria-label="Tìm ứng dụng đã cài"/></label><button className="button primary" onClick={() => navigate("library")}><Plus size={20}/>Thêm plugin</button></div>}
    </div>
    <div className="workspace-demo-note"><Info size={15}/><span>Đồng hồ dùng được và lưu trên thiết bị. Các plugin khác đang minh họa trong phiên này.</span></div>
    {notice && <div className="data-message data-success" role="status"><CheckCircle2 size={18}/><span>{notice}</span><button className="icon-button" aria-label="Đóng thông báo thư viện" onClick={() => setNotice("")}><X size={16}/></button></div>}
    {page === "home" ? <>
      <div className="workspace-section-heading"><h2>Ứng dụng của bạn</h2><button className="text-button" onClick={() => navigate("installed")}>Xem tất cả<ArrowRight size={17}/></button></div>
      {owned.length ? <div className="plugin-home-grid">{owned.map(plugin => <article className="plugin-home-card" key={plugin.manifest.id}><PluginIcon plugin={plugin} large/><h3>{plugin.manifest.name}</h3><p>{plugin.tagline}</p><PluginStatus installed/><button className="button secondary" onClick={() => open(plugin)}><ExternalLink size={18}/>Mở</button></article>)}</div> : <div className="plugin-empty"><SearchX size={30}/><h2>Chưa tìm thấy ứng dụng</h2><p>Thử tên khác hoặc khám phá thư viện.</p><button className="button secondary" onClick={() => navigate("library")}>Khám phá thư viện</button></div>}
      <div className="workspace-section-heading"><h2>Tiếp tục gần đây</h2></div>
      <div className="plugin-recent">{[{ slug: "books", title: "Sách đang đọc", copy: "Bản ghi minh họa · Trang 42" }, { slug: "tasks", title: "Kế hoạch hôm nay", copy: "Danh sách minh họa · 3 việc" }].filter(item => installed.has(`dev.nuvokit.${item.slug}`)).map(item => <button key={item.slug} onClick={() => setDialog({ plugin: pluginCatalog.find(plugin => plugin.slug === item.slug)!, action: "open" })}><PluginIcon plugin={pluginCatalog.find(plugin => plugin.slug === item.slug)!}/><span><strong>{item.title}</strong><small>{item.copy}</small></span><ChevronRight size={20}/></button>)}</div>
      <div className="plugin-discover"><Puzzle size={32}/><div><strong>Thêm công cụ, theo cách của bạn</strong><p>Khám phá thư viện plugin khi cần thêm tiện ích.</p></div><button className="text-button" onClick={() => navigate("library")}>Khám phá thư viện<ArrowRight size={18}/></button></div>
    </> : <div className={`library-body ${view === "details" && visible.length ? "is-detail-view" : ""}`}>
      <label className="plugin-search"><Search size={22}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm plugin..." aria-label="Tìm plugin"/>{query && <button className="icon-button" aria-label="Xóa tìm kiếm" onClick={() => setQuery("")}><X size={17}/></button>}</label>
      <div className="plugin-toolbar"><div className="plugin-categories" role="group" aria-label="Nhóm plugin">{categories.map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div><div className="plugin-view-controls"><label className="plugin-sort"><span className="sr-only">Sắp xếp plugin</span><select value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="suggested">Sắp xếp: Gợi ý</option><option value="name">Sắp xếp: Tên A–Z</option></select></label><div className="plugin-view-switch" role="group" aria-label="Bố cục thư viện"><button aria-label="Dạng lưới" title="Dạng lưới" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={19}/></button><button aria-label="Danh sách và chi tiết" title="Danh sách và chi tiết" aria-pressed={view === "details"} onClick={() => setView("details")}><List size={20}/></button></div></div></div>
      <div className="workspace-section-heading"><h2>{page === "installed" ? "Ứng dụng trong không gian" : "Khám phá ứng dụng"}</h2><span className="muted small" aria-live="polite">{visible.length} plugin</span></div>
      {!visible.length ? <div className="plugin-empty"><SearchX size={32}/><h2>Không tìm thấy plugin</h2><p>Thử từ khóa khác hoặc bỏ bộ lọc đang chọn.</p><button className="button secondary" onClick={resetFilters}>Xóa bộ lọc</button>{page === "installed" && <button className="text-button" onClick={() => navigate("library")}>Khám phá thư viện<ArrowRight size={16}/></button>}</div> : view === "grid" ? <div className="plugin-grid">{visible.map(plugin => <article className="plugin-card" key={plugin.manifest.id}><div className="plugin-card-copy"><PluginIcon plugin={plugin}/><div><h3>{plugin.manifest.name}</h3><p>{plugin.manifest.description}</p></div></div><div className="plugin-card-footer"><span>NuvoKit · {plugin.slug === "clock" ? "Tích hợp sẵn" : "Gói minh họa"}</span><PluginStatus installed={installed.has(plugin.manifest.id)}/><button className={`button ${!installed.has(plugin.manifest.id) && plugin.slug === "calendar" ? "primary" : "secondary"} compact`} onClick={() => installed.has(plugin.manifest.id) ? open(plugin) : details(plugin)}>{installed.has(plugin.manifest.id) ? "Mở" : "Xem chi tiết"}</button></div></article>)}</div> : <div className="plugin-split"><div className="plugin-list" role="group" aria-label="Danh sách plugin">{visible.map(plugin => <button key={plugin.manifest.id} className={`plugin-list-row ${selected?.manifest.id === plugin.manifest.id ? "selected" : ""}`} aria-pressed={selected?.manifest.id === plugin.manifest.id} onClick={() => setSelectedId(plugin.manifest.id)}><PluginIcon plugin={plugin}/><span className="plugin-row-copy"><strong>{plugin.manifest.name}</strong><small>{plugin.tagline}</small></span><PluginStatus installed={installed.has(plugin.manifest.id)}/><ChevronRight size={17}/></button>)}</div>{selected && detailPanel(selected)}</div>}
    </div>}
    <footer className="workspace-footer"><ShieldCheck size={14}/>Đồng hồ tích hợp · Các plugin khác là bản xem trước</footer>
    <dialog ref={modal} className="install-dialog plugin-dialog" onCancel={() => setDialog(null)} aria-labelledby="plugin-dialog-title"><div className="dialog-heading"><span className="section-icon"><Puzzle size={24}/></span><button className="icon-button" aria-label="Đóng hộp thoại plugin" onClick={() => setDialog(null)}><X size={20}/></button></div><h2 id="plugin-dialog-title">{dialog?.action === "install" ? "Thêm plugin vào bản mẫu?" : dialog?.action === "remove" ? "Gỡ khỏi bản mẫu?" : `${dialog?.plugin.manifest.name ?? "Plugin"} · Bản mẫu`}</h2><p className="muted">{dialog?.action === "open" ? "Bạn đang xem luồng giao diện. Nội dung mini-app sẽ được nối vào runtime plugin ở bước tiếp theo." : "Thao tác chỉ thay đổi danh sách minh họa trong phiên xem trước. Không tải mã, cài gói hoặc xóa dữ liệu trên máy."}</p>{dialog && <div className="plugin-dialog-summary"><PluginIcon plugin={dialog.plugin}/><div><strong>{dialog.plugin.manifest.name}</strong><p>{dialog.plugin.manifest.description}</p></div></div>}{dialog?.action === "install" && <div className="note"><Database size={19}/><span>Quyền đề xuất: đọc và lưu dữ liệu riêng của plugin. Không truy cập dữ liệu của plugin khác.</span></div>}<div className="dialog-actions"><button ref={cancelButton} className="button secondary" onClick={() => setDialog(null)}>{dialog?.action === "open" ? "Đóng" : "Hủy"}</button>{dialog?.action !== "open" && <button className="button primary" onClick={confirm}>{dialog?.action === "install" ? "Thêm vào bản mẫu" : "Gỡ khỏi bản mẫu"}</button>}</div></dialog>
  </div>;
}
