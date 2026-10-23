use crate::{
    backup::{self, Bundle, Payload, SCHEMA},
    model::{HistoryEntry, Preferences},
};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use std::path::{Path, PathBuf};

pub struct Store {
    pub(crate) path: PathBuf,
}
impl Store {
    pub fn new(root: &Path) -> Result<Self, String> {
        backup::regular_path(root)?;
        std::fs::create_dir_all(root).map_err(|_| "Không thể tạo vùng dữ liệu app.")?;
        let store = Self {
            path: root.join("core.sqlite3"),
        };
        let mut db = store.open()?;
        let version: u32 = db
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .map_err(|_| "Không đọc được phiên bản dữ liệu.")?;
        if version > SCHEMA {
            return Err(
                "Dữ liệu được tạo bởi phiên bản NuvoKit mới hơn; đã dừng để tránh hạ cấp.".into(),
            );
        }
        if version < SCHEMA {
            let tx = db
                .transaction_with_behavior(TransactionBehavior::Immediate)
                .map_err(|_| "Dữ liệu đang bận; hãy đóng bản NuvoKit khác rồi mở lại.")?;
            let current: u32 = tx
                .pragma_query_value(None, "user_version", |row| row.get(0))
                .map_err(|_| "Không đọc được schema.")?;
            if current > SCHEMA {
                return Err("Dữ liệu cần bản NuvoKit mới hơn.".into());
            }
            if current > 0 && current < SCHEMA {
                // Read the complete logical snapshot under the same write lock
                // as the migration, including rows still present in the WAL.
                let old = Bundle::new(Self::payload_from(&tx)?, current)?;
                store.recovery(&old, "migration")?;
            }
            if current == 0 {
                let tables: u32 = tx.query_row("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], |r| r.get(0)).map_err(|_| "Không kiểm tra được dữ liệu cũ.")?;
                if tables != 0 {
                    return Err(
                        "Database chưa có phiên bản hợp lệ; đã giữ nguyên để kiểm tra.".into(),
                    );
                }
                tx.execute_batch("CREATE TABLE preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE job_history (id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);").map_err(|_| "Không khởi tạo được dữ liệu lõi.")?;
            }
            if current < SCHEMA {
                tx.execute_batch("CREATE INDEX IF NOT EXISTS job_history_created_at ON job_history(created_at DESC); CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS data_events(id INTEGER PRIMARY KEY, action TEXT NOT NULL, created_at TEXT NOT NULL); INSERT OR IGNORE INTO schema_migrations VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now')); INSERT OR IGNORE INTO schema_migrations VALUES(2,strftime('%Y-%m-%dT%H:%M:%fZ','now')); PRAGMA user_version=2;").map_err(|_| "Không nâng cấp được dữ liệu; bản cũ được giữ.")?;
            }
            tx.execute_batch("CREATE TABLE IF NOT EXISTS clock_history(id TEXT PRIMARY KEY,ended_at INTEGER NOT NULL,value TEXT NOT NULL); CREATE INDEX IF NOT EXISTS clock_history_ended ON clock_history(ended_at DESC); INSERT OR IGNORE INTO schema_migrations VALUES(3,strftime('%Y-%m-%dT%H:%M:%fZ','now')); PRAGMA user_version=3;").map_err(|_| "Không nâng cấp được dữ liệu Đồng hồ.")?;
            tx.commit().map_err(|_| "Chưa hoàn tất nâng cấp dữ liệu.")?;
        }
        db.execute_batch("PRAGMA journal_mode=WAL;")
            .map_err(|_| "Không mở được chế độ lưu dữ liệu.")?;
        // A matching version number alone is not enough to accept a broken DB.
        db.prepare("SELECT key,value FROM preferences LIMIT 0")
            .map_err(|_| "Cấu trúc cài đặt không hợp lệ.")?;
        db.prepare("SELECT id,kind,status,created_at FROM job_history LIMIT 0")
            .map_err(|_| "Cấu trúc lịch sử không hợp lệ.")?;
        db.prepare("SELECT action FROM data_events LIMIT 0")
            .map_err(|_| "Cấu trúc dữ liệu lõi không hợp lệ.")?;
        db.prepare("SELECT id,ended_at,value FROM clock_history LIMIT 0")
            .map_err(|_| "Cấu trúc Đồng hồ không hợp lệ.")?;
        Ok(store)
    }
    pub(crate) fn open(&self) -> Result<Connection, String> {
        backup::regular_path(&self.path)?;
        let db = Connection::open(&self.path).map_err(|_| "Không thể mở dữ liệu lõi.")?;
        db.busy_timeout(std::time::Duration::from_secs(5))
            .map_err(|_| "Không thể mở dữ liệu lõi.")?;
        Ok(db)
    }
    fn payload_from(db: &Connection) -> Result<Payload, String> {
        let count: i64 = db
            .query_row("SELECT count(*) FROM job_history", [], |r| r.get(0))
            .map_err(|_| "Không đọc được lịch sử lõi.")?;
        if count > backup::MAX_HISTORY as i64 {
            return Err(
                "Lịch sử vượt giới hạn sao lưu 100.000 mục; đã giữ dữ liệu hiện có.".into(),
            );
        }
        let theme = db
            .query_row("SELECT value FROM preferences WHERE key='theme'", [], |r| {
                r.get(0)
            })
            .optional()
            .map_err(|_| "Không đọc được cài đặt lõi.")?
            .unwrap_or_else(|| "light".into());
        let mut query = db
            .prepare(
                "SELECT id,kind,status,created_at FROM job_history ORDER BY created_at DESC,id",
            )
            .map_err(|_| "Không đọc được lịch sử lõi.")?;
        let history = query
            .query_map([], |r| {
                Ok(HistoryEntry {
                    id: r.get(0)?,
                    kind: r.get(1)?,
                    status: r.get(2)?,
                    created_at: r.get(3)?,
                })
            })
            .map_err(|_| "Không đọc được lịch sử lõi.")?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| "Không đọc được lịch sử lõi.")?;
        Ok(Payload {
            preferences: Preferences { theme },
            history,
            clock: crate::clock::backup_data(db)?,
        })
    }
    pub fn bundle(&self) -> Result<Bundle, String> {
        let mut db = self.open()?;
        let tx = db
            .transaction()
            .map_err(|_| "Không tạo được snapshot dữ liệu.")?;
        Bundle::new(Self::payload_from(&tx)?, SCHEMA)
    }
    pub fn snapshot_for_update(&self) -> Result<String, String> {
        let bundle = self.bundle()?;
        if bundle
            .payload
            .clock
            .as_ref()
            .is_some_and(|clock| clock.state.active())
        {
            return Err("Kết thúc phiên Đồng hồ trước khi cài cập nhật.".into());
        }
        self.recovery(&bundle, "update")
    }
    fn recovery(&self, bundle: &Bundle, reason: &str) -> Result<String, String> {
        let folder = self
            .path
            .parent()
            .ok_or("Không tìm được vùng dữ liệu.")?
            .join("backups");
        backup::regular_path(&folder)?;
        std::fs::create_dir_all(&folder)
            .map_err(|_| "Không tạo được bản phục hồi; dữ liệu chưa bị thay đổi.")?;
        let name = format!(
            "recovery-{}-{}-{}.nuvobak",
            reason,
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        backup::atomic_write(&folder.join(&name), &bundle.bytes()?)?;
        Ok(name)
    }
    pub fn restore(&self, bundle: &Bundle) -> Result<String, String> {
        // Validate again even for an in-memory preview. No mutation precedes this.
        bundle.bytes()?;
        let mut db = self.open()?;
        let tx = db
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(|_| "Dữ liệu đang bận; thử lại khi tác vụ khác hoàn tất.")?;
        let (clock_revision, clock_state) = crate::clock::read_state(&tx)?;
        if clock_state.active() {
            return Err("Kết thúc phiên Đồng hồ trước khi khôi phục dữ liệu.".into());
        }
        let prior = Self::payload_from(&tx)?;
        let clock_data = bundle.payload.clock.as_ref().or(prior.clock.as_ref());
        let recovery = self.recovery(&Bundle::new(prior.clone(), SCHEMA)?, "restore")?;
        tx.execute_batch("DELETE FROM preferences; DELETE FROM job_history;")
            .map_err(|_| "Không chuẩn bị được khôi phục; dữ liệu hiện tại được giữ.")?;
        tx.execute(
            "INSERT INTO preferences(key,value) VALUES('theme',?1)",
            [&bundle.payload.preferences.theme],
        )
        .map_err(|_| "Không khôi phục được cài đặt; dữ liệu hiện tại được giữ.")?;
        for row in &bundle.payload.history {
            tx.execute(
                "INSERT INTO job_history(id,kind,status,created_at) VALUES(?1,?2,?3,?4)",
                params![row.id, row.kind, row.status, row.created_at],
            )
            .map_err(|_| "Không khôi phục được lịch sử; dữ liệu hiện tại được giữ.")?;
        }
        if let Some(clock) = clock_data {
            crate::clock::restore_data(&tx, clock, clock_revision)?;
        }
        tx.execute(
            "INSERT INTO data_events(action,created_at) VALUES('restore',?1)",
            [chrono::Utc::now().to_rfc3339()],
        )
        .map_err(|_| "Không ghi được nhật ký khôi phục.")?;
        tx.commit()
            .map_err(|_| "Chưa hoàn tất khôi phục; dữ liệu hiện tại được giữ.")?;
        Ok(recovery)
    }
    pub fn record_data_event(&self, action: &str) -> Result<(), String> {
        self.open()?
            .execute(
                "INSERT INTO data_events(action,created_at) VALUES(?1,?2)",
                params![action, chrono::Utc::now().to_rfc3339()],
            )
            .map_err(|_| "Không ghi được nhật ký dữ liệu.")?;
        Ok(())
    }
    pub fn last_backup_at(&self) -> Result<Option<String>, String> {
        self.open()?
            .query_row(
                "SELECT created_at FROM data_events WHERE action='backup' ORDER BY id DESC LIMIT 1",
                [],
                |r| r.get(0),
            )
            .optional()
            .map_err(|_| "Không đọc được thông tin sao lưu.".into())
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
    fn migration_without_a_writable_recovery_directory_keeps_schema_and_theme() {
        let dir = tempfile::tempdir().unwrap();
        let db = Connection::open(dir.path().join("core.sqlite3")).unwrap();
        db.execute_batch("CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE job_history(id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL); INSERT INTO preferences VALUES('theme','dark'); PRAGMA user_version=1;").unwrap();
        std::fs::write(dir.path().join("backups"), b"blocking fixture").unwrap();
        assert!(Store::new(dir.path()).is_err());
        assert_eq!(
            db.pragma_query_value(None, "user_version", |r| r.get::<_, u32>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            db.query_row("SELECT value FROM preferences WHERE key='theme'", [], |r| r
                .get::<_, String>(0))
                .unwrap(),
            "dark"
        );
    }
    #[test]
    fn v1_migration_preserves_wal_data_and_creates_recovery_once() {
        let dir = tempfile::tempdir().unwrap();
        let legacy = Connection::open(dir.path().join("core.sqlite3")).unwrap();
        legacy.execute_batch("PRAGMA journal_mode=WAL; CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE job_history(id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL); INSERT INTO preferences VALUES('theme','dark'); PRAGMA user_version=1;").unwrap();
        for id in 0..30 {
            legacy.execute("INSERT INTO job_history VALUES(?1,'ocr-vie-fast','completed','2026-10-22T12:00:00Z')", [id.to_string()]).unwrap();
        }
        let migrated = Store::new(dir.path()).unwrap();
        assert_eq!(migrated.preferences().unwrap().theme, "dark");
        assert_eq!(migrated.bundle().unwrap().payload.history.len(), 30);
        let files: Vec<_> = std::fs::read_dir(dir.path().join("backups"))
            .unwrap()
            .map(|e| e.unwrap().path())
            .collect();
        assert_eq!(files.len(), 1);
        let prior = Bundle::read(&files[0]).unwrap();
        assert_eq!(prior.schema_version, 1);
        assert_eq!(prior.payload.history.len(), 30);
        assert_eq!(prior.payload.preferences.theme, "dark");
        assert_eq!(
            migrated
                .open()
                .unwrap()
                .pragma_query_value(None, "user_version", |r| r.get::<_, u32>(0))
                .unwrap(),
            SCHEMA
        );
        Store::new(dir.path()).unwrap();
        assert_eq!(
            std::fs::read_dir(dir.path().join("backups"))
                .unwrap()
                .count(),
            1
        );
    }
    #[test]
    fn restore_roundtrip_includes_all_history_and_keeps_prior_recovery() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::new(dir.path()).unwrap();
        store
            .save_preferences(&Preferences {
                theme: "dark".into(),
            })
            .unwrap();
        for id in 0..30 {
            store
                .record(&id.to_string(), "ocr-vie-fast", "completed")
                .unwrap();
        }
        let bundle = store.bundle().unwrap();
        assert_eq!(store.history().unwrap().len(), 20);
        assert_eq!(bundle.payload.history.len(), 30);
        store
            .save_preferences(&Preferences {
                theme: "light".into(),
            })
            .unwrap();
        store.record("new", "ocr-vie-fast", "failed").unwrap();
        let recovery = store.restore(&bundle).unwrap();
        assert_eq!(store.preferences().unwrap().theme, "dark");
        assert_eq!(store.bundle().unwrap().payload.history.len(), 30);
        let prior = Bundle::read(&dir.path().join("backups").join(recovery)).unwrap();
        assert_eq!(prior.payload.preferences.theme, "light");
        assert_eq!(prior.payload.history.len(), 31);
    }
    #[test]
    fn restore_failure_rolls_back_deletes_and_preferences() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::new(dir.path()).unwrap();
        store.record("old", "ocr-vie-fast", "failed").unwrap();
        let mut bundle = store.bundle().unwrap();
        bundle.payload.preferences.theme = "dark".into();
        let bundle = Bundle::new(bundle.payload, SCHEMA).unwrap();
        store.open().unwrap().execute_batch("CREATE TRIGGER test_block_restore BEFORE INSERT ON job_history BEGIN SELECT RAISE(ABORT,'fixture failure'); END;").unwrap();
        assert!(store.restore(&bundle).is_err());
        assert_eq!(store.preferences().unwrap().theme, "light");
        assert_eq!(store.history().unwrap()[0].id, "old");
        assert_eq!(
            std::fs::read_dir(dir.path().join("backups"))
                .unwrap()
                .count(),
            1
        );
    }
    #[test]
    fn missing_recovery_permission_blocks_restore_before_changes() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::new(dir.path()).unwrap();
        let bundle = store.bundle().unwrap();
        store
            .save_preferences(&Preferences {
                theme: "dark".into(),
            })
            .unwrap();
        std::fs::write(
            dir.path().join("backups"),
            "fixture blocking backup directory",
        )
        .unwrap();
        assert!(store.restore(&bundle).is_err());
        assert_eq!(store.preferences().unwrap().theme, "dark");
    }
    #[test]
    fn newer_database_is_rejected_without_downgrading_schema() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("core.sqlite3");
        Connection::open(&path)
            .unwrap()
            .execute_batch("PRAGMA user_version=999;")
            .unwrap();
        assert!(Store::new(dir.path()).is_err());
        let version: u32 = Connection::open(path)
            .unwrap()
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap();
        assert_eq!(version, 999);
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
