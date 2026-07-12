# TeamTask — Team Task Manager

A desktop task-management app built with Electron + React 19 + TypeScript + Zustand. Supports dashboard views, task kanban-style lists, plain-text comments, IT support tickets, role-based permissions, audit logging, in-app notifications, AR/EN localisation, dark mode, and auto-updates via GitHub Releases.

## Stack

| Layer | Choice |
|---|---|
| Renderer | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 (OKLCH tokens), Radix UI primitives |
| State | Zustand (one store per domain, all backed by `src/lib/db.ts`) |
| Persistence | localStorage single-blob JSON store (see `src/lib/db.ts`) |
| Shell | Electron 43 with `contextIsolation: true`, `nodeIntegration: false` |
| Auto-update | `electron-updater` reading `electron-builder.json` `publish` block |
| Bundling | Vite + custom `manualChunks` split; relative `base: './'` for `file://` loading |

## Commands

| Task | Command |
|---|---|
| Install deps | `npm ci` |
| Dev (renderer only) | `npm run dev` |
| Electron dev (HMR) | `npm run electron:dev` |
| Lint | `npm run lint` |
| Type-check + bundle | `npm run build` |
| Build unpacked exe | `npm run electron:build:dir` |
| Build Windows installer | `npm run electron:build` |

## Demo Credentials

A fresh install seeds 5 demo accounts. See `docs/seed-credentials.md` for the full list and password hash format. Default accounts are `admin`, `jane`, `alex`, `raj`, `maya` (all with reserved PBKDF2-SHA256 hashes).

## Architecture Notes

- **Persistence**: a single `ttm_data` localStorage entry holds `{ users, tasks, comments, notifications, settings, sessions, passwords, auditEntries, supportTickets }`. Backed by one in-memory class (`src/lib/db.ts`) that does `JSON.stringify` on every mutation.
- **Auth**: PBKDF2-SHA256 (600k iterations, 16-byte salt). Username + password → session token (`tok_<uuid>`) stored in both `data.sessions[]` and `localStorage['ttm_token']`.
- **Permissions**: enum-typed `Permission[]` per `Role` in `src/lib/utils.ts:hasPermission`.
- **Routing**: HashRouter under `src/App.tsx`, lazy routes wrapped by `src/components/layout/AppShell.tsx` (auth + onboarding guards, CSP-compliant).
- **i18n**: flat-key system in `src/lib/i18n.ts` (EN/AR). Toggle via header UI.
- **Auto-update**: `autoUpdater` events bridge to the renderer's existing `update-status` IPC channel so `src/stores/updateStore.ts` is untouched.

## Improvement Plan

See `docs/improvement-plan.md` for the 10-task improvement plan in flight, plus `docs/seed-credentials.md` for demo accounts.

## Deployment

Outputs in `release/`:

- `release/win-unpacked/` — unpacked app dir
- `release/Team Task Manager-Setup-${version}.exe` — NSIS installer

Auto-update is configured to consume the `latest.yml` electron-builder publishes from the GitHub Releases API (owner/repo from `electron-builder.json`).
