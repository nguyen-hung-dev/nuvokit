# Instructions for coding agents

## Read before working

- Read `README.md`, `docs/README.md`, and the documents relevant to the task.
- Use `docs/decisions/` to distinguish accepted decisions from proposals.
- Product documentation is authoritative. The repository now has an internal
  Windows Core v1 scaffold; read `docs/specs/core-v1.md`, `docs/development.md`,
  and actual verification evidence before describing a feature as working.
- Do not describe planned features as implemented or invent setup/build commands.
- Do not choose a license, create a remote repository, publish, or deploy unless
  the user authorizes that action. Local reversible work within the task can proceed.
- Keep private personal records, local credentials, real financial/health data,
  and external personal-vault contents out of this repository. Use synthetic data.
- Keep product documentation in this repository authoritative for implementation.
  Personal planning notes outside the repository are not a source-code dependency.
- Update relevant documentation when implementation changes the product contracts.
- Prefer concise, specific status reports and concrete next actions.
- The approved Windows setup target is `design/mockups/windows-setup-wizard-light-v01.png`.
  Read `docs/decisions/0006-native-setup-release.md` and the installation specification.
  Keep the native bootstrap UI independent of WebView2. Publish installers as Release
  assets; keep build output and machine data outside source commits.

## CodeGraph

Use CodeGraph for structural code questions when an index is available: definitions,
callers/callees, signatures, impact, and focused source context. Use native search
for literal text, documentation, configuration, or a file already being edited.

| Question | Preferred tool |
| --- | --- |
| Focused task context | `codegraph_context` |
| Related symbols and source | `codegraph_explore` |
| Find a symbol | `codegraph_search` |
| Callers / callees | `codegraph_callers` / `codegraph_callees` |
| Change impact | `codegraph_impact` |
| A symbol's signature/source | `codegraph_node` |
| Files under a path | `codegraph_files` |
| Index status | `codegraph_status` |

- For architecture/trace questions, prefer context followed by one grouped explore
  call. Answer directly; do not delegate duplicate exploration.
- Trust AST results; do not re-verify them with grep.
- Do not chain search and node when one context call is sufficient, or loop node
  calls when a grouped explore call can return the relevant source.
- Allow approximately 500 ms for the file watcher after edits before re-querying.
- If a needed query reports that CodeGraph is not initialized, ask:
  "I notice this project doesn't have CodeGraph initialized. Want me to run
  `codegraph init -i` to build the index?"
- Documentation-only work does not require creating an index.

## QA and bug testing

- Do not run full QA for documentation, wording, comments, small configuration,
  behavior-preserving style edits, or other local low-risk changes.
- Run meaningful, proportionate QA for major features or changes affecting behavior,
  several flows, or multiple modules. Add tests only when they verify useful behavior.
- State what was actually checked and what remains unverified.

## Git commit hygiene

- Before staging or committing, inspect `git status --short`,
  `git diff --cached --stat`, and the staged file list.
- A request to commit the entire repository still requires inspecting extra files.
- Do not commit generated build/cache/dependency/runtime output or heavy artifacts:
  `dist*`, `build*`, `tmp*`, `output*`, `.venv/`, `node_modules/`, `vendor/`,
  PyInstaller/Electron output, archives, binaries, models, or generated audio/video,
  unless the user explicitly requests them.
- Check secrets and ignore behavior before the first commit and any broad commit.
- If generated output is already tracked, update ignore rules and remove the
  appropriate paths from the index with `git rm --cached`; report the groups removed.
- Use specific staged paths and review the staged diff before committing.
- Do not add a remote or push as part of a local commit request.
