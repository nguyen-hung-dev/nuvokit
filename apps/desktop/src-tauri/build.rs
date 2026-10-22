fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "scan_environment",
            "install_dependency",
            "cancel_install",
            "get_preferences",
            "set_preferences",
            "get_history",
            "ui_ready",
            "finish_verification",
        ]),
    ))
    .expect("Tauri build configuration failed");
}
