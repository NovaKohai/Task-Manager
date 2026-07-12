# Improvement Plan: TeamTaskManager.exe

## Overview
Ten improvements to the v1.0.4 Electron desktop app (React 19 + Vite + Zustand + Tailwind v4). The app ships a single localStorage-blob "database", a hand-rolled auto-updater with no integrity verification, decorative security settings, and several bundled-but-unused modules. This plan sequences fixes bottom-up by dependency, lowest risk first, with explicit checkpoints.

## Architecture Decisions
- **Keep the desktop/local-first premise** — no backend introduced in this round. The `plan.md` SQL Server migration is a separate, future effort. Tasks below harden the existing local persistence path, not replace it.
- **Adopt `electron-updater` (already a dependency)** rather than keeping the hand-rolled fetcher. Removes dead weight and gains signature/checksum verification for free.
- **Enforce existing settings rather than adding new ones** — the Settings UI already exposes password policy, session expiry, lockout, rate limits; the code just ignores them.
- **No new runtime deps** in this round except where explicitly required (`@tanstack/react-virtual` for list virtualization). Everything else uses existing dependencies.

## Task List

### Phase 1: Electron Hardening (security-critical, low-risk)

- [ ] **Task 1**: Set a Content Security Policy and lock DevTools to dev mode
  - Acceptance: a CSP header is set on the main session in `electron/main.cjs` (`default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.github.com`); the `Ctrl+Shift+I` DevTools toggle in `before-input-event` only fires when `isDev` is true; build still loads from `file://` without console errors.
  - Verify: `npm run electron:build:dir`, launch the unpacked exe, confirm no CSP-violation console errors; confirm `Ctrl+Shift+I` does nothing in the production build and still works in `electron:dev`.
  - Dependencies: None.
  - Files: `electron/main.cjs`.
  - Scope: **S**.

- [ ] **Task 2**: Replace the hand-rolled updater with `electron-updater`
  - Acceptance: `electron-updater`'s `autoUpdater` is wired in `main.cjs` (events fed to existing `update-status` IPC channel); the `check-for-updates`/`download-update`/`install-update` handlers delegate to it; `electron-builder.json:28-32` publish block is consumed; checksum/signature verification happens automatically via `latest.yml`; partial-downloads are no longer launched (removed `shell.openPath` path; `install-update` calls `autoUpdater.quitAndInstall()`); the existing `UpdateDialog.tsx` progress UI continues to work.
  - Verify: `npm run electron:build:dir`, confirm no runtime error on startup; trigger a check from the Settings page and confirm the dialog still opens.
  - Dependencies: None.
  - Files: `electron/main.cjs` (heavy rewrite of lines 65-152), `electron/preload.cjs` (unchanged surface), `src/stores/updateStore.ts` (only if event shape changes).
  - Scope: **M**.

### Checkpoint A: Electron Hardening
- [ ] `npm run build` and `npm run electron:build:dir` succeed.
- [ ] Production build launches without CSP or updater errors in the console.
- [ ] Manual: Sign in with `admin/admin123`, land on the dashboard, click "Check for Updates" in Settings — no crash.

### Phase 2: Auth & Data Integrity (security-critical)

- [ ] **Task 3**: Re-seed users with PBKDF2 hashes and document seed passwords
  - Acceptance: `DEFAULT_HASHES` in `db.ts:96-102` no longer contains unsalted SHA-256 hex strings — each value is the modern `saltHex:hashHex` format produced by `hashPassword()`. The legacy fallback (`db.ts:42-47`) remains for any existing install that upgrades. The five seed username/password pairs are documented in `README.md` (or a `docs/seed-credentials.md`) so a fresh install is usable.
  - Verify: fresh localStorage (`localStorage.clear()` then reload), login as each documented seed user succeeds; audit log entry recorded; no console error.
  - Dependencies: None (independent of Task 1-2).
  - Files: `src/lib/db.ts`.
  - Scope: **S**.

- [ ] **Task 4**: Enforce username uniqueness on rename and make `migratePasswordUsername` safe
  - Acceptance: `db.updateUser` (the path called by `Profile.tsx:76` and `AdminUsers.tsx`) rejects a username change if another user already has the target username; the error message is i18n'd; `migratePasswordUsername` only runs after uniqueness is confirmed; `Profile.tsx` surfaces the error in the existing `setError(...)` banner.
  - Verify: as user A, attempt to rename to user B's username → blocked with an error; rename to a free username → password still works on next login.
  - Dependencies: None.
  - Files: `src/lib/db.ts` (updateUser region around the `migratePasswordUsername` call), `src/pages/Profile.tsx` (error handling).
  - Scope: **S**.

