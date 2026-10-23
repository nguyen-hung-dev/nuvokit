mod backup;
mod clock;
mod data;
pub mod engine;
pub mod model;
mod platform;
mod store;
mod updates;
mod verification;
use engine::Engine;
use model::*;
use std::sync::{atomic::Ordering, Arc};
use tauri::{ipc::Channel, Manager, State};
pub fn verify_data() -> Result<(), String> {
    data::verify()
}

#[tauri::command]
async fn get_clock(engine: State<'_, Arc<Engine>>) -> Result<clock::ClockSnapshot, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.store.clock())
        .await
        .map_err(|_| "Không đọc được Đồng hồ.".to_string())?
}
#[tauri::command]
async fn save_clock(
    engine: State<'_, Arc<Engine>>,
    state: clock::ClockState,
    expected_revision: u64,
    completed: Option<clock::ClockSession>,
    updates: State<'_, Arc<updates::Updates>>,
) -> Result<u64, String> {
    let engine = engine.inner().clone();
    let updates = updates.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _writes = updates.write_gate.lock().map_err(|_| "Dữ liệu đang bận.")?;
        engine
            .store
            .save_clock(&state, expected_revision, completed.as_ref())
    })
    .await
    .map_err(|_| "Không lưu được Đồng hồ.".to_string())?
}

#[tauri::command]
async fn get_storage_info(engine: State<'_, Arc<Engine>>) -> Result<data::StorageInfo, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.storage_info())
        .await
        .map_err(|_| "Không đọc được dung lượng dữ liệu.".to_string())?
}
#[tauri::command]
async fn export_backup(
    engine: State<'_, Arc<Engine>>,
    window: tauri::WebviewWindow,
) -> Result<bool, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let Some(path) = data::save_dialog(&window) else {
            return Ok(false);
        };
        engine.export_to(&path)?;
        Ok(true)
    })
    .await
    .map_err(|_| "Không hoàn tất được sao lưu.".to_string())?
}
#[tauri::command]
async fn prepare_restore(
    engine: State<'_, Arc<Engine>>,
    window: tauri::WebviewWindow,
) -> Result<Option<data::RestorePreview>, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        *engine
            .pending_restore
            .lock()
            .map_err(|_| "Không đọc được bản xem trước.")? = None;
        let Some(path) = data::restore_dialog(&window) else {
            return Ok(None);
        };
        engine.preview_restore(&path).map(Some)
    })
    .await
    .map_err(|_| "Không đọc được bản sao lưu.".to_string())?
}
#[tauri::command]
fn discard_restore(engine: State<'_, Arc<Engine>>, token: String) -> Result<(), String> {
    engine.discard_restore(&token)
}
#[tauri::command]
async fn restore_backup(
    engine: State<'_, Arc<Engine>>,
    window: tauri::WebviewWindow,
    token: String,
) -> Result<data::RestoreResult, String> {
    let engine = engine.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || engine.restore_preview(&token))
        .await
        .map_err(|_| "Không hoàn tất được khôi phục.".to_string())??;
    let theme = if result.preferences.theme == "dark" {
        tauri::Theme::Dark
    } else {
        tauri::Theme::Light
    };
    let _ = window.set_theme(Some(theme));
    Ok(result)
}
#[tauri::command]
async fn clear_temporary_data(engine: State<'_, Arc<Engine>>) -> Result<u64, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.clear_temporary())
        .await
        .map_err(|_| "Không dọn được file tạm.".to_string())?
}
#[tauri::command]
fn open_data_folder(engine: State<'_, Arc<Engine>>) -> Result<(), String> {
    data::open_folder(&engine.root)
}

#[tauri::command]
async fn scan_environment(engine: State<'_, Arc<Engine>>) -> Result<EnvironmentReport, String> {
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || engine.scan())
        .await
        .map_err(|_| "Không hoàn tất được kiểm tra môi trường.".into())
}
#[tauri::command]
async fn install_dependency(
    package_id: String,
    on_event: Channel<JobProgress>,
    engine: State<'_, Arc<Engine>>,
) -> Result<(), String> {
    let engine = engine.inner().clone();
    let cancellation = engine.reserve(&package_id)?;
    let worker = engine.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        worker.install(cancellation, |event| {
            let _ = on_event.send(event);
        })
    })
    .await;
    engine.release();
    result.map_err(|_| "Tác vụ cài đặt bị dừng bất thường. Có thể thử lại.".to_string())?
}
#[tauri::command]
fn cancel_install(engine: State<'_, Arc<Engine>>) -> Result<(), String> {
    engine.cancel()
}
#[tauri::command]
fn get_preferences(engine: State<'_, Arc<Engine>>) -> Result<Preferences, String> {
    engine.store.preferences()
}
#[tauri::command]
fn set_preferences(
    preferences: Preferences,
    engine: State<'_, Arc<Engine>>,
    window: tauri::WebviewWindow,
    updates: State<'_, Arc<updates::Updates>>,
) -> Result<(), String> {
    let _writes = updates.write_gate.lock().map_err(|_| "Dữ liệu đang bận.")?;
    engine.store.save_preferences(&preferences)?;
    let theme = if preferences.theme == "dark" {
        tauri::Theme::Dark
    } else {
        tauri::Theme::Light
    };
    window
        .set_theme(Some(theme))
        .map_err(|_| "Đã lưu theme, nhưng chưa đổi được màu cửa sổ.".into())
}
#[tauri::command]
fn get_history(engine: State<'_, Arc<Engine>>) -> Result<Vec<HistoryEntry>, String> {
    engine.store.history()
}

