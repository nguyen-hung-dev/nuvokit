use crate::{backup, engine::Engine};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Read,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};
use tauri::{ipc::Channel, State};
use tauri_plugin_updater::{Update, UpdaterExt};

const MAX_PACKAGE: u64 = 64 * 1024 * 1024;
const INTERVAL: i64 = 24 * 60 * 60;
#[derive(Clone, Copy, Default, Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum UpdateChannel {
    Stable,
    #[default]
    Preview,
}
impl UpdateChannel {
    fn name(self) -> &'static str {
        match self {
            Self::Stable => "stable",
            Self::Preview => "preview",
        }
    }
}
#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Config {
    channel: UpdateChannel,
    checked_at: Option<i64>,
    #[serde(default)]
    release: Option<serde_json::Value>,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Offer {
    token: String,
    version: String,
    notes: String,
    pub_date: Option<String>,
    downloaded: bool,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    current_version: &'static str,
    channel: UpdateChannel,
    supported: bool,
    can_install: bool,
    last_checked_at: Option<i64>,
    available: Option<Offer>,
    message: String,
}
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    stage: &'static str,
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
}
struct Package {
    offer: Offer,
    update: Update,
    bytes: Option<Vec<u8>>,
}
pub struct Updates {
    config: Mutex<Config>,
    available: Mutex<Option<Package>>,
    operation: AtomicBool,
    cancel: AtomicBool,
    pub write_gate: Mutex<()>,
    root: PathBuf,
    temporary: bool,
}
struct Operation<'a>(&'a Updates);
impl Drop for Operation<'_> {
    fn drop(&mut self) {
        self.0.operation.store(false, Ordering::SeqCst);
    }
}
impl Updates {
    pub fn new(root: PathBuf, temporary: bool) -> Result<Self, String> {
        let file = root.join("update-state.json");
        backup::regular_path(&file)?;
        // Operational cache only: corruption must not stop the application.
        let config = if file.exists() {
            fs::metadata(&file)
                .ok()
                .filter(|meta| meta.len() <= 128 * 1024)
                .and_then(|_| fs::read(&file).ok())
                .and_then(|bytes| serde_json::from_slice(&bytes).ok())
                .unwrap_or(Config {
                    channel: UpdateChannel::Stable,
                    checked_at: None,
                    release: None,
                })
        } else {
            Config::default()
        };
        Ok(Self {
            config: Mutex::new(config),
            available: Mutex::new(None),
            operation: AtomicBool::new(false),
            cancel: AtomicBool::new(false),
            write_gate: Mutex::new(()),
            root,
            temporary,
        })
    }
    pub fn restore_cached(&self, app: &tauri::AppHandle) -> Result<(), String> {
        if !self.supported() {
            return Ok(());
        }
        let config = self.config.lock().map_err(|_| "Cập nhật đang bận.")?;
        if let Some(raw) = &config.release {
            if let Some(update) = builder(app, config.channel, false)?
                .restore_update(raw.clone())
                .map_err(|_| "Metadata cập nhật đã lưu không hợp lệ.")?
            {
                validate_offer(&update)?;
                *self.available.lock().map_err(|_| "Cập nhật đang bận.")? = Some(package(update));
            }
        }
        Ok(())
    }
    pub fn clear_cached_check(&self) {
        if let Ok(mut config) = self.config.lock() {
            config.checked_at = None;
            config.release = None;
        }
        if let Ok(mut available) = self.available.lock() {
            *available = None;
        }
    }
    fn begin(&self) -> Result<Operation<'_>, String> {
        self.operation
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .map_err(|_| "Một tác vụ cập nhật đang chạy.")?;
        self.cancel.store(false, Ordering::SeqCst);
        Ok(Operation(self))
    }
    fn supported(&self) -> bool {
        cfg!(all(windows, target_arch = "x86_64"))
            && !cfg!(debug_assertions)
            && !std::env::args().any(|arg| arg.starts_with("--verify-update"))
    }
    fn can_install(&self) -> bool {
        self.supported()
            && !self.temporary
            && matches!(
                tauri::utils::platform::bundle_type(),
                Some(tauri::utils::config::BundleType::Nsis)
            )
    }
    fn persist(&self, config: &Config) -> Result<(), String> {
        backup::atomic_write(
            &self.root.join("update-state.json"),
            &serde_json::to_vec(config).map_err(|_| "Không lưu được cài đặt cập nhật.")?,
        )
    }
    fn status(&self, message: impl Into<String>) -> Result<Status, String> {
        let config = self.config.lock().map_err(|_| "Cập nhật đang bận.")?;
        let available = self
            .available
            .lock()
            .map_err(|_| "Cập nhật đang bận.")?
            .as_ref()
            .map(|p| p.offer.clone());
        Ok(Status {
            current_version: env!("CARGO_PKG_VERSION"),
            channel: config.channel,
            supported: self.supported(),
            can_install: self.can_install(),
            last_checked_at: config.checked_at,
            available,
            message: message.into(),
        })
    }
}
fn package(update: Update) -> Package {
    Package {
        offer: Offer {
            token: format!(
                "{}-{}",
                std::process::id(),
                chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
            ),
            version: update.version.clone(),
            notes: update
                .body
                .clone()
                .unwrap_or_default()
                .chars()
                .take(20_000)
                .collect(),
            pub_date: update.date.map(|date| date.to_string()),
            downloaded: false,
        },
        update,
        bytes: None,
    }
}
fn endpoint(channel: UpdateChannel) -> url::Url {
    format!(
        "https://raw.githubusercontent.com/nguyen-hung-dev/nuvokit/main/updates/{}.json",
        channel.name()
    )
    .parse()
    .expect("static update endpoint")
}
fn validate_release(version: &str, download_url: &str, signature: &str) -> Result<(), String> {
    let v = semver::Version::parse(version).map_err(|_| "Phiên bản cập nhật không hợp lệ.")?;
    let expected=format!("https://github.com/nguyen-hung-dev/nuvokit/releases/download/v{v}/NuvoKit_{v}_x64-update.exe");
    if download_url != expected || signature.len() > 4096 || signature.is_empty() {
        return Err("Nguồn cập nhật không khớp bản phát hành NuvoKit chính chủ.".into());
    }
    Ok(())
}
fn validate_offer(update: &Update) -> Result<(), String> {
    validate_release(
        &update.version,
        update.download_url.as_str(),
        &update.signature,
    )
}
fn builder(
    app: &tauri::AppHandle,
    channel: UpdateChannel,
    verify: bool,
) -> Result<tauri_plugin_updater::Updater, String> {
    let mut builder = app
        .updater_builder()
        .target("windows-x86_64")
        .endpoints(vec![endpoint(channel)])
        .map_err(|_| "Nguồn cập nhật không hợp lệ.")?
        .timeout(Duration::from_secs(20))
        .configure_client(|client| client.https_only(true));
    if verify {
        builder = builder.version_comparator(|_, _| true);
    }
    builder
        .build()
        .map_err(|_| "Không khởi tạo được cập nhật.".to_string())
}
#[tauri::command]
pub fn update_status(updates: State<'_, Arc<Updates>>) -> Result<Status, String> {
    updates.status(if updates.supported() {
        ""
    } else {
        "Bản chạy source cập nhật qua Git. Mở bản cài Windows để cập nhật trong app."
    })
}
#[tauri::command]
pub fn set_update_channel(
    channel: UpdateChannel,
    updates: State<'_, Arc<Updates>>,
) -> Result<Status, String> {
    let _operation = updates.begin()?;
    {
        let mut config = updates.config.lock().map_err(|_| "Cập nhật đang bận.")?;
        let next = Config {
            channel,
            checked_at: None,
            release: None,
        };
        updates.persist(&next)?;
        *config = next;
    }
    *updates.available.lock().map_err(|_| "Cập nhật đang bận.")? = None;
    updates.status("")
}
#[tauri::command]
pub async fn check_update(
    manual: bool,
    app: tauri::AppHandle,
    updates: State<'_, Arc<Updates>>,
) -> Result<Status, String> {
    if !updates.supported() {
        return update_status(updates);
    }
    let _operation = updates.begin()?;
    let now = chrono::Utc::now().timestamp();
    let (channel, cached) = {
        let config = updates.config.lock().map_err(|_| "Cập nhật đang bận.")?;
        (
            config.channel,
            !manual
                && config
                    .checked_at
                    .is_some_and(|time| now >= time && now - time < INTERVAL),
        )
    };
    if cached {
        return updates.status("Đã kiểm tra cập nhật trong 24 giờ qua.");
    }
    let result = builder(&app, channel, false)?.check().await;
    let (update, message) = match result {
        Ok(update) => (update, String::new()),
        Err(tauri_plugin_updater::Error::ReleaseNotFound) => (
            None,
            "Kênh này chưa có bản phát hành. Bạn có thể kiểm tra lại sau.".into(),
        ),
        Err(_) => return Err(
            "Không kết nối được nguồn cập nhật. App vẫn dùng được; hãy kiểm tra mạng và thử lại."
                .into(),
        ),
    };
    if let Some(ref update) = update {
        validate_offer(update)?;
    }
    {
        let mut available = updates.available.lock().map_err(|_| "Cập nhật đang bận.")?;
        let same = update
            .as_ref()
            .zip(available.as_ref())
            .is_some_and(|(a, b)| {
                a.version == b.update.version && a.signature == b.update.signature
            });
        if !same {
            *available = update.map(package);
        }
    }
    {
        let mut config = updates.config.lock().map_err(|_| "Cập nhật đang bận.")?;
        let release = updates
            .available
            .lock()
            .map_err(|_| "Cập nhật đang bận.")?
            .as_ref()
            .map(|package| package.update.raw_json.clone());
        let next = Config {
            channel,
            checked_at: Some(now),
            release,
        };
        updates.persist(&next)?;
        *config = next;
    }
    updates.status(message)
}
fn download_verified(
    update: &Update,
    cancelled: &AtomicBool,
    mut emit: impl FnMut(Progress),
) -> Result<Vec<u8>, String> {
    validate_offer(update)?;
    let client = reqwest::blocking::Client::builder()
        .https_only(true)
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(300))
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() > 5
                || attempt.url().scheme() != "https"
                || !matches!(
                    attempt.url().host_str(),
                    Some(
                        "github.com"
                            | "release-assets.githubusercontent.com"
                            | "objects.githubusercontent.com"
                            | "github-releases.githubusercontent.com"
                    )
                )
            {
                attempt.error("Untrusted update redirect")
            } else {
                attempt.follow()
            }
        }))
        .build()
        .map_err(|_| "Không chuẩn bị được kết nối cập nhật.")?;
    let mut response = client
        .get(update.download_url.clone())
        .send()
        .and_then(|r| r.error_for_status())
        .map_err(|_| "Tải cập nhật thất bại; có thể thử lại.")?;
    let total = response.content_length();
    if total.is_some_and(|size| size > MAX_PACKAGE) {
        return Err("Gói cập nhật vượt giới hạn 64 MiB.".into());
    }
    let mut bytes = Vec::new();
    let mut buffer = [0u8; 64 * 1024];
    loop {
        if cancelled.load(Ordering::SeqCst) {
            return Err("Đã hủy tải cập nhật.".into());
        }
        let n = response
            .read(&mut buffer)
            .map_err(|_| "Tải cập nhật bị gián đoạn; có thể thử lại.")?;
        if n == 0 {
            break;
        }
        if bytes.len() as u64 + n as u64 > MAX_PACKAGE {
            return Err("Gói cập nhật vượt giới hạn 64 MiB.".into());
        }
        bytes.extend_from_slice(&buffer[..n]);
        emit(Progress {
            stage: "downloading",
            downloaded_bytes: bytes.len() as u64,
            total_bytes: total,
        });
    }
    if cancelled.load(Ordering::SeqCst) {
        return Err("Đã hủy tải cập nhật.".into());
    }
    emit(Progress {
        stage: "verifying",
        downloaded_bytes: bytes.len() as u64,
        total_bytes: total,
    });
    update.verify(&bytes).map_err(|_| {
        "Chữ ký hoặc phiên bản gói cập nhật không hợp lệ. Bản đang dùng được giữ nguyên."
    })?;
    Ok(bytes)
}
#[tauri::command]
pub async fn download_update(
    token: String,
    on_event: Channel<Progress>,
    updates: State<'_, Arc<Updates>>,
) -> Result<Status, String> {
    if !updates.supported() {
        return Err("Cập nhật chỉ có trong bản cài Windows.".into());
    }
    let updates = updates.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _operation = updates.begin()?;
        let update = {
            let available = updates.available.lock().map_err(|_| "Cập nhật đang bận.")?;
            let package = available
                .as_ref()
                .filter(|p| p.offer.token == token)
                .ok_or("Bản cập nhật đã thay đổi. Kiểm tra lại trước khi tải.")?;
            package.update.clone()
        };
        let bytes = download_verified(&update, &updates.cancel, |event| {
            let _ = on_event.send(event);
        })?;
        {
            let mut available = updates.available.lock().map_err(|_| "Cập nhật đang bận.")?;
            let package = available
                .as_mut()
                .filter(|p| p.offer.token == token)
                .ok_or("Bản cập nhật đã thay đổi.")?;
            package.bytes = Some(bytes);
            package.offer.downloaded = true;
        }
        updates.status("Đã tải và xác minh chữ ký. Bạn có thể cài khi sẵn sàng.")
    })
    .await
    .map_err(|_| "Tác vụ cập nhật bị dừng; hãy thử lại.".to_string())?
}
#[tauri::command]
pub fn cancel_update(updates: State<'_, Arc<Updates>>) {
    updates.cancel.store(true, Ordering::SeqCst);
}
#[tauri::command]
pub async fn install_update(
    token: String,
    engine: State<'_, Arc<Engine>>,
    updates: State<'_, Arc<Updates>>,
) -> Result<(), String> {
    let engine = engine.inner().clone();
    let updates = updates.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        if !updates.can_install() {return Err("Chỉ cài cập nhật từ bản NuvoKit đã cài bằng bộ cài. Phiên kiểm thử không thay đổi bản cài thật.".into());}
        let _operation=updates.begin()?;let _job=engine.maintenance()?;
        let _writes=updates.write_gate.lock().map_err(|_| "Dữ liệu đang bận.")?;
        let available=updates.available.lock().map_err(|_| "Cập nhật đang bận.")?;
        let package=available.as_ref().filter(|p|p.offer.token==token).ok_or("Bản cập nhật đã thay đổi. Kiểm tra lại.")?;
        let bytes=package.bytes.as_ref().ok_or("Tải và xác minh bản cập nhật trước khi cài.")?;
        package.update.verify(bytes).map_err(|_| "Chữ ký cập nhật không hợp lệ; chưa thay đổi app.")?;
        engine.store.snapshot_for_update()?;
        package.update.install(bytes).map_err(|_| "Không mở được trình cài cập nhật. Dữ liệu và bản đang dùng được giữ.".to_string())
    }).await.map_err(|_| "Chưa cài được cập nhật.".to_string())?
}
pub fn verify(app: tauri::AppHandle) {
    let local = std::env::args().any(|arg| arg == "--verify-update-local");
    tauri::async_runtime::spawn(async move {
        let result=async {
            let updater=builder(&app,UpdateChannel::Preview,true)?;
            let update=if local {
                let file=std::env::current_dir().map_err(|_|"Missing build root")?.join("output/windows-setup/latest.json");
                let raw=serde_json::from_slice(&fs::read(file).map_err(|_|"Missing local release metadata")?).map_err(|_|"Invalid metadata")?;
                updater.restore_update(raw).map_err(|e|format!("Invalid release: {e}"))?
            } else {updater.check().await.map_err(|e|format!("Update check failed: {e}"))?}.ok_or("Missing published update")?;
            validate_offer(&update)?;let version=update.version.clone();
            let count=tauri::async_runtime::spawn_blocking(move || {
                let bytes=if local {
                    let file=std::env::current_dir().map_err(|_|"Missing build root")?.join(format!("output/windows-setup/NuvoKit_{}_x64-update.exe",update.version));
                    let bytes=fs::read(file).map_err(|_|"Missing local update package")?;
                    update.verify(&bytes).map_err(|e|format!("Local signature check failed: {e}"))?;bytes
                } else {download_verified(&update,&AtomicBool::new(false),|_|{})?};
                let mut tampered=bytes.clone();if let Some(byte)=tampered.first_mut(){*byte^=1;}
                let mut relabeled=update.clone(); relabeled.version="999.0.0".into();
                if relabeled.verify(&bytes).is_ok(){return Err("Relabeled version accepted".to_string());}
                if update.verify(&tampered).is_ok(){return Err("Tampered update accepted".to_string());}
                Ok(bytes.len())
            }).await.map_err(|_|"Update verification worker failed")??;
            Ok::<_,String>(serde_json::json!({"updateVerificationPassed":true,"localPackage":local,"version":version,"bytes":count,"signatureAndVersionVerified":true,"tamperedPackageRejected":true,"relabeledVersionRejected":true,"installerExecuted":false,"actualUserDataModified":false}))
        }.await;
        match result {
            Ok(value) => {
                println!("{value}");
                app.exit(0);
            }
            Err(error) => {
                eprintln!("{error}");
                app.exit(1);
            }
        }
    });
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn release_url_binds_repository_version_and_nsis_asset() {
        let good="https://github.com/nguyen-hung-dev/nuvokit/releases/download/v0.1.4/NuvoKit_0.1.4_x64-update.exe";
        assert!(validate_release("0.1.4", good, "signature").is_ok());
        for bad in [
            good.replace("https:", "http:"),
            good.replace("github.com", "evil.test"),
            good.replace("nuvokit/releases", "other/releases"),
            format!("{good}?url=evil"),
            good.replace("update.exe", "setup.exe"),
        ] {
            assert!(validate_release("0.1.4", &bad, "signature").is_err());
        }
        assert!(validate_release("0.1.5", good, "signature").is_err());
        assert!(validate_release("0.1.4", good, "").is_err());
    }
    #[test]
    fn operations_serialize_and_release_guard() {
        let temp = tempfile::tempdir().unwrap();
        let updater = Updates::new(temp.path().into(), true).unwrap();
        let guard = updater.begin().unwrap();
        assert!(updater.begin().is_err());
        drop(guard);
        assert!(updater.begin().is_ok());
        assert!(!updater.can_install());
    }
    #[test]
    fn broken_cache_keeps_app_usable_and_falls_back_to_stable() {
        let temp = tempfile::tempdir().unwrap();
        fs::write(temp.path().join("update-state.json"), b"broken").unwrap();
        let updater = Updates::new(temp.path().into(), true).unwrap();
        assert_eq!(updater.status("").unwrap().channel, UpdateChannel::Stable);
        assert_eq!(
            fs::read(temp.path().join("update-state.json")).unwrap(),
            b"broken"
        );
    }
    #[test]
    fn checkpoint_rejects_active_clock_and_preserves_full_data() {
        let temp = tempfile::tempdir().unwrap();
        let store = crate::store::Store::new(temp.path()).unwrap();
        let mut clock = crate::clock::ClockState {
            status: "running".into(),
            started_at: Some(1000),
            session_started_at: Some(1000),
            session_id: Some("fixture".into()),
            ..Default::default()
        };
        store.save_clock(&clock, 0, None).unwrap();
        assert!(store.snapshot_for_update().is_err());
        assert!(!temp.path().join("backups").exists());
        clock.status = "finished".into();
        clock.started_at = None;
        store.save_clock(&clock, 1, None).unwrap();
        let file = store.snapshot_for_update().unwrap();
        let prior = backup::Bundle::read(&temp.path().join("backups").join(file)).unwrap();
        assert_eq!(prior.payload.clock.unwrap().state, clock);
    }
}
