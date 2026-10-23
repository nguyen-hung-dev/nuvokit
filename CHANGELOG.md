# Changelog

## 0.1.4 — 2026-10-24 (Windows preview)

- Signed GitHub app updates with channel selection, progress/cancel, signature and
  signed-version verification, guarded install and data checkpoint.
- Add a protected developer source update command and a GitHub release workflow;
  keep private signing material outside Git and binaries in Release assets.
- Bundle a working Clock with focus/countdown/stopwatch, three switchable layouts,
  independent theme, pause/resume, finish confirmation and local session history.
- Persist Clock atomically in SQLite/IndexedDB with revision conflict protection;
  migrate SQLite to schema 3 with recovery, export backup format 2 including Clock
  and preserve Clock when restoring a legacy core-only backup.

- Approved main workspace and plugin-library UI with grid/detail view switching,
  search, category/sort controls, installed filter, light/dark and responsive layouts.
  Other plugin install/open/remove actions are explicitly session-only UI demonstrations.
- Accept package format/API v1; add a local plugin SDK workspace, closed manifest
  schema/validator, scoped client contracts and synthetic contract tests. External
  package loading, host enforcement and native plugin execution remain unimplemented.

## 0.1.3 — 2026-10-23 (Windows preview)

- Settings data panel: export validated `.nuvobak`, preview/confirm restore,
  storage groups, safe temporary-file cleanup and native folder/file dialogs.
- Back up all core preferences/history; create recovery snapshots before restore
  or schema 1 → 2 migration; use transactions and single-use restore approval.
- Isolate diagnostic/temporary profiles, including SQLite and WebView storage.
- Fix installed executable verification by capturing its SHA-256 during NSIS
  compilation, while Tauri applies the bundle marker.
- Verify the final installer in clean Windows Sandbox without developer tools:
  missing WebView2, real 0.1.2 upgrade, reinstall, renderer/data and uninstall;
  offline runtime failure preserves data. RAM target remains unmet.
- 23 Rust tests, 6 domain tests, 48 setup assertions and 4 NSIS fixture scenarios.

## 0.1.2 — 2026-10-23 (Windows preview)

- Keep the native Windows Apps/Control Panel uninstaller, with Vietnamese messages,
  an extra confirmation for permanent AppData deletion and explicit silent/update preservation.
- Record quiet-uninstall/help metadata and the installer language; verify registration
  and the uninstaller file before the outer wizard reports success.
- 48 setup assertions and four isolated NSIS cleanup/preservation scenarios; no
  real NuvoKit installation or user data removed during QA.
- Document the exact data scope and upgrade path for existing installations.
- Set TypeScript `noEmit` in the shared config so VS Code and CLI agree.

## 0.1.1 — 2026-10-23 (Windows preview)

- Native setup wizard matching approved image 1; Windows/path/disk checks,
  Microsoft WebView2 verification, embedded NSIS install, retry and post-install hashes.
- Single-file unsigned `.exe` prerelease, SHA-256 checksums and upstream notices.
- 43 setup assertions, existing core/native checks and explicit clean-machine QA limits.
- User `.exe` and developer source instructions; private vulnerability reporting enabled.

## 0.1.0 — internal prototype (not published)

### Added

- Initial repository configuration and contribution templates.
- Product brief, architecture and plugin proposals, a 50-module catalog, research,
  roadmap, and decision log.
- Accepted Windows-first core priority: environment checks, dependency installation,
  and hardware detection before mini-apps, with proposed completion criteria.
- Shared UI/domain architecture and platform boundaries; React/TypeScript +
  Tauri/Rust + SQLite accepted for internal Core v1, with future distribution notes.
- Windows Core v1 specification, runnable desktop/browser-preview scaffold, native
  hardware inventory, theme/settings/history, and managed optional data installation.
- Two generated D02 light/dark mockups, prompts, source mark, and review index.
- Frontend/native tests, redacted native IPC verification, actual performance
  evidence and explicit outstanding RAM/clean-machine checks.
- PowerShell instructions to build and install the Windows preview, and an
  accepted public-source publication policy that excludes local/private output.

0.1.0 was an internal build; 0.1.1 is the first public Windows prerelease.

### Design and documentation

- Separate `.exe` installation for users from source setup/build for developers.
- Windows installer/first-run specification and visual-review brief. New installer
  UI, hooks/configuration and release work await owner approval before implementation.
- Three independent installer environment-setup mockups with prompts and review notes.
- Record the owner's successful clone/build/install report separately from clean-machine QA.
