# Native Windows setup

WinForms/C# wizard matching the approved `windows-setup-wizard-light-v01` layout.
Windows 11 supplies .NET Framework 4.8 or newer; setup runs before WebView2 exists.
The main NuvoKit application stays in Tauri/Rust.

- `SetupCore.cs`: operation contracts, sequencing, cancellation and single-run guard.
- `WindowsOperations.cs`: Windows/path/disk checks, Microsoft HTTPS download and
  Authenticode verification, embedded NSIS extraction, process waits and file hashes.
- `Program.cs`: native wizard, progress, retry/location correction, details and launch.
- The payload uses Tauri's native NSIS uninstaller, registered with Windows Apps
  and Control Panel. `src-tauri/windows/` adds Vietnamese messages, a confirmation
  before explicit data deletion, and silent/update preservation guards.
- `Tests.cs`: compiled only into a separate QA executable; never into the release.
- `upstream-licenses/`: pinned license texts missing from registry crate packages,
  with source/checksum metadata. These do not license NuvoKit itself.

From repository root: `npm run setup:test` and `npm run desktop:bundle`.
After bundling, `npm run uninstall:test` exercises generated NSIS cleanup using
isolated synthetic files and a unique test registration; it never modifies the
real NuvoKit installation or AppData. It does not click destructive GUI dialogs.
The installer is `output/windows-setup/NuvoKit_0.1.3_x64-setup.exe`.
Do not distribute the raw NSIS payload from `target/` on its own.

The production executable accepts only normal GUI startup or read-only
`--diagnostics`. There are no simulation, bypass, arbitrary-download or test-install
arguments in the release. Tests use a fake backend for error/cancel/render states.
The QA-only integration helper installs/reinstalls/uninstalls and belongs in a
disposable Windows Sandbox, never a personal Windows profile.
The helper additionally requires the WDAG Sandbox username and
`NUVOKIT_SANDBOX_QA=1`; its output directory is separate from normal unit tests.