#[tauri::command]
fn ui_ready(runtime: State<'_, Arc<verification::Runtime>>) -> bool {
    runtime.ready();
    runtime.verify
}
#[tauri::command]
async fn finish_verification(
    result: verification::RendererResult,
    runtime: State<'_, Arc<verification::Runtime>>,
    engine: State<'_, Arc<Engine>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    if !runtime.verify {
        return Err("Chỉ dùng trong chế độ kiểm chứng nội bộ.".into());
    }
    if !matches!(result.phase.as_str(), "baseline" | "post-gpu")
        || !matches!(
            result.gpu_status.as_str(),
            "not-run" | "passed" | "unsupported" | "failed"
        )
    {
        return Err("Kết quả kiểm chứng không hợp lệ.".into());
    }
    let runtime = runtime.inner().clone();
    let engine = engine.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let report = engine.scan();
        let installed = report.dependencies.iter().any(|item| item.id == engine::PACKAGE_ID && item.status == "ready");
        let (memory, cpu) = verification::measure_resources();
        let startup = runtime.ready_ms.load(Ordering::SeqCst);
        let functional = startup > 0 && startup <= 3000 && report.scan_ms <= 5000 && cpu <= 2.0 && installed && report.os.supported && result.channel_events > 0 && result.theme_persistence && result.clock_persistence;
        let baseline = result.phase == "baseline";
        let pass = functional && if baseline { memory <= 350.0 } else { runtime.baseline_passed.load(Ordering::SeqCst) };
        println!("{}", serde_json::json!({ "phase": result.phase, "uiReadyMs": startup, "scanMs": report.scan_ms, "workingSetMiB": (memory * 10.0).round() / 10.0, "idleCpuPercent": (cpu * 100.0).round() / 100.0, "gpuStatus": result.gpu_status, "ipcChannelEvents": result.channel_events, "themePersistence": result.theme_persistence, "clockPersistence": result.clock_persistence, "optionalInstallVerified": installed, "supportedOs": report.os.supported, "memoryBudgetMet": memory <= 350.0, "functionalChecksPassed": functional, "coreBudgetsPassed": pass }));
        if baseline { runtime.baseline_passed.store(pass, Ordering::SeqCst); }
        else { runtime.completed.store(true, Ordering::SeqCst); app.exit(if pass { 0 } else { 1 }); }
    }).await.map_err(|_| "Không hoàn tất phép đo nội bộ.".to_string())?;
    Ok(())
}

