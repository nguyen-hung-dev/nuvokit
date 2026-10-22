# Changelog

## Unreleased

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
