use crate::{
    backup::{self, Bundle, SCHEMA},
    engine::Engine,
    model::Preferences,
};
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageInfo {
    pub schema_version: u32,
    pub database_bytes: u64,
    pub package_bytes: u64,
    pub temporary_bytes: u64,
    pub recovery_bytes: u64,
    pub recovery_count: u64,
    pub last_backup_at: Option<String>,
    pub data_directory: String,
    pub temporary_session: bool,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestorePreview {
    pub token: String,
    pub file_name: String,
    pub created_at: String,
    pub app_version: String,
    pub schema_version: u32,
    pub history_entries: usize,
    pub clock_sessions: Option<usize>,
    pub theme: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    pub preferences: Preferences,
    pub recovery_file: String,
}

fn size(path: &Path) -> Result<u64, String> {
    backup::regular_path(path)?;
    match fs::metadata(path) {
        Ok(meta) if meta.is_file() => Ok(meta.len()),
        Ok(meta) if meta.is_dir() => fs::read_dir(path)
            .map_err(|_| "Không đọc được dung lượng dữ liệu.")?
            .try_fold(0u64, |total, entry| {
                let entry = entry.map_err(|_| "Không đọc được dung lượng dữ liệu.")?;
                total
                    .checked_add(size(&entry.path())?)
                    .ok_or_else(|| "Dung lượng vượt giới hạn hiển thị.".into())
            }),
        Ok(_) => Err("Vùng dữ liệu có loại file không được hỗ trợ.".into()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(0),
        Err(_) => Err("Không đọc được dung lượng dữ liệu; hãy kiểm tra quyền thư mục.".into()),
    }
}

impl Engine {
    pub fn storage_info(&self) -> Result<StorageInfo, String> {
        let partial_bytes = size(&self.package_path().with_extension("part"))?;
        let backups = self.root.join("backups");
        let recovery_bytes = size(&backups)?;
        let recovery_count = if backups.exists() {
            fs::read_dir(backups)
                .map_err(|_| "Không đọc được bản phục hồi.")?
                .try_fold(0, |count, entry| {
                    let path = entry.map_err(|_| "Không đọc được bản phục hồi.")?.path();
                    Ok::<_, String>(
                        count + u64::from(path.extension().is_some_and(|e| e == "nuvobak")),
                    )
                })?
        } else {
            0
        };
        Ok(StorageInfo {
            schema_version: SCHEMA,
            database_bytes: size(&self.store.path)?
                + size(&self.root.join("core.sqlite3-wal"))?
                + size(&self.root.join("core.sqlite3-shm"))?,
            package_bytes: size(&self.root.join("dependencies"))?.saturating_sub(partial_bytes),
            temporary_bytes: size(&self.root.join("cache"))? + partial_bytes,
            recovery_bytes,
            recovery_count,
            last_backup_at: self.store.last_backup_at()?,
            data_directory: self.root.to_string_lossy().into_owned(),
            temporary_session: self
                .root
                .file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| n.starts_with("nuvokit-ui-") || n.starts_with("nuvokit-preview-")),
        })
    }

    pub fn export_to(&self, target: &Path) -> Result<(), String> {
        let _guard = self.maintenance()?;
        if target.extension().and_then(|e| e.to_str()) != Some("nuvobak") {
            return Err("Chọn tên file có đuôi .nuvobak.".into());
        }
        backup::regular_path(target)?;
        let parent = target
            .parent()
            .ok_or("Đường dẫn sao lưu không hợp lệ.")?
            .canonicalize()
            .map_err(|_| "Thư mục đích chưa tồn tại.")?;
        let root = self
            .root
            .canonicalize()
            .map_err(|_| "Không kiểm tra được vùng dữ liệu.")?;
        if parent.starts_with(&root) {
            return Err(
                "Chọn nơi lưu ngoài thư mục dữ liệu NuvoKit để giữ bản sao độc lập.".into(),
            );
        }
        backup::atomic_write(target, &self.store.bundle()?.bytes()?)?;
        // The exported file is already valid; a journal failure must not turn a
        // successful backup into a misleading failure/overwrite retry.
        let _ = self.store.record_data_event("backup");
        Ok(())
    }

    pub fn preview_restore(&self, path: &Path) -> Result<RestorePreview, String> {
        let _guard = self.maintenance()?;
        // Clear stale approval even if this new file is invalid or unreadable.
        *self
            .pending_restore
            .lock()
            .map_err(|_| "Không đọc được bản xem trước.")? = None;
        let bundle = Bundle::read(path)?;
        static NEXT: AtomicU64 = AtomicU64::new(1);
        let token = format!(
            "{}-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        );
        let preview = RestorePreview {
            token: token.clone(),
            file_name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned(),
            created_at: bundle.created_at.clone(),
            app_version: bundle.app_version.clone(),
            schema_version: bundle.schema_version,
            history_entries: bundle.payload.history.len(),
            clock_sessions: bundle.payload.clock.as_ref().map(|c| c.history.len()),
            theme: bundle.payload.preferences.theme.clone(),
        };
        *self
            .pending_restore
            .lock()
            .map_err(|_| "Không lưu được bản xem trước.")? = Some((token, bundle));
        Ok(preview)
    }

    pub fn discard_restore(&self, token: &str) -> Result<(), String> {
        let mut pending = self
            .pending_restore
            .lock()
            .map_err(|_| "Không đọc được bản xem trước.")?;
        if pending.as_ref().is_some_and(|(id, _)| id == token) {
            *pending = None;
        }
        Ok(())
    }

    pub fn restore_preview(&self, token: &str) -> Result<RestoreResult, String> {
        let _guard = self.maintenance()?;
        let mut pending = self
            .pending_restore
            .lock()
            .map_err(|_| "Không đọc được bản xem trước.")?;
        if pending.as_ref().is_none_or(|(id, _)| id != token) {
            return Err("Bản xem trước đã hết hiệu lực. Hãy chọn lại file sao lưu.".into());
        }
        let (_, bundle) = pending.take().ok_or("Bản xem trước đã hết hiệu lực.")?;
        drop(pending);
        let recovery_file = self.store.restore(&bundle)?;
        Ok(RestoreResult {
            preferences: bundle.payload.preferences,
            recovery_file,
        })
    }

    pub fn clear_temporary(&self) -> Result<u64, String> {
        let _guard = self.maintenance()?;
        let targets = [
            self.root.join("cache"),
            self.package_path().with_extension("part"),
        ];
        // Inspect every descendant first; a junction aborts before any deletion.
        let bytes = targets
            .iter()
            .try_fold(0, |total, path| Ok::<_, String>(total + size(path)?))?;
        for path in targets {
            remove_tree(&self.root, &path)?;
        }
        let _ = self.store.record_data_event("clear-temporary");
        Ok(bytes)
    }
}

fn remove_tree(root: &Path, path: &Path) -> Result<(), String> {
    if !path.starts_with(root) || path == root {
        return Err("Không dọn file ngoài vùng dữ liệu NuvoKit.".into());
    }
    backup::regular_path(path)?;
    match fs::metadata(path) {
        Ok(meta) if meta.is_dir() => {
            for entry in fs::read_dir(path).map_err(|_| "Không dọn được file tạm.")? {
                remove_tree(root, &entry.map_err(|_| "Không đọc được file tạm.")?.path())?;
            }
            fs::remove_dir(path).map_err(|_| "Một số file tạm đang được dùng. Hãy thử lại.".into())
        }
        Ok(meta) if meta.is_file() => {
            fs::remove_file(path).map_err(|_| "Một số file tạm đang được dùng. Hãy thử lại.".into())
        }
        Ok(_) => Err("Không dọn loại file không được hỗ trợ.".into()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err("Không kiểm tra được file tạm.".into()),
    }
}

pub fn open_folder(root: &Path) -> Result<(), String> {
    #[cfg(windows)]
    {
        std::process::Command::new("explorer.exe")
            .arg(root)
            .spawn()
            .map_err(|_| "Không mở được thư mục dữ liệu.")?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = root;
        Err("Mở thư mục dữ liệu hiện được hỗ trợ trên Windows.".into())
    }
}

// Keep paths out of IPC arguments: dialogs return host-only PathBuf values.
pub fn save_dialog(window: &tauri::WebviewWindow) -> Option<PathBuf> {
    rfd::FileDialog::new()
        .set_parent(window)
        .set_title("Lưu bản sao dữ liệu NuvoKit")
        .add_filter("NuvoKit backup", &["nuvobak"])
        .set_file_name(format!(
            "NuvoKit-{}.nuvobak",
            chrono::Utc::now().format("%Y-%m-%d-%H%M%S")
        ))
        .save_file()
}
pub fn restore_dialog(window: &tauri::WebviewWindow) -> Option<PathBuf> {
    rfd::FileDialog::new()
        .set_parent(window)
        .set_title("Chọn bản sao lưu NuvoKit")
        .add_filter("NuvoKit backup", &["nuvobak"])
        .pick_file()
}

pub fn verify() -> Result<(), String> {
    let parent = std::env::temp_dir()
        .canonicalize()
        .map_err(|_| "Không tìm thấy vùng kiểm chứng tạm.")?;
    let root = parent.join(format!(
        "nuvokit-data-check-{}-{}",
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
    ));
    fs::create_dir(&root).map_err(|_| "Không tạo được vùng kiểm chứng riêng.")?;
    let result = (|| {
        let app = Engine::new(root.join("app"))?;
        app.store.save_preferences(&Preferences {
            theme: "dark".into(),
        })?;
        for id in 0..25 {
            app.store
                .record(&id.to_string(), "ocr-vie-fast", "completed")?;
        }
        let export = root.join("verification.nuvobak");
        app.export_to(&export)?;
        app.store.save_preferences(&Preferences {
            theme: "light".into(),
        })?;
        let preview = app.preview_restore(&export)?;
        if preview.history_entries != 25 || app.store.preferences()?.theme != "light" {
            return Err("Preview đã thay đổi dữ liệu hoặc thiếu lịch sử.".into());
        }
        let restored = app.restore_preview(&preview.token)?;
        if restored.preferences.theme != "dark"
            || app.store.bundle()?.payload.history.len() != 25
            || !app
                .root
                .join("backups")
                .join(restored.recovery_file)
                .exists()
            || app.restore_preview(&preview.token).is_ok()
        {
            return Err("Kiểm chứng khôi phục thất bại.".into());
        }
        let mut corrupt = fs::read(&export).map_err(|_| "Không đọc được fixture.")?;
        corrupt[0] = b'!';
        fs::write(&export, &corrupt).map_err(|_| "Không ghi được fixture.")?;
        if app.preview_restore(&export).is_ok() {
            return Err("Chưa chặn được file hỏng.".into());
        }
        fs::create_dir(app.root.join("cache")).map_err(|_| "Không tạo được cache fixture.")?;
        fs::write(app.root.join("cache/temporary"), b"fixture")
            .map_err(|_| "Không ghi được cache fixture.")?;
        if app.clear_temporary()? != 7 || app.store.preferences()?.theme != "dark" {
            return Err("Kiểm chứng dọn cache thất bại.".into());
        }
        let legacy_root = root.join("legacy");
        fs::create_dir(&legacy_root).map_err(|_| "Không tạo được fixture migration.")?;
        let legacy = rusqlite::Connection::open(legacy_root.join("core.sqlite3"))
            .map_err(|_| "Không mở được fixture migration.")?;
        legacy.execute_batch("CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE job_history(id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL); INSERT INTO preferences VALUES('theme','dark'); PRAGMA user_version=1;").map_err(|_| "Không tạo được schema cũ.")?;
        drop(legacy);
        let migrated = Engine::new(legacy_root)?;
        if migrated.store.preferences()?.theme != "dark"
            || migrated.storage_info()?.recovery_count != 1
        {
            return Err("Migration không giữ đủ dữ liệu/bản phục hồi.".into());
        }
        println!(
            "{}",
            serde_json::json!({"dataVerificationPassed":true,"backupHistoryEntries":25,"previewReadOnly":true,"restoreRoundtrip":true,"singleUseToken":true,"corruptFileRejected":true,"recoveryCreated":true,"schemaV1Migration":true,"cacheClearedWithoutDataLoss":true,"actualUserDataModified":false})
        );
        Ok(())
    })();
    if root.parent() == Some(parent.as_path())
        && root
            .file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n.starts_with("nuvokit-data-check-"))
    {
        backup::regular_path(&root)?;
        fs::remove_dir_all(&root).map_err(|_| "Không dọn được fixture kiểm chứng.")?;
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::PACKAGE_ID;
    #[test]
    fn preview_uses_validated_bytes_once_and_cancel_discards_approval() {
        let temp = tempfile::tempdir().unwrap();
        let app = Engine::new(temp.path().join("app")).unwrap();
        app.store
            .save_preferences(&Preferences {
                theme: "dark".into(),
            })
            .unwrap();
        let file = temp.path().join("backup.nuvobak");
        app.export_to(&file).unwrap();
        app.store
            .save_preferences(&Preferences {
                theme: "light".into(),
            })
            .unwrap();
        let preview = app.preview_restore(&file).unwrap();
        assert_eq!(app.store.preferences().unwrap().theme, "light");
        fs::write(&file, b"file changed after preview").unwrap();
        assert!(app.restore_preview("wrong-token").is_err());
        assert_eq!(
            app.restore_preview(&preview.token)
                .unwrap()
                .preferences
                .theme,
            "dark"
        );
        assert!(app.restore_preview(&preview.token).is_err());
        app.export_to(&file).unwrap();
        let preview = app.preview_restore(&file).unwrap();
        app.discard_restore(&preview.token).unwrap();
        assert!(app.restore_preview(&preview.token).is_err());
        let preview = app.preview_restore(&file).unwrap();
        fs::write(&file, b"corrupt").unwrap();
        assert!(app.preview_restore(&file).is_err());
        assert!(app.restore_preview(&preview.token).is_err());
    }
    #[test]
    fn maintenance_and_installation_are_mutually_exclusive_and_release_on_error() {
        let temp = tempfile::tempdir().unwrap();
        let app = Engine::new(temp.path().join("app")).unwrap();
        let guard = app.maintenance().unwrap();
        assert!(app.reserve(PACKAGE_ID).is_err());
        assert!(app.maintenance().is_err());
        drop(guard);
        app.reserve(PACKAGE_ID).unwrap();
        assert!(app.clear_temporary().is_err());
        assert!(app.export_to(&temp.path().join("backup.nuvobak")).is_err());
        app.release();
        assert!(app.export_to(&app.root.join("bad.nuvobak")).is_err());
        assert!(app.export_to(&temp.path().join("backup.nuvobak")).is_ok());
        assert!(app.storage_info().unwrap().last_backup_at.is_some());
    }
    #[test]
    fn clearing_temporary_data_preserves_package_db_recovery_and_external_files() {
        let temp = tempfile::tempdir().unwrap();
        let app = Engine::new(temp.path().join("app")).unwrap();
        fs::create_dir_all(app.root.join("cache/nested")).unwrap();
        fs::write(app.root.join("cache/nested/temporary"), b"123").unwrap();
        fs::create_dir_all(app.package_path().parent().unwrap()).unwrap();
        fs::write(app.package_path(), b"installed package fixture").unwrap();
        fs::write(app.package_path().with_extension("part"), b"12345").unwrap();
        fs::create_dir(app.root.join("backups")).unwrap();
        fs::write(
            app.root.join("backups/recovery.nuvobak"),
            b"recovery marker",
        )
        .unwrap();
        let external = temp.path().join("external.txt");
        fs::write(&external, b"outside").unwrap();
        assert_eq!(app.storage_info().unwrap().temporary_bytes, 8);
        assert_eq!(app.clear_temporary().unwrap(), 8);
        assert_eq!(app.storage_info().unwrap().temporary_bytes, 0);
        assert!(app.package_path().exists() && app.store.path.exists());
        assert!(app.root.join("backups/recovery.nuvobak").exists() && external.exists());
    }
    #[cfg(windows)]
    #[test]
    fn junction_in_cache_is_rejected_without_deleting_any_target() {
        let temp = tempfile::tempdir().unwrap();
        let app = Engine::new(temp.path().join("app")).unwrap();
        let outside = temp.path().join("outside");
        fs::create_dir(&outside).unwrap();
        fs::write(outside.join("keep.txt"), b"keep").unwrap();
        fs::create_dir(app.root.join("cache")).unwrap();
        let link = app.root.join("cache/junction");
        // Node is part of the documented development toolchain. Its native
        // junction API avoids command-shell quoting and requires no elevation.
        let result = std::process::Command::new("node.exe")
            .args([
                "-e",
                "require('node:fs').symlinkSync(process.argv[1],process.argv[2],'junction')",
            ])
            .arg(&outside)
            .arg(&link)
            .output()
            .unwrap();
        assert!(
            result.status.success(),
            "Synthetic junction creation failed: {}",
            String::from_utf8_lossy(&result.stderr)
        );
        assert!(app.clear_temporary().is_err());
        assert_eq!(fs::read(outside.join("keep.txt")).unwrap(), b"keep");
        fs::remove_dir(link).unwrap();
    }
}
