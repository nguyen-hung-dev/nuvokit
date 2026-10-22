use serde::Deserialize;
use std::{
    collections::HashSet,
    sync::atomic::{AtomicBool, AtomicU64, Ordering},
    time::{Duration, Instant},
};
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, RefreshKind, System};

pub struct Runtime {
    pub verify: bool,
    pub started: Instant,
    pub ready_ms: AtomicU64,
    pub completed: AtomicBool,
    pub baseline_passed: AtomicBool,
}
impl Runtime {
    pub fn new(verify: bool) -> Self {
        Self {
            verify,
            started: Instant::now(),
            ready_ms: AtomicU64::new(0),
            completed: AtomicBool::new(false),
            baseline_passed: AtomicBool::new(false),
        }
    }
    pub fn ready(&self) {
        let _ = self.ready_ms.compare_exchange(
            0,
            self.started.elapsed().as_millis() as u64,
            Ordering::SeqCst,
            Ordering::SeqCst,
        );
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RendererResult {
    pub phase: String,
    pub gpu_status: String,
    pub channel_events: u32,
    pub theme_persistence: bool,
}

fn descendants(system: &System) -> HashSet<Pid> {
    let mut owned = HashSet::from([Pid::from_u32(std::process::id())]);
    loop {
        let mut added = false;
        for (pid, process) in system.processes() {
            if process
                .parent()
                .is_some_and(|parent| owned.contains(&parent))
                && owned.insert(*pid)
            {
                added = true;
            }
        }
        if !added {
            return owned;
        }
    }
}
pub fn measure_resources() -> (f64, f64) {
    std::thread::sleep(Duration::from_secs(30));
    // Measure only memory and CPU; avoid collecting command lines, environment,
    // executable paths and users for unrelated processes as part of the probe.
    let refresh = ProcessRefreshKind::nothing().with_cpu().with_memory();
    let mut system = System::new_with_specifics(RefreshKind::nothing().with_processes(refresh));
    std::thread::sleep(Duration::from_secs(5));
    system.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh);
    let owned = descendants(&system);
    let memory: u64 = owned
        .iter()
        .filter_map(|pid| system.process(*pid))
        .map(|process| process.memory())
        .sum();
    let cpu: f64 = owned
        .iter()
        .filter_map(|pid| system.process(*pid))
        .map(|process| f64::from(process.cpu_usage()))
        .sum::<f64>()
        / std::thread::available_parallelism()
            .map(|count| count.get())
            .unwrap_or(1) as f64;
    (memory as f64 / 1024.0 / 1024.0, cpu)
}
