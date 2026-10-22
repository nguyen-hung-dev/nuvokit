# NuvoKit

**Your apps. Your data. Your space.**

A personal workspace designed around installable mini-apps, shared visual themes,
connected data, and optional AI.

[Tiếng Việt](README.vi.md) · [Project documentation](docs/README.md)

## Status

**Windows preview 0.1.3 — October 23, 2026.** A React/TypeScript + Tauri/Rust
application now provides environment checks, hardware inventory, light/dark themes,
SQLite preferences/history, and a managed optional language-data download.
Browser mode is a clearly labelled design preview with synthetic hardware data.
Settings now includes local backup/restore, storage usage and managed temporary-file
cleanup; SQLite upgrades preserve a recovery snapshot before changing schema.
The Windows installer follows the approved wizard design. SDK and mini-app marketplace work remains planned.

The project name and Windows-first priority are confirmed. Work starts with the
core environment checker, dependency manager, and hardware detection before
mini-apps. The first core uses the stack documented in the architecture and
development guides. License, first mini-app release scope, and delivery dates
remain open decisions. The intended direction is open source;
an open-source license has not been selected or granted yet.

## Installation

### Users: install with an .exe

The preview targets **Windows 11 x64**. An installed build does not need Git,
Node.js/npm, Rust, or Visual Studio. No terminal commands are required.

**Download:** [NuvoKit 0.1.3 x64 Setup](https://github.com/nguyen-hung-dev/nuvokit/releases/download/v0.1.3/NuvoKit_0.1.3_x64-setup.exe) · [Release notes](https://github.com/nguyen-hung-dev/nuvokit/releases/tag/v0.1.3). This is an unsigned preview. The source-code ZIP is not an installer.

1. Obtain `NuvoKit_<version>_x64-setup.exe` from the project's release or owner.
2. Double-click it, choose the installation folder, and follow the setup wizard.
3. Allow setup to prepare Microsoft WebView2 if it is missing; this currently
   needs Internet access. The default install is for the current Windows user.
4. Open NuvoKit from the Start menu. Optional data packages can be added in the app.

The native wizard checks Windows, the installation folder and free space; prepares
WebView2 if needed; then installs and verifies NuvoKit. It shows named steps, real
download progress when available, and a waiting indicator during external installers.
Read the [user guide](docs/installation.md) and [verification limits](docs/verification/core-data-0.1.3.md).

Use **Settings → Dữ liệu & sao lưu** to save a `.nuvobak` file or preview a restore.
Backups contain settings and all task history, are not encrypted, and exclude
downloadable packages/cache. Restore and schema upgrades create recovery files first.

To uninstall, use **Windows Settings → Apps → Installed apps → NuvoKit → Uninstall**
or **Control Panel → Programs and Features**. The native uninstaller keeps data by
default. Select **Delete the application data** to remove this user's NuvoKit
settings, history, downloaded packages and cache, then confirm the warning.
Shared WebView2 and exported files outside AppData are kept. Install this version
over an older build to update its uninstaller while preserving existing data.

### Developers: run and build from source

Install Git, Node.js 22.12+ with npm, Rust 1.95+ with the MSVC x64 toolchain, Visual
Studio Build Tools with Desktop development with C++ and a Windows SDK, and
Microsoft WebView2 Runtime. See [development prerequisites](docs/development.md#công-cụ-phát-triển).

```powershell
git clone https://github.com/nguyen-hung-dev/nuvokit.git
cd nuvokit
npm ci
npm run desktop
```

To build a local Windows installer, run:

```powershell
npm run desktop:bundle
```

Wait for the build to succeed before opening the installer:

```powershell
Start-Process -FilePath ".\output\windows-setup\NuvoKit_0.1.3_x64-setup.exe" -Wait
```

The filename reflects the current version, `0.1.3`. Clone and build output stay in
the chosen repository folder; development caches and app data may use the user
profile. Source checkouts share app data when they use the same app identifier.
For a browser preview with synthetic data, run `npm run dev` and open
`http://127.0.0.1:1420/`. More commands are in [development](docs/development.md).

## Product direction

- Start on Windows; prepare shared UI and platform boundaries for macOS and web,
  with Microsoft Store as a future Windows distribution channel.
- Install the apps you need: reading, timers, tasks, finance, and other utilities.
- Use complete mini-apps with consistent controls, themes, history, and data export.
- Connect workflows through explicit data contracts and permissions.
- Keep ordinary features usable without a GPU or paid AI service.
- Let an optional assistant query permitted data and prepare reviewable changes.

A proposed first workflow is **choose a book → start a timer → record the reading
session and progress → review the week**. Tasks would serve as a third example app
to validate reuse of the timer. This MVP sequence is proposed, not approved.

## Start here

| Document | Purpose |
| --- | --- |
| [Product brief](docs/product.md) | Goals, intended experience, and open questions |
| [Architecture](docs/architecture.md) | Accepted core stack, platform boundaries, and proposed extensions |
| [Plugin model](docs/plugins.md) | Mini-app lifecycle, UI, data, and permissions |
| [50-module catalog](docs/module-catalog.md) | Long-term app ideas and proposed priorities |
| [Roadmap](docs/roadmap.md) | Validation stages and next deliverables |
| [Design workspace](design/README.md) | UI briefs, image-generation prompts, and mockups |
| [Core v1 specification](docs/specs/core-v1.md) | Scope, data contracts, acceptance checks, and limits |
| [Development](docs/development.md) | Actual setup, build, test, and native verification commands |
| [Research](docs/research.md) | Related repositories and evidence limits |
| [Decisions](docs/decisions/README.md) | Confirmed decisions and proposal status |

The planning documents are currently written in Vietnamese. English translations
can follow once the initial product decisions are stable.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before changing
the repository. Small, concrete improvements to the product brief, documentation,
and research are useful during this phase.

On a Windows development machine with the documented prerequisites, run `npm ci`
then `npm run desktop`. For the synthetic browser preview, use `npm run dev`.
See [development](docs/development.md) for build/test commands and the current
[verification scope](docs/verification/README.md). Documentation-only edits do not
require full application QA.

## License

The license is **not selected**. Do not assume a public repository alone grants
permission to reuse its contents. Record a license decision and add the complete
license text before an open-source release. See [open decisions](docs/decisions/README.md).