pub fn run() {
    let verify = std::env::args().any(|arg| arg == "--verify-core");
    let verify_update =
        std::env::args().any(|arg| arg == "--verify-update" || arg == "--verify-update-local");
    let temporary = verify_update || std::env::args().any(|arg| arg == "--temporary-profile");
    let runtime = Arc::new(verification::Runtime::new(verify));
    let test_root = (verify || temporary).then(|| {
        std::env::temp_dir().join(format!(
            "{}-{}-{}",
            if verify {
                "nuvokit-ui"
            } else {
                "nuvokit-preview"
            },
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ))
    });
    let setup_root = test_root.clone();
    let setup_runtime = runtime.clone();
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(move |app| {
            let root = match &setup_root {
                Some(root) => root.clone(),
                None => app.path().app_local_data_dir()?,
            };
            let engine = match Engine::new(root) {
                Ok(engine) => Arc::new(engine),
                Err(message) => {
                    rfd::MessageDialog::new().set_title("NuvoKit cần kiểm tra dữ liệu")
                        .set_description(format!("{}\n\nDữ liệu hiện có được giữ nguyên. Hãy đóng các bản NuvoKit khác và kiểm tra quyền/dung lượng. Nếu dữ liệu thuộc bản mới hơn, hãy cập nhật ứng dụng.", message))
                        .set_level(rfd::MessageLevel::Error).set_buttons(rfd::MessageButtons::Ok).show();
                    return Err(std::io::Error::other(message).into());
                }
            };
            let updater = Arc::new(updates::Updates::new(engine.root.clone(), setup_root.is_some()).map_err(std::io::Error::other)?);
            // A broken update cache must not stop the main app or reset user data.
            if updater.restore_cached(app.handle()).is_err() { updater.clear_cached_check(); }
            app.manage(updater);
            let theme = if engine.store.preferences().map_err(std::io::Error::other)?.theme == "dark" { tauri::Theme::Dark } else { tauri::Theme::Light };
            app.manage(engine);
            app.manage(setup_runtime.clone());
            if verify_update { updates::verify(app.handle().clone()); return Ok(()); }
            let mut window = tauri::WebviewWindowBuilder::from_config(app.handle(), &app.config().app.windows[0])?;
            if let Some(root) = &setup_root {
                // Isolate WebView cookies/localStorage/cache too, not just SQLite.
                window = window.data_directory(root.join("webview"));
            }
            let window = window.build()?;
            let _ = window.set_theme(Some(theme));
            if setup_runtime.verify {
                let handle = app.handle().clone();
                let watchdog = setup_runtime.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(120));
                    if !watchdog.completed.load(Ordering::SeqCst) {
                        eprintln!("Native verification timed out before the renderer finished.");
                        handle.exit(2);
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            updates::update_status,
            updates::set_update_channel,
            updates::check_update,
            updates::download_update,
            updates::cancel_update,
            updates::install_update,
            get_clock,
            save_clock,
            get_storage_info,
            export_backup,
            prepare_restore,
            discard_restore,
            restore_backup,
            clear_temporary_data,
            open_data_folder,
            scan_environment,
            install_dependency,
            cancel_install,
            get_preferences,
            set_preferences,
            get_history,
            ui_ready,
            finish_verification
        ])
        .build(tauri::generate_context!())
        .expect("Could not start NuvoKit")
        .run(|handle, event| {
            if matches!(event, tauri::RunEvent::ExitRequested { .. }) {
                let _ = handle.state::<Arc<Engine>>().cancel();
                let runtime = handle.state::<Arc<verification::Runtime>>();
                if runtime.verify && runtime.completed.load(Ordering::SeqCst) {
                    let engine = handle.state::<Arc<Engine>>();
                    if let (Ok(root), Ok(temporary)) = (
                        engine.root.canonicalize(),
                        std::env::temp_dir().canonicalize(),
                    ) {
                        if root.starts_with(temporary)
                            && root.file_name().is_some_and(|name| {
                                name.to_string_lossy().starts_with("nuvokit-ui-")
                            })
                        {
                            let _ = std::fs::remove_dir_all(root);
                        }
                    }
                }
            }
        });
    if let Some(root) = test_root {
        if let (Ok(root), Ok(temporary)) =
            (root.canonicalize(), std::env::temp_dir().canonicalize())
        {
            if root.starts_with(temporary) {
                let _ = std::fs::remove_dir_all(root);
            }
        }
    }
}

/// Redacted CLI proof: no hardware inventory, username, serial number or path is emitted.
pub fn smoke_test(install: bool) -> Result<(), String> {
    let temporary = std::env::temp_dir()
        .canonicalize()
        .map_err(|_| "Không tìm thấy thư mục tạm.")?;
    let root = temporary.join(format!(
        "nuvokit-smoke-{}-{}",
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
    ));
    std::fs::create_dir(&root).map_err(|_| "Không tạo được thư mục smoke test riêng.")?;
    let engine = Engine::new(root.clone())?;
    let report = engine.scan();
    let mut installed = false;
    if install {
        let flag = engine.reserve(engine::PACKAGE_ID)?;
        let result = engine.install(flag, |_| {});
        engine.release();
        result?;
        installed =
            engine.scan().dependencies.iter().any(|dependency| {
                dependency.id == engine::PACKAGE_ID && dependency.status == "ready"
            });
        let flag = engine.reserve(engine::PACKAGE_ID)?;
        let result = engine.install(flag, |_| {});
        engine.release();
        result?;
    }
    println!(
        "{}",
        serde_json::json!({"schemaVersion": report.schema_version, "supportedOs": report.os.supported, "hardwareFieldsPresent": !report.cpu.name.is_empty() && report.memory.total_bytes > 0, "webviewReady": report.dependencies[0].status == "ready", "scanMs": report.scan_ms, "optionalInstallVerified": installed, "sqliteVersion": rusqlite::version()})
    );
    drop(engine);
    if !root
        .canonicalize()
        .map_err(|_| "Không xác minh được thư mục smoke test.")?
        .starts_with(&temporary)
    {
        return Err("Thư mục smoke test nằm ngoài vùng tạm.".into());
    }
    std::fs::remove_dir_all(root).map_err(|_| "Không dọn được thư mục smoke test.")?;
    Ok(())
}
