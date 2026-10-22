pub mod engine;
pub mod model;
mod platform;
mod store;
mod verification;
use engine::Engine;
use model::*;
use std::sync::{atomic::Ordering, Arc};
use tauri::{ipc::Channel, Manager, State};

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
) -> Result<(), String> {
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
        let functional = startup > 0 && startup <= 3000 && report.scan_ms <= 5000 && cpu <= 2.0 && installed && report.os.supported && result.channel_events > 0 && result.theme_persistence;
        let baseline = result.phase == "baseline";
        let pass = functional && if baseline { memory <= 350.0 } else { runtime.baseline_passed.load(Ordering::SeqCst) };
        println!("{}", serde_json::json!({ "phase": result.phase, "uiReadyMs": startup, "scanMs": report.scan_ms, "workingSetMiB": (memory * 10.0).round() / 10.0, "idleCpuPercent": (cpu * 100.0).round() / 100.0, "gpuStatus": result.gpu_status, "ipcChannelEvents": result.channel_events, "themePersistence": result.theme_persistence, "optionalInstallVerified": installed, "supportedOs": report.os.supported, "memoryBudgetMet": memory <= 350.0, "coreBudgetsPassed": pass }));
        if baseline { runtime.baseline_passed.store(pass, Ordering::SeqCst); }
        else { runtime.completed.store(true, Ordering::SeqCst); app.exit(if pass { 0 } else { 1 }); }
    }).await.map_err(|_| "Không hoàn tất phép đo nội bộ.".to_string())?;
    Ok(())
}

pub fn run() {
    let verify = std::env::args().any(|arg| arg == "--verify-core");
    let runtime = Arc::new(verification::Runtime::new(verify));
    let test_root = verify.then(|| {
        std::env::temp_dir().join(format!(
            "nuvokit-ui-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ))
    });
    let setup_root = test_root.clone();
    let setup_runtime = runtime.clone();
    tauri::Builder::default()
        .setup(move |app| {
            let engine = Arc::new(
                Engine::new(
                    setup_root
                        .clone()
                        .unwrap_or(app.path().app_local_data_dir()?),
                )
                .map_err(std::io::Error::other)?,
            );
            if let Some(window) = app.get_webview_window("main") {
                let theme = if engine
                    .store
                    .preferences()
                    .map_err(std::io::Error::other)?
                    .theme
                    == "dark"
                {
                    tauri::Theme::Dark
                } else {
                    tauri::Theme::Light
                };
                let _ = window.set_theme(Some(theme));
            }
            app.manage(engine);
            app.manage(setup_runtime.clone());
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
