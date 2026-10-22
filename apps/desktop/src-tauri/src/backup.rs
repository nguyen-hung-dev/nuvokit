use crate::model::{HistoryEntry, Preferences};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{collections::HashSet, fs, io::Read, path::Path};

pub const MAX_BYTES: u64 = 16 * 1024 * 1024;
pub const MAX_HISTORY: usize = 100_000;
pub const SCHEMA: u32 = 2;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Payload {
    pub preferences: Preferences,
    pub history: Vec<HistoryEntry>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Bundle {
    pub format_version: u32,
    pub application: String,
    pub app_version: String,
    pub schema_version: u32,
    pub created_at: String,
    pub payload: Payload,
    pub sha256: String,
}

fn digest(payload: &Payload) -> Result<String, String> {
    let bytes = serde_json::to_vec(payload).map_err(|_| "Không chuẩn bị được bản sao lưu.")?;
    Ok(format!("{:x}", Sha256::digest(bytes)))
}

impl Bundle {
    pub fn new(payload: Payload, schema_version: u32) -> Result<Self, String> {
        let bundle = Self {
            format_version: 1,
            application: "com.nuvokit.desktop".into(),
            app_version: env!("CARGO_PKG_VERSION").into(),
            schema_version,
            created_at: chrono::Utc::now().to_rfc3339(),
            sha256: digest(&payload)?,
            payload,
        };
        bundle.validate()?;
        Ok(bundle)
    }

    fn validate(&self) -> Result<(), String> {
        if self.format_version != 1
            || self.application != "com.nuvokit.desktop"
            || !(1..=SCHEMA).contains(&self.schema_version)
        {
            return Err(
                "Bản sao lưu không thuộc NuvoKit hoặc cần phiên bản ứng dụng mới hơn.".into(),
            );
        }
        if chrono::DateTime::parse_from_rfc3339(&self.created_at).is_err()
            || self.app_version.len() > 80
            || !matches!(self.payload.preferences.theme.as_str(), "light" | "dark")
            || self.payload.history.len() > MAX_HISTORY
        {
            return Err("Dữ liệu trong bản sao lưu không hợp lệ.".into());
        }
        let mut ids = HashSet::new();
        for row in &self.payload.history {
            if row.id.is_empty()
                || row.id.len() > 200
                || row.id.chars().any(char::is_control)
                || row.kind.is_empty()
                || row.kind.len() > 200
                || row.kind.chars().any(char::is_control)
                || !matches!(row.status.as_str(), "completed" | "failed" | "cancelled")
                || chrono::DateTime::parse_from_rfc3339(&row.created_at).is_err()
                || !ids.insert(&row.id)
            {
                return Err("Lịch sử trong bản sao lưu không hợp lệ hoặc trùng ID.".into());
            }
        }
        if self.sha256 != digest(&self.payload)? {
            return Err("Bản sao lưu không khớp SHA-256. Dữ liệu hiện tại được giữ nguyên.".into());
        }
        Ok(())
    }

    pub fn bytes(&self) -> Result<Vec<u8>, String> {
        self.validate()?;
        let bytes = serde_json::to_vec_pretty(self).map_err(|_| "Không tạo được bản sao lưu.")?;
        if bytes.len() as u64 > MAX_BYTES {
            return Err("Bản sao lưu vượt giới hạn 16 MiB.".into());
        }
        Ok(bytes)
    }

    pub fn parse(bytes: &[u8]) -> Result<Self, String> {
        if bytes.len() as u64 > MAX_BYTES {
            return Err("File vượt giới hạn sao lưu 16 MiB.".into());
        }
        let bundle: Self = serde_json::from_slice(bytes)
            .map_err(|_| "File không phải bản sao lưu NuvoKit hợp lệ.")?;
        bundle.validate()?;
        Ok(bundle)
    }

    pub fn read(path: &Path) -> Result<Self, String> {
        let file = fs::File::open(path).map_err(|_| "Không mở được file sao lưu.")?;
        let size = file
            .metadata()
            .map_err(|_| "Không đọc được file sao lưu.")?;
        if !size.is_file() || size.len() > MAX_BYTES {
            return Err("Chọn file sao lưu không quá 16 MiB.".into());
        }
        let mut bytes = Vec::new();
        file.take(MAX_BYTES + 1)
            .read_to_end(&mut bytes)
            .map_err(|_| "Không đọc được file sao lưu.")?;
        Self::parse(&bytes)
    }
}

/// Reject symlinks/junctions instead of following them during maintenance.
pub fn regular_path(path: &Path) -> Result<(), String> {
    let mut current = Some(path);
    while let Some(p) = current {
        match fs::symlink_metadata(p) {
            Ok(meta) => {
                #[cfg(windows)]
                let reparse = {
                    use std::os::windows::fs::MetadataExt;
                    meta.file_attributes() & 0x400 != 0
                };
                #[cfg(not(windows))]
                let reparse = meta.file_type().is_symlink();
                if reparse {
                    return Err(
                        "Thư mục dữ liệu chứa liên kết; đã dừng để giữ an toàn dữ liệu.".into(),
                    );
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => (),
            Err(_) => return Err("Không kiểm tra được đường dẫn dữ liệu.".into()),
        }
        current = p.parent();
    }
    Ok(())
}

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    use std::io::Write;
    regular_path(path)?;
    let parent = path.parent().ok_or("Đường dẫn sao lưu không hợp lệ.")?;
    let temp = parent.join(format!(
        ".nuvokit-{}-{}.tmp",
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
    ));
    let result = (|| {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp)
            .map_err(|_| "Không ghi được file sao lưu. Kiểm tra quyền và dung lượng.")?;
        file.write_all(bytes)
            .and_then(|()| file.sync_all())
            .map_err(|_| "Chưa ghi xong bản sao lưu; file cũ được giữ.")?;
        drop(file);
        fs::rename(&temp, path).map_err(|_| "Không hoàn tất file sao lưu; file cũ được giữ.")?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(temp);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> Bundle {
        Bundle::new(
            Payload {
                preferences: Preferences {
                    theme: "dark".into(),
                },
                history: vec![],
            },
            SCHEMA,
        )
        .unwrap()
    }
    #[test]
    fn corrupt_incompatible_or_unknown_backups_are_rejected() {
        let bytes = sample().bytes().unwrap();
        assert!(Bundle::parse(&bytes).is_ok());
        let original: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        for (key, value) in [
            ("formatVersion", serde_json::json!(2)),
            ("schemaVersion", serde_json::json!(999)),
            ("application", serde_json::json!("other.app")),
            ("sha256", serde_json::json!("0")),
            ("unexpected", serde_json::json!(true)),
        ] {
            let mut changed = original.clone();
            changed[key] = value;
            assert!(
                Bundle::parse(&serde_json::to_vec(&changed).unwrap()).is_err(),
                "{key}"
            );
        }
        assert!(Bundle::parse(b"SQLite format 3").is_err());
        assert!(Bundle::parse(&vec![0; MAX_BYTES as usize + 1]).is_err());
    }
    #[test]
    fn malformed_history_and_duplicate_ids_are_rejected() {
        let mut b = sample();
        let row = HistoryEntry {
            id: "a".into(),
            kind: "ocr-vie-fast".into(),
            status: "completed".into(),
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        b.payload.history = vec![row.clone(), row];
        b.sha256 = digest(&b.payload).unwrap();
        assert!(b.validate().is_err());
        b.payload.history.truncate(1);
        b.payload.history[0].created_at = "bad".into();
        b.sha256 = digest(&b.payload).unwrap();
        assert!(b.validate().is_err());
    }
    #[test]
    fn atomic_write_replaces_export_and_leaves_no_temp_files() {
        let folder = tempfile::tempdir().unwrap();
        let target = folder.path().join("test.nuvobak");
        fs::write(&target, b"old").unwrap();
        atomic_write(&target, b"new").unwrap();
        assert_eq!(fs::read(target).unwrap(), b"new");
        assert_eq!(fs::read_dir(folder.path()).unwrap().count(), 1);
    }
    #[cfg(windows)]
    #[test]
    fn failed_export_keeps_existing_readonly_backup_and_cleans_staging() {
        let folder = tempfile::tempdir().unwrap();
        let target = folder.path().join("keep.nuvobak");
        fs::write(&target, b"prior backup").unwrap();
        let original_permissions = fs::metadata(&target).unwrap().permissions();
        let mut permissions = original_permissions.clone();
        permissions.set_readonly(true);
        fs::set_permissions(&target, permissions).unwrap();
        assert!(atomic_write(&target, b"new backup").is_err());
        assert_eq!(fs::read(&target).unwrap(), b"prior backup");
        assert_eq!(fs::read_dir(folder.path()).unwrap().count(), 1);
        fs::set_permissions(target, original_permissions).unwrap();
    }
}
