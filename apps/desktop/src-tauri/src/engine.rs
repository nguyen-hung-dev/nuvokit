use crate::{model::*, platform, store::Store};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

pub const PACKAGE_ID: &str = "ocr-vie-fast";
pub const PACKAGE_URL: &str = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/87416418657359cb625c412a48b6e1d6d41c29bd/vie.traineddata";
pub const PACKAGE_BYTES: u64 = 531275;
pub const PACKAGE_HASH: &str = "79df64caf7bcfb2a27df5042ecb6121e196eada34da774956995747636d5bfa1";

pub struct Engine {
    pub root: PathBuf,
    pub store: Store,
    active: Mutex<Option<Arc<AtomicBool>>>,
}
impl Engine {
    pub fn new(root: PathBuf) -> Result<Self, String> {
        let store = Store::new(&root)?;
        let engine = Self {
            root,
            store,
            active: Mutex::new(None),
        };
        let target = engine.package_path();
        let backup = target.with_extension("previous");
        if !target.exists() && backup.exists() {
            fs::rename(&backup, &target).map_err(|_| "Không phục hồi được gói trước đó.")?;
        }
        let part = target.with_extension("part");
        if part.exists() {
            fs::remove_file(part).map_err(|_| "Không dọn được lượt cài bị gián đoạn.")?;
        }
        Ok(engine)
    }
    pub fn package_path(&self) -> PathBuf {
        self.root
            .join("dependencies")
            .join(PACKAGE_ID)
            .join("vie.traineddata")
    }
    pub fn scan(&self) -> EnvironmentReport {
        let version = platform::webview_version();
        let valid = verify_file(&self.package_path(), PACKAGE_HASH, PACKAGE_BYTES).unwrap_or(false);
        let installed = self.package_path().exists();
        let dependencies = vec![
            Dependency {
                id: "webview2".into(),
                name: "WebView2".into(),
                description: "Thành phần hiển thị giao diện ứng dụng.".into(),
                status: if version.is_some() {
                    "ready"
                } else {
                    "unknown"
                }
                .into(),
                version,
                required: true,
                installable: false,
                bytes: None,
                source: Some("Microsoft".into()),
                license: None,
            },
            Dependency {
                id: "sqlite".into(),
                name: "Lưu trữ cục bộ".into(),
                description: "SQLite tích hợp · lưu cài đặt và lịch sử tác vụ.".into(),
                version: Some(rusqlite::version().into()),
                status: if self.store.preferences().is_ok() {
                    "ready"
                } else {
                    "error"
                }
                .into(),
                required: true,
                installable: false,
                bytes: None,
                source: None,
                license: None,
            },
            Dependency {
                id: PACKAGE_ID.into(),
                name: "Dữ liệu OCR tiếng Việt".into(),
                description: "Tùy chọn · chỉ là dữ liệu ngôn ngữ, chưa có engine OCR.".into(),
                version: Some("tessdata_fast · 8741641".into()),
                status: if valid {
                    "ready"
                } else if installed {
                    "error"
                } else {
                    "missing"
                }
                .into(),
                required: false,
                installable: true,
                bytes: Some(PACKAGE_BYTES),
                source: Some(PACKAGE_URL.into()),
                license: Some("Apache-2.0".into()),
            },
        ];
        platform::scan(&self.root, dependencies)
    }
    pub fn reserve(&self, package_id: &str) -> Result<Arc<AtomicBool>, String> {
        if package_id != PACKAGE_ID {
            return Err("Thành phần không nằm trong danh mục được phép cài.".into());
        }
        let mut active = self
            .active
            .lock()
            .map_err(|_| "Không đọc được trạng thái tác vụ.")?;
        if active.is_some() {
            return Err("Đang có một tác vụ cài đặt. Vui lòng chờ hoặc hủy.".into());
        }
        let flag = Arc::new(AtomicBool::new(false));
        *active = Some(flag.clone());
        Ok(flag)
    }
    pub fn cancel(&self) -> Result<(), String> {
        if let Some(flag) = self
            .active
            .lock()
            .map_err(|_| "Không đọc được trạng thái tác vụ.")?
            .as_ref()
        {
            flag.store(true, Ordering::SeqCst);
        }
        Ok(())
    }
    pub fn release(&self) {
        if let Ok(mut active) = self.active.lock() {
            *active = None;
        }
    }
    pub fn install(
        &self,
        cancelled: Arc<AtomicBool>,
        mut emit: impl FnMut(JobProgress),
    ) -> Result<(), String> {
        let id = chrono::Utc::now()
            .timestamp_nanos_opt()
            .unwrap_or_default()
            .to_string();
        let mut progress = |stage: &str, percent: f64, downloaded: u64, message: &str| {
            emit(JobProgress {
                id: id.clone(),
                package_id: PACKAGE_ID.into(),
                stage: stage.into(),
                percent,
                downloaded_bytes: downloaded,
                total_bytes: PACKAGE_BYTES,
                message: message.into(),
            })
        };
        let target = self.package_path();
        let result = (|| {
            if verify_file(&target, PACKAGE_HASH, PACKAGE_BYTES).unwrap_or(false) {
                return Ok(());
            }
            progress(
                "downloading",
                0.0,
                0,
                "Đang kết nối tới nguồn Tesseract chính chủ…",
            );
            fs::create_dir_all(target.parent().ok_or("Đường dẫn gói không hợp lệ.")?)
                .map_err(|_| "Không tạo được thư mục thành phần.")?;
            let client = reqwest::blocking::Client::builder()
                .connect_timeout(Duration::from_secs(10))
                .timeout(Duration::from_secs(30))
                .https_only(true)
                .redirect(reqwest::redirect::Policy::none())
                .build()
                .map_err(|_| "Không khởi tạo được kết nối tải gói.")?;
            let mut response = client
                .get(PACKAGE_URL)
                .send()
                .and_then(|response| response.error_for_status())
                .map_err(|_| "Không tải được gói. Kiểm tra mạng và thử lại.")?;
            if response
                .content_length()
                .is_some_and(|size| size != PACKAGE_BYTES)
            {
                return Err("Dung lượng nguồn không khớp danh mục; đã dừng cài.".into());
            }
            let part = target.with_extension("part");
            let transfer = stage_download(
                &mut response,
                &part,
                PACKAGE_BYTES,
                PACKAGE_HASH,
                &cancelled,
                |count| {
                    progress(
                        "downloading",
                        count as f64 / PACKAGE_BYTES as f64 * 90.0,
                        count,
                        "Đang tải dữ liệu OCR tiếng Việt…",
                    )
                },
            );
            if let Err(error) = transfer {
                let _ = fs::remove_file(&part);
                return Err(error);
            }
            progress(
                "verifying",
                94.0,
                PACKAGE_BYTES,
                "SHA-256 hợp lệ. Đang chuẩn bị gói…",
            );
            if cancelled.load(Ordering::SeqCst) {
                let _ = fs::remove_file(&part);
                return Err("Đã hủy tác vụ cài đặt.".into());
            }
            fs::write(
                target.parent().unwrap().join("LICENSE.txt"),
                include_str!("../licenses/tessdata-fast-LICENSE.txt"),
            )
            .map_err(|_| "Không lưu được giấy phép của thành phần.")?;
            progress(
                "installing",
                98.0,
                PACKAGE_BYTES,
                "Đang hoàn tất trong vùng dữ liệu app…",
            );
            promote(&part, &target)?;
            Ok(())
        })();
        let (status, message) = match &result {
            Ok(()) => (
                "completed",
                "Đã cài và kiểm tra SHA-256. Engine OCR chưa được triển khai.",
            ),
            Err(error) if cancelled.load(Ordering::SeqCst) => ("cancelled", error.as_str()),
            Err(error) => ("failed", error.as_str()),
        };
        let _ = fs::remove_file(target.with_extension("part"));
        self.store.record(&id, PACKAGE_ID, status)?;
        progress(
            status,
            if result.is_ok() { 100.0 } else { 0.0 },
            if result.is_ok() { PACKAGE_BYTES } else { 0 },
            message,
        );
        result
    }
}

