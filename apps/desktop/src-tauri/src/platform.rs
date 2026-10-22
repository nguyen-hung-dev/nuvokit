use crate::model::*;
use std::{path::Path, time::Instant};
use sysinfo::{Disks, System};

pub fn scan(root: &Path, dependencies: Vec<Dependency>) -> EnvironmentReport {
    let start = Instant::now();
    let mut system = System::new();
    system.refresh_cpu_all();
    system.refresh_memory();
    let os_version = System::os_version().unwrap_or_default();
    let supported = windows_target_supported();
    let disks = Disks::new_with_refreshed_list();
    let available = disks
        .iter()
        .filter(|disk| root.starts_with(disk.mount_point()))
        .max_by_key(|disk| disk.mount_point().as_os_str().len())
        .map(|disk| disk.available_space());
    let (gpus, gpu_error) = graphics();
    EnvironmentReport {
        schema_version: 1,
        source: "desktop".into(),
        scanned_at: chrono::Utc::now().to_rfc3339(),
        scan_ms: start.elapsed().as_millis(),
        os: OsInfo {
            name: System::long_os_version().unwrap_or_else(|| "Windows".into()),
            version: os_version,
            arch: std::env::consts::ARCH.into(),
            supported,
        },
        cpu: CpuInfo {
            name: system
                .cpus()
                .first()
                .map(|cpu| cpu.brand().to_string())
                .unwrap_or_else(|| "Chưa xác định".into()),
            logical_cores: system.cpus().len(),
        },
        memory: MemoryInfo {
            total_bytes: system.total_memory(),
            available_bytes: system.available_memory(),
        },
        disk: DiskInfo {
            available_bytes: available,
        },
        gpus,
        gpu_error,
        dependencies,
    }
}

fn target_matches(build: Option<u32>, arch: &str, client: bool) -> bool {
    client && arch == "x86_64" && build.is_some_and(|build| build >= 22000)
}
#[cfg(windows)]
fn windows_target_supported() -> bool {
    use winreg::{enums::HKEY_LOCAL_MACHINE, RegKey};
    let key = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion");
    match key {
        Ok(key) => target_matches(
            key.get_value::<String, _>("CurrentBuildNumber")
                .ok()
                .and_then(|build| build.parse().ok()),
            std::env::consts::ARCH,
            key.get_value::<String, _>("InstallationType")
                .is_ok_and(|kind| kind == "Client"),
        ),
        Err(_) => false,
    }
}
#[cfg(not(windows))]
fn windows_target_supported() -> bool {
    false
}

#[cfg(windows)]
fn graphics() -> (Vec<GpuInfo>, Option<String>) {
    use windows::Win32::Graphics::Dxgi::{
        CreateDXGIFactory1, IDXGIFactory1, DXGI_ADAPTER_FLAG_SOFTWARE,
    };
    let factory = match unsafe { CreateDXGIFactory1::<IDXGIFactory1>() } {
        Ok(factory) => factory,
        Err(_) => {
            return (
                vec![],
                Some("Không đọc được danh sách GPU qua DXGI.".into()),
            )
        }
    };
    let mut gpus = vec![];
    let mut index = 0;
    while let Ok(adapter) = unsafe { factory.EnumAdapters1(index) } {
        if let Ok(info) = unsafe { adapter.GetDesc1() } {
            let end = info
                .Description
                .iter()
                .position(|ch| *ch == 0)
                .unwrap_or(info.Description.len());
            gpus.push(GpuInfo {
                name: String::from_utf16_lossy(&info.Description[..end]),
                dedicated_bytes: (info.DedicatedVideoMemory > 0)
                    .then_some(info.DedicatedVideoMemory as u64),
                software: info.Flags & DXGI_ADAPTER_FLAG_SOFTWARE.0 as u32 != 0,
            });
        }
        index += 1;
    }
    (gpus, None)
}
#[cfg(not(windows))]
fn graphics() -> (Vec<GpuInfo>, Option<String>) {
    (
        vec![],
        Some("Adapter phần cứng nền tảng này chưa triển khai.".into()),
    )
}

#[cfg(windows)]
pub fn webview_version() -> Option<String> {
    use winreg::{enums::*, RegKey};
    for hive in [HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER] {
        for path in [
            r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
            r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        ] {
            if let Ok(key) = RegKey::predef(hive).open_subkey(path) {
                if let Ok(version) = key.get_value::<String, _>("pv") {
                    if version != "0.0.0.0" {
                        return Some(version);
                    }
                }
            }
        }
    }
    None
}
#[cfg(not(windows))]
pub fn webview_version() -> Option<String> {
    None
}

#[cfg(test)]
mod tests {
    use super::target_matches;
    #[test]
    fn windows_target_uses_build_not_a_formatted_version_string() {
        assert!(target_matches(Some(22000), "x86_64", true));
        assert!(target_matches(Some(26220), "x86_64", true));
        assert!(!target_matches(Some(19045), "x86_64", true));
        assert!(!target_matches(Some(26220), "aarch64", true));
        assert!(!target_matches(Some(26220), "x86_64", false));
        assert!(!target_matches(None, "x86_64", true));
    }
}