- [ ] **Task 5**: Enforce password policy on create/reset/change
  - Acceptance: `createUser`, `updatePassword`, and admin password reset all run the password through a shared `validatePassword(pw, settings)` helper that checks `pwMinLength`, `pwMaxLength`, `requireUppercase`, `requireDigit` from `this.data.settings`. Validation error returns an i18n message; `LoginPage` registration, `Profile` change-password, and `AdminUsers` reset all surface the error in their existing error banners. The `pwHashAlgo` cosmetic "Argon2id" string is corrected to "PBKDF2-SHA256" in `getDefaultSettings()` to stop misrepresenting the algorithm.
  - Verify: as admin, set `pwMinLength: 12` in Settings; try creating a user with an 8-char password → rejected; try changing your own password to one without a digit (with `requireDigit: true`) → rejected.
  - Dependencies: None.
  - Files: `src/lib/db.ts` (new helper + 3 call sites), `src/pages/LoginPage.tsx`, `src/pages/Profile.tsx`, `src/pages/AdminUsers.tsx`.
  - Scope: **M**.

### Checkpoint B: Auth & Data Integrity
- [ ] `npm run build` and `npm run lint` succeed.
- [ ] Manual: a fresh-install user can log in with documented seed credentials; an existing install (with old hashes) still logs in via the legacy fallback and is upgraded on first login; password policy holds across all three change paths.

### Phase 3: Authorization & UX Safety

- [ ] **Task 6**: Gate the Settings page and Support IT-queue by permission
  - Acceptance: the `/settings` route (guarded in `AppShell.tsx`) only renders to users with `settings.view`; users without `settings.edit` see the page read-only (fields disabled, danger-zone hidden). The Support IT-queue tab (`Support.tsx`) checks `hasPermission(user, ...)` or a new IT-manage permission, not `user.department === 'it'`. A developer with `department: 'it'` no longer sees the IT queue.
  - Verify: log in as `jane` (manager — has no `settings.*` per `ROLE_PERMISSIONS.manager` at `db.ts:91`) → `/settings` redirects away or shows a forbidden notice; a developer with `department: 'it'` does not see the IT queue.
  - Dependencies: None.
  - Files: `src/components/layout/AppShell.tsx` (route guard), `src/pages/Settings.tsx` (field-level gating), `src/pages/Support.tsx` (queue gating), possibly `src/lib/types.ts`/`db.ts` if a new permission is added.
  - Scope: **M**.

- [ ] **Task 7**: Fix the `Profile.tsx` navigate-during-render anti-pattern
  - Acceptance: `Profile.tsx:31-34` no longer calls `navigate('/login')` during render; instead it renders an explicit "Session expired, click here to log in" state, with the redirect happening in a `useEffect` after paint (or by showing a link). Verify the React dev-tools warning "Cannot navigate during render" is gone.
  - Verify: clear `localStorage['ttm_token']`, navigate to `#/profile` → no React warning in console; user sees a clear "session expired" UI rather than a blank page.
  - Dependencies: None.
  - Files: `src/pages/Profile.tsx`.
  - Scope: **S**.

- [ ] **Task 8**: Wire the missing-input-validation fixes for `MyDashboard` and `Header`
  - Acceptance: the "Quick update" Send button at `MyDashboard.tsx:202` either wires the input to a real action (`db.addComment(taskId, value)` with a target-task picker) or is removed entirely (the dead feature is gone). The decorative Header search input at `Header.tsx:33-38` either becomes a functional task-search (navigates to `#/tasks?search=…`) or is removed in favour of a labelled placeholder. Either path is acceptable — dead UI lying to the user is not.
  - Verify: type into the affected input and observe a real effect (or no longer see the input at all).
  - Dependencies: None.
  - Files: `src/pages/MyDashboard.tsx`, `src/components/layout/Header.tsx`, possibly `src/pages/TaskList.tsx` to accept a `?search=` query param.
  - Scope: **S**.

### Checkpoint C: Authorization & UX Safety
- [ ] `npm run build` and `npm run lint` succeed.
- [ ] Manual full-flow: log in as admin, manager, developer, viewer (or just the first three) and confirm each only sees the routes, tabs, and inputs they should.

### Phase 4: Code Health & Repo Hygiene

- [ ] **Task 9**: Deduplicate helpers, consolidate modals and toasts, fix the i18n reload
  - Acceptance:
    - The `formatDate`/`formatFull` and `getUser`/`getUserName` helpers duplicated across `ManagerDashboard.tsx`, `MyDashboard.tsx`, `TaskList.tsx`, `TaskDetail.tsx`, `Reports.tsx`, `Support.tsx` move to a shared `src/lib/format.ts` (and existing `src/lib/utils.ts`).
    - The department `<SelectItem>` list duplicated in `AdminUsers.tsx:270-282` and `Profile.tsx:221-233` becomes a `<DepartmentSelect />` shared component in `src/components/ui/`.
    - `Settings.tsx` local toast impl (`Settings.tsx:32,59-63,78-86`) is removed; the page uses the global `useToast`/`toast` from `hooks/use-toast.ts`.
    - The custom CSS `modal-overlay`/`modal-content` blocks in `AdminUsers.tsx:469-529` (the broadcast modal) and `AnnouncementModal.tsx` are replaced with the existing Radix `Dialog` (already used by `UpdateDialog`), gaining focus-trap for free.
    - `i18n.toggle()` no longer does `window.location.reload()`; locale changes re-render via the existing Zustand store (probably means moving the current locale into a store or context so `t()` re-evaluates without a full reload).
  - Verify: grep for `formatDate`, `getUserName`, `modal-overlay` confirms no remaining local definitions where shared exists; toggle language in the running app and confirm no full page reload (state preserved).
  - Dependencies: Tasks 6 (permission-gating) so the modal consolidation doesn't reintroduce unguarded UI. Can run in parallel otherwise.
  - Files: `src/components/layout/AdminUsers.tsx`, `src/components/notifications/AnnouncementModal.tsx`, `src/pages/Settings.tsx`, `src/lib/utils.ts` (or new `src/lib/format.ts`), new `src/components/ui/DepartmentSelect.tsx`, `src/lib/i18n.ts`.
  - Scope: **L** — if it grows past 5 files, split the i18n-reload fix out into its own task.

