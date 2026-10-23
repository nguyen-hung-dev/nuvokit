# Isolated QA fixtures

Plugin-library UI uses a labelled in-memory demonstration catalogue in the normal
app. `npm test` covers SDK/manifest/catalog contracts; interaction/visual evidence
is recorded in `docs/verification/plugin-ui-sdk-v1.md` and root `design-qa.md`.
Install/remove there never invoke the native installer or load external code.

- `data-settings.html` / `.tsx`: browser-only synthetic adapter for the production
  Settings UI. No native commands or real files. Open through the Vite dev server
  using `/@fs/<absolute-repo-path>/qa/data-settings.html`; use a separate QA port if
  the normal dev server is in use. This entry is not included in the app bundle.
- `windows-sandbox-worker.ps1`: WDAG-only guest worker. Checks absence of development
  commands, installs/upgrades/reinstalls, exercises native data and renderer IPC,
  then uninstalls while preserving a synthetic data marker.
- `windows-previous-release.json`: exact prior public installer URL/SHA-256. The
  host verifies and extracts its NSIS resource without installing it; only the
  disposable guest executes the old payload for upgrade QA.

Build first: `npm run desktop:bundle`. Then run `npm run windows:qa` (online) or
`npm run windows:qa:offline`. Automation needs Windows Sandbox and its `wsb` CLI
(Windows 11 24H2+ QA host); app users do not need these tools.

The runner creates one unique Sandbox ID and stops only that ID after the report.
It refuses to stop/reuse an unrelated existing Sandbox. Only a read-only input
folder and this run's writable result folder are shared; source/private vaults
are not mapped. Clipboard/audio/video/printer sharing and vGPU are disabled.
Reports require a matching run ID; missing/timeout/failed results never count as
passes. `node scripts/run-windows-sandbox.mjs online prepare` only creates input/config.

Runtime files, snapshots, captured binaries and results stay in ignored `output/`.
Never install/uninstall the real host NuvoKit or delete its AppData for QA.

Update UI fixture: `/@fs/E:/product/nuvokit/qa/updates.html` on the local Vite server.
Uses synthetic metadata/download/signature failures, busy/Clock guards and a fake
install counter; it never downloads software or invokes native commands.