pub fn verify_file(path: &Path, expected_hash: &str, expected_bytes: u64) -> Result<bool, String> {
    if !path.exists() {
        return Ok(false);
    }
    let mut file = File::open(path).map_err(|_| "Không đọc được thành phần đã cài.")?;
    if file
        .metadata()
        .map_err(|_| "Không đọc được dung lượng gói.")?
        .len()
        != expected_bytes
    {
        return Ok(false);
    }
    let mut hash = Sha256::new();
    let mut buffer = [0u8; 16384];
    loop {
        let count = file
            .read(&mut buffer)
            .map_err(|_| "Không kiểm tra được gói đã cài.")?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    Ok(format!("{:x}", hash.finalize()) == expected_hash)
}
fn stage_download(
    reader: &mut impl Read,
    part: &Path,
    expected_bytes: u64,
    expected_hash: &str,
    cancelled: &AtomicBool,
    mut progress: impl FnMut(u64),
) -> Result<(), String> {
    let mut file = File::create(part)
        .map_err(|_| "Không ghi được tệp tải về. Kiểm tra quyền và dung lượng.")?;
    let mut hash = Sha256::new();
    let mut total = 0u64;
    let mut buffer = [0u8; 16384];
    loop {
        if cancelled.load(Ordering::SeqCst) {
            return Err("Đã hủy tác vụ cài đặt.".into());
        }
        let count = reader
            .read(&mut buffer)
            .map_err(|_| "Tải gói bị gián đoạn. Có thể thử lại.")?;
        if count == 0 {
            break;
        }
        total += count as u64;
        if total > expected_bytes {
            return Err("Gói tải về vượt dung lượng cho phép.".into());
        }
        file.write_all(&buffer[..count])
            .map_err(|_| "Không ghi được dữ liệu tải về.")?;
        hash.update(&buffer[..count]);
        progress(total);
    }
    file.sync_all().map_err(|_| "Không lưu được gói tải về.")?;
    if total != expected_bytes || format!("{:x}", hash.finalize()) != expected_hash {
        return Err("Gói không khớp SHA-256/dung lượng. Bản đang dùng được giữ nguyên.".into());
    }
    Ok(())
}
fn promote(part: &Path, target: &Path) -> Result<(), String> {
    let backup = target.with_extension("previous");
    if target.exists() {
        if backup.exists() {
            fs::remove_file(&backup).map_err(|_| "Không chuẩn bị được bản phục hồi.")?;
        }
        fs::rename(target, &backup).map_err(|_| "Không giữ được bản trước khi cập nhật.")?;
    }
    if fs::rename(part, target).is_err() {
        if backup.exists() {
            let _ = fs::rename(&backup, target);
        }
        return Err("Không hoàn tất được cài đặt; đã thử phục hồi bản trước.".into());
    }
    if backup.exists() {
        let _ = fs::remove_file(backup);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn valid_transfer_promotes_only_after_verification() {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join("pack");
        let part = target.with_extension("part");
        let expected = format!("{:x}", Sha256::digest(b"abc"));
        fs::write(&target, b"old").unwrap();
        let mut counts = vec![];
        stage_download(
            &mut &b"abc"[..],
            &part,
            3,
            &expected,
            &AtomicBool::new(false),
            |count| counts.push(count),
        )
        .unwrap();
        assert_eq!(fs::read(&target).unwrap(), b"old");
        promote(&part, &target).unwrap();
        assert!(verify_file(&target, &expected, 3).unwrap());
        assert_eq!(counts.last(), Some(&3));
        assert!(!target.with_extension("previous").exists());
    }
    #[test]
    fn promotion_failure_restores_the_previous_target() {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join("pack");
        fs::write(&target, b"old").unwrap();
        assert!(promote(&dir.path().join("missing.part"), &target).is_err());
        assert_eq!(fs::read(target).unwrap(), b"old");
    }
    #[test]
    fn interrupted_reader_and_unwritable_destination_are_rejected() {
        struct Broken;
        impl Read for Broken {
            fn read(&mut self, _: &mut [u8]) -> std::io::Result<usize> {
                Err(std::io::Error::other("network interrupted"))
            }
        }
        let dir = tempfile::tempdir().unwrap();
        assert!(stage_download(
            &mut Broken,
            &dir.path().join("pack.part"),
            3,
            PACKAGE_HASH,
            &AtomicBool::new(false),
            |_| {}
        )
        .is_err());
        assert!(stage_download(
            &mut &b"abc"[..],
            dir.path(),
            3,
            PACKAGE_HASH,
            &AtomicBool::new(false),
            |_| {}
        )
        .is_err());
    }
    #[test]
    fn invalid_download_cannot_replace_existing_package() {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join("pack");
        let part = target.with_extension("part");
        fs::write(&target, b"working").unwrap();
        assert!(stage_download(
            &mut &b"bad"[..],
            &part,
            3,
            PACKAGE_HASH,
            &AtomicBool::new(false),
            |_| {}
        )
        .is_err());
        assert_eq!(fs::read(target).unwrap(), b"working");
    }
    #[test]
    fn cancel_is_terminal_and_oversized_download_is_rejected() {
        let dir = tempfile::tempdir().unwrap();
        let part = dir.path().join("pack.part");
        assert!(stage_download(
            &mut &b"abc"[..],
            &part,
            3,
            PACKAGE_HASH,
            &AtomicBool::new(true),
            |_| {}
        )
        .unwrap_err()
        .contains("hủy"));
        assert!(stage_download(
            &mut &b"abc"[..],
            &part,
            2,
            PACKAGE_HASH,
            &AtomicBool::new(false),
            |_| {}
        )
        .is_err());
    }
    #[test]
    fn fixed_catalog_and_single_job_guard() {
        let dir = tempfile::tempdir().unwrap();
        let engine = Engine::new(dir.path().to_path_buf()).unwrap();
        assert!(engine.reserve("../../arbitrary").is_err());
        let token = engine.reserve(PACKAGE_ID).unwrap();
        assert!(engine.reserve(PACKAGE_ID).is_err());
        engine.cancel().unwrap();
        assert!(token.load(Ordering::SeqCst));
        engine.release();
        assert!(engine.reserve(PACKAGE_ID).is_ok());
    }
    #[test]
    fn interrupted_promotion_recovers_previous_package() {
        let dir = tempfile::tempdir().unwrap();
        let engine = Engine::new(dir.path().to_path_buf()).unwrap();
        let target = engine.package_path();
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        fs::write(target.with_extension("previous"), b"working").unwrap();
        fs::write(target.with_extension("part"), b"partial").unwrap();
        let reopened = Engine::new(dir.path().to_path_buf()).unwrap();
        assert_eq!(fs::read(reopened.package_path()).unwrap(), b"working");
        assert!(!target.with_extension("part").exists());
    }
}
