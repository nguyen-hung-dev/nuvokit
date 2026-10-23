use crate::store::Store;
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};

const KEY: &str = "builtin.clock.v1";
const MAX_MS: u64 = 604_800_000;
const MAX_DATE: u64 = 8_640_000_000_000_000;
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClockState {
    pub version: u32,
    pub layout: String,
    pub theme: String,
    pub mode: String,
    pub status: String,
    pub focus_minutes: u64,
    pub countdown_seconds: u64,
    pub duration_ms: u64,
    pub elapsed_ms: u64,
    pub started_at: Option<u64>,
    pub session_started_at: Option<u64>,
    pub session_id: Option<String>,
    pub title: String,
    pub note: String,
}
impl Default for ClockState {
    fn default() -> Self {
        Self {
            version: 1,
            layout: "minimal".into(),
            theme: "app".into(),
            mode: "focus".into(),
            status: "idle".into(),
            focus_minutes: 25,
            countdown_seconds: 600,
            duration_ms: 1_500_000,
            elapsed_ms: 0,
            started_at: None,
            session_started_at: None,
            session_id: None,
            title: String::new(),
            note: String::new(),
        }
    }
}
fn text(value: &str, max: usize) -> bool {
    value.chars().count() <= max
        && !value
            .chars()
            .any(|c| c.is_control() && !matches!(c, '\n' | '\r' | '\t'))
}
fn id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 80
        && value
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'-')
}
impl ClockState {
    pub fn validate(&self) -> Result<(), String> {
        let duration = match self.mode.as_str() {
            "focus" => self.focus_minutes.saturating_mul(60_000),
            "countdown" => self.countdown_seconds.saturating_mul(1000),
            "stopwatch" => 0,
            _ => return Err("Chế độ Đồng hồ không hợp lệ.".into()),
        };
        let dates = self
            .started_at
            .into_iter()
            .chain(self.session_started_at)
            .all(|n| (1..=MAX_DATE).contains(&n));
        let idle = self.status == "idle";
        if self.version != 1
            || !["minimal", "session", "digital"].contains(&self.layout.as_str())
            || !["app", "light", "dark"].contains(&self.theme.as_str())
            || !["idle", "running", "paused", "finished"].contains(&self.status.as_str())
            || !(1..=180).contains(&self.focus_minutes)
            || !(1..=86_399).contains(&self.countdown_seconds)
            || self.duration_ms != duration
            || self.elapsed_ms > MAX_MS
            || !dates
            || !text(&self.title, 120)
            || !text(&self.note, 500)
            || self.session_id.as_ref().is_some_and(|s| !id(s))
        {
            return Err("Dữ liệu Đồng hồ không hợp lệ.".into());
        }
        if idle {
            if self.started_at.is_some()
                || self.session_started_at.is_some()
                || self.session_id.is_some()
                || self.elapsed_ms != 0
            {
                return Err("Phiên Đồng hồ idle không hợp lệ.".into());
            }
        } else if self.session_started_at.is_none()
            || self.session_id.is_none()
            || (self.status == "running") != self.started_at.is_some()
        {
            return Err("Mốc thời gian Đồng hồ không hợp lệ.".into());
        }
        Ok(())
    }
    pub fn active(&self) -> bool {
        matches!(self.status.as_str(), "running" | "paused")
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClockSession {
    pub id: String,
    pub mode: String,
    pub title: String,
    pub note: String,
    pub started_at: u64,
    pub ended_at: u64,
    pub elapsed_ms: u64,
    pub target_ms: u64,
    pub outcome: String,
}
impl ClockSession {
    pub fn validate(&self) -> Result<(), String> {
        if !id(&self.id)
            || !["focus", "countdown", "stopwatch"].contains(&self.mode.as_str())
            || !["completed", "stopped"].contains(&self.outcome.as_str())
            || !text(&self.title, 120)
            || !text(&self.note, 500)
            || self.started_at == 0
            || self.ended_at < self.started_at
            || self.ended_at > MAX_DATE
            || self.elapsed_ms > MAX_MS
            || self.target_ms > MAX_MS
        {
            return Err("Lịch sử Đồng hồ không hợp lệ.".into());
        }
        Ok(())
    }
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClockData {
    pub state: ClockState,
    pub history: Vec<ClockSession>,
}
impl ClockData {
    pub fn validate(&self) -> Result<(), String> {
        self.state.validate()?;
        if self.history.len() > crate::backup::MAX_HISTORY {
            return Err("Lịch sử Đồng hồ vượt giới hạn sao lưu.".into());
        }
        let mut ids = std::collections::HashSet::new();
        for session in &self.history {
            session.validate()?;
            if !ids.insert(&session.id) {
                return Err("Bản sao lưu trùng phiên Đồng hồ.".into());
            }
        }
        Ok(())
    }
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Stored {
    revision: u64,
    state: ClockState,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockSnapshot {
    pub revision: u64,
    pub state: ClockState,
    pub history: Vec<ClockSession>,
}
pub fn read_state(db: &Connection) -> Result<(u64, ClockState), String> {
    let value: Option<String> = db
        .query_row("SELECT value FROM preferences WHERE key=?1", [KEY], |r| {
            r.get(0)
        })
        .optional()
        .map_err(|_| "Không đọc được Đồng hồ.")?;
    match value {
        None => Ok((0, ClockState::default())),
        Some(value) => {
            let row: Stored =
                serde_json::from_str(&value).map_err(|_| "Dữ liệu Đồng hồ hỏng; đã giữ nguyên.")?;
            row.state.validate()?;
            if row.revision > 9_007_199_254_740_991 {
                return Err("Revision Đồng hồ không hợp lệ.".into());
            }
            Ok((row.revision, row.state))
        }
    }
}

fn history(db: &Connection, limit: usize) -> Result<Vec<ClockSession>, String> {
    let mut query = db
        .prepare("SELECT value FROM clock_history ORDER BY ended_at DESC,id LIMIT ?1")
        .map_err(|_| "Không đọc được lịch sử Đồng hồ.")?;
    let rows = query
        .query_map([limit as i64], |r| r.get::<_, String>(0))
        .map_err(|_| "Không đọc được lịch sử Đồng hồ.")?;
    rows.map(|r| {
        let s: ClockSession =
            serde_json::from_str(&r.map_err(|_| "Không đọc được phiên Đồng hồ.")?)
                .map_err(|_| "Phiên Đồng hồ không hợp lệ.")?;
        s.validate()?;
        Ok(s)
    })
    .collect()
}
pub fn backup_data(db: &Connection) -> Result<Option<ClockData>, String> {
    let exists: bool = db.query_row("SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='clock_history')", [], |r| r.get(0)).map_err(|_| "Không kiểm tra được schema Đồng hồ.")?;
    if !exists {
        return Ok(None);
    }
    let count: i64 = db
        .query_row("SELECT count(*) FROM clock_history", [], |r| r.get(0))
        .map_err(|_| "Không đọc được số phiên.")?;
    if count > crate::backup::MAX_HISTORY as i64 {
        return Err("Quá nhiều phiên cho một bản sao lưu.".into());
    }
    Ok(Some(ClockData {
        state: read_state(db)?.1,
        history: history(db, count as usize)?,
    }))
}
fn write_state(db: &Connection, state: &ClockState, revision: u64) -> Result<(), String> {
    if revision > 9_007_199_254_740_991 {
        return Err("Revision Đồng hồ vượt giới hạn.".into());
    }
    let value = serde_json::to_string(&Stored {
        revision,
        state: state.clone(),
    })
    .map_err(|_| "Không chuẩn bị được Đồng hồ.")?;
    db.execute("INSERT INTO preferences(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![KEY,value]).map_err(|_| "Không lưu được Đồng hồ.")?;
    Ok(())
}
fn insert_session(db: &Connection, session: &ClockSession) -> Result<(), String> {
    let value = serde_json::to_string(session).map_err(|_| "Không chuẩn bị được lịch sử.")?;
    db.execute(
        "INSERT OR IGNORE INTO clock_history(id,ended_at,value) VALUES(?1,?2,?3)",
        params![session.id, session.ended_at as i64, value],
    )
    .map_err(|_| "Không lưu được phiên Đồng hồ.")?;
    Ok(())
}
pub fn restore_data(
    db: &Connection,
    data: &ClockData,
    previous_revision: u64,
) -> Result<(), String> {
    data.validate()?;
    write_state(db, &data.state, previous_revision.saturating_add(1))?;
    db.execute("DELETE FROM clock_history", [])
        .map_err(|_| "Không khôi phục được Đồng hồ.")?;
    for session in &data.history {
        insert_session(db, session)?;
    }
    Ok(())
}
impl Store {
    pub fn clock(&self) -> Result<ClockSnapshot, String> {
        let mut db = self.open()?;
        let tx = db
            .transaction()
            .map_err(|_| "Không đọc được snapshot Đồng hồ.")?;
        let (revision, state) = read_state(&tx)?;
        Ok(ClockSnapshot {
            revision,
            state,
            history: history(&tx, 50)?,
        })
    }
    pub fn save_clock(
        &self,
        state: &ClockState,
        expected: u64,
        completed: Option<&ClockSession>,
    ) -> Result<u64, String> {
        state.validate()?;
        if let Some(session) = completed {
            session.validate()?;
            if state.session_id.as_ref() != Some(&session.id) || state.status != "finished" {
                return Err("Phiên hoàn tất không khớp Đồng hồ.".into());
            }
        }
        let mut db = self.open()?;
        let tx = db
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(|_| "Đồng hồ đang bận; hãy thử lại.")?;
        let (revision, _) = read_state(&tx)?;
        if revision != expected {
            return Err(
                "Đồng hồ đã thay đổi ở cửa sổ khác. Tải lại dữ liệu trước khi ghi tiếp.".into(),
            );
        }
        let next = revision.saturating_add(1);
        write_state(&tx, state, next)?;
        if let Some(session) = completed {
            insert_session(&tx, session)?;
        }
        tx.commit().map_err(|_| "Chưa hoàn tất lưu Đồng hồ.")?;
        Ok(next)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::backup::{Bundle, Payload, SCHEMA};
    fn finished(id: &str) -> (ClockState, ClockSession) {
        let state = ClockState {
            status: "finished".into(),
            elapsed_ms: 60_000,
            session_started_at: Some(1_000),
            session_id: Some(id.into()),
            title: "Phiên kiểm thử".into(),
            ..ClockState::default()
        };
        let session = ClockSession {
            id: id.into(),
            mode: "focus".into(),
            title: state.title.clone(),
            note: String::new(),
            started_at: 1_000,
            ended_at: 61_000,
            elapsed_ms: 60_000,
            target_ms: 1_500_000,
            outcome: "stopped".into(),
        };
        (state, session)
    }
    #[test]
    fn persisted_clock_survives_reopen_and_cas_rejects_stale_windows() {
        let temp = tempfile::tempdir().unwrap();
        let store = Store::new(temp.path()).unwrap();
        let state = ClockState {
            layout: "digital".into(),
            theme: "dark".into(),
            ..ClockState::default()
        };
        assert_eq!(store.save_clock(&state, 0, None).unwrap(), 1);
        assert!(store.save_clock(&ClockState::default(), 0, None).is_err());
        let reopened = Store::new(temp.path()).unwrap().clock().unwrap();
        assert_eq!(reopened.revision, 1);
        assert_eq!(reopened.state, state);
    }
    #[test]
    fn history_is_atomic_deduplicated_and_backup_keeps_more_than_visible_fifty() {
        let temp = tempfile::tempdir().unwrap();
        let store = Store::new(temp.path()).unwrap();
        let mut revision = 0;
        for number in 0..55 {
            let (state, session) = finished(&format!("session-{number}"));
            revision = store.save_clock(&state, revision, Some(&session)).unwrap();
        }
        let (state, session) = finished("session-54");
        store.save_clock(&state, revision, Some(&session)).unwrap();
        assert_eq!(store.clock().unwrap().history.len(), 50);
        let bundle = store.bundle().unwrap();
        assert_eq!(bundle.format_version, 2);
        assert_eq!(bundle.payload.clock.as_ref().unwrap().history.len(), 55);
        assert_eq!(
            Bundle::parse(&bundle.bytes().unwrap())
                .unwrap()
                .payload
                .clock
                .unwrap()
                .history
                .len(),
            55
        );
        store.open().unwrap().execute_batch("CREATE TRIGGER block_clock BEFORE INSERT ON clock_history BEGIN SELECT RAISE(ABORT,'fixture'); END;").unwrap();
        let before = store.clock().unwrap();
        let (new_state, new_session) = finished("rollback");
        assert!(store
            .save_clock(&new_state, before.revision, Some(&new_session))
            .is_err());
        assert_eq!(store.clock().unwrap().revision, before.revision);
        assert_eq!(store.clock().unwrap().state, before.state);
    }
    #[test]
    fn clock_restore_keeps_recovery_and_invalidates_old_writers() {
        let temp = tempfile::tempdir().unwrap();
        let store = Store::new(temp.path()).unwrap();
        let (state, session) = finished("backup-session");
        store.save_clock(&state, 0, Some(&session)).unwrap();
        let bundle = store.bundle().unwrap();
        store.save_clock(&ClockState::default(), 1, None).unwrap();
        let recovery = store.restore(&bundle).unwrap();
        let restored = store.clock().unwrap();
        assert_eq!(restored.state, state);
        assert_eq!(restored.history.len(), 1);
        assert!(store.save_clock(&ClockState::default(), 2, None).is_err());
        let prior = Bundle::read(&temp.path().join("backups").join(recovery)).unwrap();
        assert_eq!(prior.payload.clock.unwrap().state, ClockState::default());
    }
    #[test]
    fn legacy_backup_remains_readable_and_preserves_clock() {
        let temp = tempfile::tempdir().unwrap();
        let store = Store::new(temp.path()).unwrap();
        let (state, session) = finished("keep-session");
        store.save_clock(&state, 0, Some(&session)).unwrap();
        let legacy = Bundle::new(
            Payload {
                preferences: crate::model::Preferences {
                    theme: "dark".into(),
                },
                history: vec![],
                clock: None,
            },
            2,
        )
        .unwrap();
        assert_eq!(legacy.format_version, 1);
        let parsed = Bundle::parse(&legacy.bytes().unwrap()).unwrap();
        store.restore(&parsed).unwrap();
        assert_eq!(store.clock().unwrap().state, state);
        assert_eq!(store.clock().unwrap().history.len(), 1);
        assert_eq!(store.preferences().unwrap().theme, "dark");
    }
    #[test]
    fn active_clock_prevents_restore_before_any_recovery_or_changes() {
        let temp = tempfile::tempdir().unwrap();
        let store = Store::new(temp.path()).unwrap();
        let bundle = store.bundle().unwrap();
        let active = ClockState {
            status: "running".into(),
            started_at: Some(1_000),
            session_started_at: Some(1_000),
            session_id: Some("active".into()),
            ..ClockState::default()
        };
        store.save_clock(&active, 0, None).unwrap();
        assert!(store.restore(&bundle).is_err());
        assert_eq!(store.clock().unwrap().state, active);
        assert!(!temp.path().join("backups").exists());
    }
    #[test]
    fn v2_migration_preserves_data_and_a_legacy_readable_recovery() {
        let temp = tempfile::tempdir().unwrap();
        let db = Connection::open(temp.path().join("core.sqlite3")).unwrap();
        db.execute_batch("CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE job_history(id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL); CREATE TABLE data_events(id INTEGER PRIMARY KEY,action TEXT NOT NULL,created_at TEXT NOT NULL); INSERT INTO preferences VALUES('theme','dark'); PRAGMA user_version=2;").unwrap();
        let store = Store::new(temp.path()).unwrap();
        assert_eq!(store.preferences().unwrap().theme, "dark");
        assert_eq!(store.bundle().unwrap().schema_version, SCHEMA);
        let file = std::fs::read_dir(temp.path().join("backups"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        let recovery = Bundle::read(&file).unwrap();
        assert_eq!(recovery.format_version, 1);
        assert_eq!(recovery.schema_version, 2);
        assert!(recovery.payload.clock.is_none());
    }
}
