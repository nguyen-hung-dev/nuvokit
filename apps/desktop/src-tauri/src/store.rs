use crate::model::{HistoryEntry, Preferences};
use rusqlite::{params, Connection, OptionalExtension};
use std::path::{Path, PathBuf};

pub struct Store {
    path: PathBuf,
}
impl Store {
    pub fn new(root: &Path) -> Result<Self, String> {
        std::fs::create_dir_all(root).map_err(|_| "Không thể tạo vùng dữ liệu app.")?;
        let store = Self {
            path: root.join("core.sqlite3"),
        };
        let db = store.open()?;
        let version: u32 = db
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .map_err(|_| "Không đọc được phiên bản dữ liệu.")?;
        if version > 1 {
            return Err(
                "Dữ liệu được tạo bởi phiên bản NuvoKit mới hơn; đã dừng để tránh hạ cấp.".into(),
            );
        }
        db.execute_batch("PRAGMA journal_mode=WAL; BEGIN; CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS job_history (id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL); PRAGMA user_version=1; COMMIT;")
            .map_err(|_| "Không thể khởi tạo dữ liệu lõi.")?;
        Ok(store)
    }
    fn open(&self) -> Result<Connection, String> {
        let db = Connection::open(&self.path).map_err(|_| "Không thể mở dữ liệu lõi.")?;
        db.busy_timeout(std::time::Duration::from_secs(5))
            .map_err(|_| "Không thể mở dữ liệu lõi.")?;
        Ok(db)
    }
    pub fn preferences(&self) -> Result<Preferences, String> {
        let theme = self
            .open()?
            .query_row(
                "SELECT value FROM preferences WHERE key='theme'",
                [],
                |row| row.get(0),
            )
            .optional()
            .map_err(|_| "Không đọc được cài đặt.")?
            .unwrap_or_else(|| "light".into());
        Ok(Preferences { theme })
    }
    pub fn save_preferences(&self, preferences: &Preferences) -> Result<(), String> {
        if !matches!(preferences.theme.as_str(), "light" | "dark") {
            return Err("Theme không hợp lệ.".into());
        }
        self.open()?.execute("INSERT INTO preferences(key,value) VALUES('theme',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [&preferences.theme]).map_err(|_| "Không lưu được cài đặt.")?;
        Ok(())
    }
    pub fn record(&self, id: &str, kind: &str, status: &str) -> Result<(), String> {
        self.open()?
            .execute(
                "INSERT OR REPLACE INTO job_history(id,kind,status,created_at) VALUES(?1,?2,?3,?4)",
                params![id, kind, status, chrono::Utc::now().to_rfc3339()],
            )
            .map_err(|_| "Không lưu được lịch sử.")?;
        Ok(())
    }
    pub fn history(&self) -> Result<Vec<HistoryEntry>, String> {
        let db = self.open()?;
        let mut query = db.prepare("SELECT id,kind,status,created_at FROM job_history ORDER BY created_at DESC LIMIT 20").map_err(|_| "Không đọc được lịch sử.")?;
        let rows = query
            .query_map([], |row| {
                Ok(HistoryEntry {
                    id: row.get(0)?,
                    kind: row.get(1)?,
                    status: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })
            .map_err(|_| "Không đọc được lịch sử.")?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|_| "Không đọc được lịch sử.".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn newer_database_is_rejected_without_downgrading_schema() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("core.sqlite3");
        Connection::open(&path)
            .unwrap()
            .execute_batch("PRAGMA user_version=2;")
            .unwrap();
        assert!(Store::new(dir.path()).is_err());
        let version: u32 = Connection::open(path)
            .unwrap()
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap();
        assert_eq!(version, 2);
    }
    #[test]
    fn theme_survives_reopen_and_rejects_invalid_values() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::new(dir.path()).unwrap();
        store
            .save_preferences(&Preferences {
                theme: "dark".into(),
            })
            .unwrap();
        assert_eq!(
            Store::new(dir.path()).unwrap().preferences().unwrap().theme,
            "dark"
        );
        assert!(store
            .save_preferences(&Preferences {
                theme: "invalid".into()
            })
            .is_err());
        store.record("1", "ocr-vie-fast", "cancelled").unwrap();
        assert_eq!(store.history().unwrap()[0].status, "cancelled");
    }
}
