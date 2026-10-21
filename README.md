# NuvoKit

**Your apps. Your data. Your space.**

A personal workspace designed around installable mini-apps, shared visual themes,
connected data, and optional AI.

[Tiếng Việt](README.vi.md) · [Project documentation](docs/README.md)

## Status

**Planning and repository bootstrap — October 22, 2026.** This repository contains
project documentation and contribution templates. There is no runnable application,
installer, published SDK, or plugin marketplace yet.

The project name is confirmed. The technology stack, license, first release scope,
and delivery dates remain open decisions. The intended direction is open source;
an open-source license has not been selected or granted yet.

## Product direction

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
| [Architecture proposal](docs/architecture.md) | Core responsibilities and technical options |
| [Plugin model](docs/plugins.md) | Mini-app lifecycle, UI, data, and permissions |
| [50-module catalog](docs/module-catalog.md) | Long-term app ideas and proposed priorities |
| [Roadmap](docs/roadmap.md) | Validation stages and next deliverables |
| [Research](docs/research.md) | Related repositories and evidence limits |
| [Decisions](docs/decisions/README.md) | Confirmed decisions and proposal status |

The planning documents are currently written in Vietnamese. English translations
can follow once the initial product decisions are stable.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before changing
the repository. Small, concrete improvements to the product brief, documentation,
and research are useful during this phase.

No dependency installation, build command, or test command is defined yet.
Validation should match the change; documentation-only edits do not require app QA.

## License

The license is **not selected**. Do not assume a public repository alone grants
permission to reuse its contents. Record a license decision and add the complete
license text before an open-source release. See [open decisions](docs/decisions/README.md).
