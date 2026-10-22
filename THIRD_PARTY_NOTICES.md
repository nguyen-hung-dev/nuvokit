# Third-party notices

NuvoKit itself has no selected license. This file records a separately licensed
optional dependency and does not grant a license to NuvoKit.

## Optional Vietnamese OCR language data

- Project: [Tesseract tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast).
- Source revision: `87416418657359cb625c412a48b6e1d6d41c29bd`.
- Asset: `vie.traineddata`; downloaded only when requested through the app.
- License: Apache License 2.0; [complete upstream text](apps/desktop/src-tauri/licenses/tessdata-fast-LICENSE.txt).
- The native dependency manager writes that license alongside the downloaded data.
- The package is language data, not an OCR engine. Downloading it does not provide
  an implemented OCR feature or establish compatibility with any future engine.

Node/Rust dependency versions and their upstream metadata are recorded in
`package-lock.json` and `apps/desktop/src-tauri/Cargo.lock`. Review all dependency
notices when changing dependencies. Preview installers include a generated
`THIRD_PARTY_LICENSES.txt` beside the application and includes it in Release assets.
The collector includes upstream source links and registry license texts; missing
crate-package texts are preserved with provenance/checksums in
`apps/windows-setup/upstream-licenses/`. No NuvoKit license is chosen by this process.

Native backup/restore file dialogs use `rfd` 0.17.2 (MIT); its upstream metadata
and license text are included by the same release collector.
