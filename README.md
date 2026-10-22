# NuvoKit

**Your apps. Your data. Your space.**

A personal workspace designed around installable mini-apps, shared visual themes,
connected data, and optional AI.

[Tiếng Việt](README.vi.md) · [Project documentation](docs/README.md)

## Status

**Internal Windows Core v1 — October 22, 2026.** A React/TypeScript + Tauri/Rust
application now provides environment checks, hardware inventory, light/dark themes,
SQLite preferences/history, and a managed optional language-data download.
Browser mode is a clearly labelled design preview with synthetic hardware data.
There is no released product, published SDK, or plugin marketplace yet.

The project name and Windows-first priority are confirmed. Work starts with the
core environment checker, dependency manager, and hardware detection before
mini-apps. The first core uses the stack documented in the architecture and
development guides. License, first mini-app release scope, and delivery dates
remain open decisions. The intended direction is open source;
an open-source license has not been selected or granted yet.

## Install on Windows

The current preview targets **Windows 11 x64**. There is no downloadable release
yet; build the installer from source using PowerShell. Install Git, Node.js 22.12+
with npm, Rust 1.95+ with the MSVC x64 toolchain, Visual Studio Build Tools with
Desktop development with C++ and a Windows SDK, and Microsoft WebView2 Runtime
first. See [development prerequisites](docs/development.md#công-cụ-phát-triển).

```powershell
git clone https://github.com/nguyen-hung-dev/nuvokit.git
cd nuvokit
npm ci
npm run desktop:bundle
```

After the build succeeds, launch the generated installer and follow its prompts:

```powershell
Start-Process -FilePath ".\apps\desktop\src-tauri\target\release\bundle\nsis\NuvoKit_0.1.0_x64-setup.exe" -Wait
```

The local installer is unsigned and installs for the current Windows user.
The installed app does not need Node.js, Rust, or Visual Studio. If WebView2 is
missing, the installer needs Internet access to download its bootstrapper.
This is an experimental core; clean-machine installation and the RAM target
remain unverified or unmet. See [verification](docs/verification/core-v1-windows.md).

For development, use `npm run desktop` after `npm ci`. To view the shared UI with
synthetic data in a browser, use `npm run dev` and open `http://127.0.0.1:1420/`.

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
