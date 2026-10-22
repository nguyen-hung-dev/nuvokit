# Windows installer — visual and interaction QA

- Date: 2026-10-23.
- Target: `design/mockups/windows-setup-wizard-light-v01.png`, selected as image 1.
- Scope: native Windows setup wizard and its declared UI states, not clean-OS certification.
- final result: passed

Compared the approved image with the runtime-state capture from actual WinForms
controls at the proposed logical window size. The test backend holds runtime
installation to make that state inspectable; it does not claim a Microsoft install
occurred. Also inspected the production window with Windows Computer Use.

The left stepper, purple/neutral palette, title hierarchy, passed-Windows surface,
current component/purpose/source, indeterminate progress and footer actions are
present. Native caption/borders and numbered status indicators adapt the image to
Windows controls. Pending completion uses a pending indicator instead of the mock's
ambiguous gray checkmark. No additional generated artwork is required.

Checked welcome, runtime, error and complete renders; real path rejection/recovery
and opening details; automated success/timeout/retry/cancellation-control behavior.
Resolved P2 issues: progress color, runtime component title, retry destination
editing preflight-error coloring, and compact-window scrolling with a fixed reachable footer. No open P0/P1/P2 visual issues in this scope.

P3: native controls have squarer borders and a different OS caption/footer spacing
than the generated reference. Full DPI/screen-reader coverage remains follow-up;
this pass is not an exhaustive accessibility audit.

Evidence stays in ignored `output/installer-qa/`, including synthetic state captures;
production screenshots may show a local install path and are not public assets.
System/release limits remain in `docs/verification/windows-setup-0.1.1.md`.
