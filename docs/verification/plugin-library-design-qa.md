# Plugin workspace — visual and interaction QA

- Date: 2026-10-23; unreleased source after 0.1.3.
- Targets: design/mockups/windows-app-home-light-v01.png,
  windows-plugin-library-grid-light-v01.png,
  windows-plugin-library-details-light-v01.png (all three owner-approved).
- Scope: workspace and library UI demonstration, not an external plugin runtime.
- final result: passed

Previous report preserved at [Windows setup design QA](windows-setup-design-qa.md).

## Evidence and normalization

Opened all source images and actual browser renders, then inspected combined
side-by-side comparisons. Chrome QA tab was used after in-app browser reported
unavailable; no personal browsing tab or native user data used.

Source images: 1505×1045 px. CSS viewport: 1505×1045. Grid capture: 1505×1045;
home/detail screenshot API returned 1490×1035, uniformly fit/padded to 1505×1045
for comparison. Originals unchanged; no nonuniform stretching. State: light,
six synthetic entries, three initially installed, Lịch selected in details.

Evidence under ignored output/plugin-ui/:

- Renders: home-light.png, grid-light.png, details-light.png.
- Full-view paired comparisons: compare-home.png, compare-grid.png, compare-details.png.
- Focused icon/type/action comparison: compare-grid-focus.png.
- Additional states: details-dark.png, details-dark-1024.png, grid-dark-390.png.
- Initial evidence: home-before-spacing-fix.png, details-before-layout-fix.png.

Resize captures were retaken after compositor settling. An initial stale/miniaturized
screenshot was not accepted as responsive proof; DOM dimensions and later captures
were checked together.

## Findings and comparison history

1. Resolved P1: base shell CSS overrode the intended wider plugin sidebar.
   Scoped app-shell.plugin-shell/main-content.workspace-main selectors fix desktop
   width and responsive rules. Re-captured and compared home.
2. Resolved P2: full-width controls pushed the detail pane too low. Desktop detail
   mode now aligns that pane with the search row; its install action is visible.
   Narrow windows intentionally stack. Re-captured and compared details.
3. Resolved P2: early card descriptions/status/actions were too small. Increased
   card type, controls and icon backplates, then re-captured grid/home/details and
   inspected the focused comparison. Primary content remains readable and unclipped.

No open P0/P1/P2 findings in the declared UI scope.

## Required fidelity surfaces

- Fonts: existing Segoe UI Variable/Segoe UI stack; readable Vietnamese, clear
  heading/body/metadata hierarchy and natural wrapping. System antialiasing differs
  from the image-generated text.
- Spacing/layout: wider desktop rail, three application tiles, recent list,
  discovery action, 3×2 catalog and split details retain the approved structure.
  Core navigation is preserved. At 1024 detail uses normal vertical scrolling;
  at 390 the icon rail and single-column cards remain reachable.
- Colors: same core light/dark tokens, indigo actions/selection, semantic green
  installed state, one consistent icon tone per plugin across all screens.
- Assets: supplied NuvoKit SVG mark and established Lucide outline library.
  No hero/avatar/raster artwork is needed, no handmade illustration or placeholder
  replaces a required asset.
- Copy: main Vietnamese labels retained; explicit session-only demonstration note.
  Calendar notification/cross-app features are omitted because SDK v1 lacks those
  APIs. Grid shows Xem chi tiết before the permission/install step.

## Intentional adaptations and P3 follow-up

Native window controls belong to the OS; browser UI does not fake them. Existing
brand asset, core preview label, system navigation and data footer remain.
The Installed sidebar route replaces the duplicate Installed tab in mock 3.
Both layouts share search/category/sort and the remembered view toggle.

Six list entries replace the five drawn in mock 3. Vertical scrolling is allowed;
no horizontal overflow at tested widths. P3: icon glyph scale/weight, metadata
density and some vertical offsets differ while using real shared controls.
These are optional polish; no missing artwork or broken primary journey remains.

## Interaction checks and completion

Checked navigation, diacritic-insensitive search, category/installed filters,
A–Z sort, empty/reset, view switching without losing search, selected plugin,
reload view preference, Hủy focus, Escape, simulated install/open/remove,
light/dark and 1505×1045 / 1024×900 / 390×844 layouts. At 1024 the lower detail
action opened its confirmation successfully. Console checked after interactions
and reload: no errors/warnings. Core Environment/Settings remain usable in
browser preview; real backup/restore actions stay disabled there.

Checklist complete: source/render opened, normalized paired and focused comparisons
inspected, P1/P2 fixes re-captured, modal/keyboard and responsive states checked,
demo/SDK boundaries documented. Full screen-reader/DPI/multi-OS QA is not claimed.
See [verification](plugin-ui-sdk-v1.md) for 31 tests, Windows build
and native functional checks, including the still-unmet RAM budget.
