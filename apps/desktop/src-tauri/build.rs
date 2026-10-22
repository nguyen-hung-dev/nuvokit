fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "get_storage_info",
            "export_backup",
            "prepare_restore",
            "discard_restore",
            "restore_backup",
            "clear_temporary_data",
            "open_data_folder",
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
