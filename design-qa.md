# Clock — visual and interaction QA

- Date: 2026-10-23; unreleased source after 0.1.3.
- Targets: `design/mockups/windows-clock-focus-light-v01.png`,
  `windows-clock-session-light-v01.png`, `windows-clock-countdown-dark-v01.png`.
  All three explicitly approved by the owner; decision 0010.
- Implementation: http://127.0.0.1:1423/ → Đồng hồ; bundled trusted module.
- final result: passed

Previous report: [plugin library design QA](docs/verification/plugin-library-design-qa.md).

## Evidence and normalization

Opened all three source images and browser-rendered implementations, then compared
combined image pairs and focused crops. Chrome was the available browser; used an
isolated localhost origin for synthetic Clock sessions. Native user AppData was
not opened/migrated for QA. Browser overrides were reset after captures.

Reference pixels: 1505×1045 each. CSS viewport 1505×1045, devicePixelRatio 1.
Full-page implementation captures: minimal 1490×1178, session 1505×1045, digital
1490×1157. A 15-pixel scrollbar explains the narrower captures. Pair comparisons
crop the long real history at y=1045 and pad the scrollbar edge; no stretching.
The source titlebar is illustrative; the implementation retains the actual app
header, existing brand SVG and system navigation. Real elapsed time/history differ
from the illustrative source: active session capture 22:04, not fake 18:42;
source's two seeded records are not inserted into user profiles.

Local evidence under ignored `output/clock-qa/`:

| State | Implementation | Combined comparison | Focused comparison |
| --- | --- | --- | --- |
| Focus idle 25:00, light | minimal-light-final.png | compare-minimal-final.png | focus-minimal-final.png |
| Focus running, light, session layout | session-light-full.png | compare-session-final.png | focus-session-final.png |
| Countdown idle 00:10:00, dark | digital-dark-final.png | compare-digital-final.png | focus-digital-final.png |

Additional captures: settings-final.png, settings-390.png, digital-1024.png.
These QA outputs are local evidence, not versioned product assets; regenerate
when reviewing elsewhere. Authored reference mockups remain in design/mockups/.

## Findings and fixes

- [P2, fixed] Minimal layout initially put the name below the timer and delayed
  history below the reference position. Moved name above the face, used a neutral
  idle ring, enlarged tabular digits and compacted vertical spacing/history.
  Final face top 372.7 px (source about 371), history top 856 px (source about 840).
  Evidence: compare-minimal.png → compare-minimal-final.png.
- [P2, fixed] Digital form initially exposed name/note fields between timing and
  primary action. Moved optional metadata into a collapsed details control;
  increased numeric size, used padded HH/MM/SS and dark lavender primary CTA.
  Evidence: compare-digital.png → compare-digital-final.png.
- [P2, fixed] Indented Clock navigation overflowed the icon rail at 390 px.
  Reset indentation below 900 px. Measured rail item x=5..54 within the 58 px rail;
  document scrollWidth 375 <= viewport 390. Settings icon has an explicit name.
- [P2, fixed] A global theme button could appear ineffective with a forced Clock
  theme. It now changes the visible Clock theme while on Clock, preserves the app
  theme on other pages, and labels the effective action correctly.
- [P2, fixed] Cross-window conflict could leave only an ineffective retry.
  Added explicit read-stored confirmation; cancel preserves pending changes.
  Tested two tabs: stale writer blocked, stored revision retained, confirmed
  reload restores usable controls without dropping any stored history.

No remaining actionable P0/P1/P2 visual or interaction findings in the tested scope.

## Required fidelity surfaces

- Fonts/typography: Windows Segoe UI Variable/Segoe UI and platform fallback;
  readable Vietnamese, tabular digits, no stylized ambiguous generated zeros.
  Minimal digits 78 px, session 85 px, wide digital up to 140 px. Labels, headers,
  weight and wrapping inspected in focused crops; controls use the existing kit.
- Spacing/layout: centered minimal composition, split session and large digital
  two-column composition retained. Responsive stack at <=900 px; checked 1505,
  1024 and 390 widths. No horizontal document overflow or hidden primary action.
  Longer actual history can scroll vertically.
- Colors/tokens: light neutral surfaces/purple; dark neutral surfaces/lavender.
  Scoped Clock theme does not alter the other pages. Focus, selection, disabled,
  loading/error and modal backdrop use shared tokens.
- Images/assets: reused the supplied NuvoKit SVG and existing Lucide library.
  No raster image assets occur in the Clock content. The timer's data-driven ring
  uses Lucide Circle as a functional progress visualization; no generated artwork
  or decorative asset was approximated with handcrafted SVG/CSS drawings.
- Copy/content: title, modes, presets and CTAs match the approved intent. Added
  explicit settings, empty/history/save/conflict states; all session metadata is
  synthetic QA input or user input. No claims of reading Books/Tasks data.

## Interaction/accessibility checks

- Open from sidebar and home card; open Clock settings from global Settings.
- All layout/theme radios, immediate application without resetting the session.
- Focus/countdown/stopwatch; pause holds elapsed time, resume excludes pause;
  running timer survives page reload/navigation; paused timer survives reload.
- One-second countdown completes exactly once, history retained after reload;
  finish confirmation, mode/duration guards, history view and numeric input bounds.
- Forced theme and app theme behavior; native dialog focus, Escape, labeled
  compact settings button, selected/disabled controls and mobile stacking.
- Two-window revision conflict, explicit recovery and no stored-history loss.
- Browser error/warning log checked after final interactions: empty.

## Follow-up polish and scope

[P3] Source mock typography, wording and decorative titlebar differ slightly;
retain actual brand, shared controls, honest elapsed time and real history.
The mock's Books/Tasks icons are illustrative; generic history icons avoid implying
cross-plugin integration. The digital optional metadata disclosure is an intentional
addition. No audible alarm, OS notification or wake timer is claimed.

Native IPC/data checks and resource limitation are recorded separately in
[Clock verification](docs/verification/clock-v1.md). This visual pass does not mark
Windows memory budgets, Store/macOS compatibility or external plugin isolation as
passed. No installer release, commit or push was performed in this task.