- [ ] **Task 10**: Repo-cruft cleanup and AGENTS.md
  - Acceptance:
    - `dist/` is added to `.gitignore` and removed from git tracking (`git rm -r --cached dist/`).
    - `New Text Document.txt` deleted (it's a git cheat-sheet accidentally committed).
    - `Dockerfile` and `docker-compose.yml`: either fixed (compose `target: dev` matches a real Dockerfile stage; the `electron-builder` stage removed since it can't build Windows installers on Linux) or deleted with a note in `plan.md` that CI is out of scope for this round.
    - `README.md` rewritten to describe the actual project: what it is, how to `npm run dev` / `electron:dev` / `electron:build`, where the seed credentials live, the architecture in two sentences.
    - `design.md`: update the Cairo/Tajawal font mismatch (design.md mentions Cairo; index.html loads Tajawal) to reflect what's actually shipped.
    - `changelog.txt:25`: remove the stray CJK string.
    - `walkthrough.md`: update the stale `Setup-0.0.0.exe` reference to current version.
    - Add `AGENTS.md` at repo root with the standard sections (package manager, commands, conventions, external references) per the agents-md spec.
  - Verify: `git status` shows the staged deletions and `.gitignore` change; `git diff --cached dist/` is empty (the dir is untracked now); `npm run build` still succeeds and the dist is regenerated locally.
  - Dependencies: None — pure hygiene, safe to do last.
  - Files: `.gitignore`, `README.md`, `design.md`, `changelog.txt`, `walkthrough.md`, `Dockerfile`, `docker-compose.yml`, `New Text Document.txt` (deleted), new `AGENTS.md`.
  - Scope: **M**.

### Phase 5: Optional Follow-ups (not part of this PR)

The following are tracked by `plan.md` (`src/../plan.md`, the SQL Server migration spec) and are deferred:
- Migrating persistence from the `localStorage` single-blob to SQLite/IndexedDB (current `db.ts` O(n) stringify-on-every-mutation pattern, ~5 MB ceiling).
- Splitting the 935-line `db.ts` god object into per-domain services.
- Extracting the duplicated store `set isLoading → yieldToUI → db.X` boilerplate into a shared helper.
- Virtualizing `TaskList` and `AuditLog` (`@tanstack/react-virtual`).
- Fixing the `Reports.tsx` placeholder "—" columns (in_progress / overdue / completion rate).
- Wiring the `TaskDetail.tsx` acceptance-criteria placeholder.
- Persisting the in-memory loginAttempts lockout map across restarts.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `electron-updater` requires code-signing for full verification; unsigned dev builds may warn. | Med | Document in README; the verification still happens, just might warn on unsigned builds. |
| Re-seeding PBKDF2 hashes for the 5 demo users requires knowing their plaintext passwords. | Med | Choose new demo passwords, hash them on first run via a one-time seed script, document the credentials. |
| Changing `i18n.toggle` to no-reload could expose state that was assumed to refresh on reload. | Med | Test all pages after language toggle in the manual checkpoint. |
| Replacing the custom modals with Radix `Dialog` changes class names / styling. | Low | Apply the same Tailwind classes to the Radix content; visual diff in dev. |
| Removing `dist/` from git may break a workflow that depended on the committed build. | Low | Confirmed there's no CI workflow referencing it (`.github/workflows/` is empty). |

## Open Questions

- Should the 5 seed-user passwords change in this round (recommended) or stay as-is with only the hashing algorithm upgraded? If the former, the demo credentials in `LoginPage.tsx:220` and `i18n.ts:604` will need to match.
- Should a new permission like `support.it.manage` be added for the Support IT-queue gating (Task 6), or should we reuse an existing permission? Adding one touches `ALL_PERMISSIONS` and the `Role` mapping.
- The `electron-builder.json` `publish` block already targets the GitHub repo — when wired to `electron-updater`, do we want auto-download on startup (current `initUpdateCheck()` behavior) or check-only with manual download?
