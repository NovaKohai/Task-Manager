# Agent Instructions

## Package Manager
- Use **npm**. Lockfile (`package-lock.json`) is committed — use `npm ci` for CI.

## Commands
| Task | Command |
|------|---------|
| Dev (renderer only) | `npm run dev` |
| Electron dev | `npm run electron:dev` (Vite on :5173 + waits + launches electron) |
| Lint | `npm run lint` (uses `oxlint`) |
| Build renderer | `npm run build` (tsc + vite) |
| Build unpacked exe | `npm run electron:build:dir` |
| Build installer | `npm run electron:build` (produces NSIS exe in `release/`) |

## Architecture

- **Stack:** Electron 43 + React 19 (SPA with HashRouter) + Vite 8 + Tailwind v4 + Zustand 5
- **Path alias:** `@/` → `./src/` (defined in `tsconfig.app.json` + `vite.config.ts`)
- **Routing:** `src/App.tsx` wraps all routes in `ErrorBoundary`, uses lazy-loaded pages via `React.lazy` + `HashRouter`. 16 pages total.
- **Data layer:** All state lives in a single `localStorage` blob keyed `ttm_data`. See `src/lib/db.ts` for the `StoreSchema` interface. No backend server.
- **Auth:** PBKDF2-SHA256 (600k iters, 16-byte salt) via Web Crypto API. See `src/lib/db.ts:hashPassword`.

## Key Conventions

### Renderer ↔ Node IPC bridge
- Preload: `electron/preload.cjs` (`contextBridge.exposeInMainWorld`)
- Ambient type `ElectronAPI` + `Window.electronAPI`: `src/vite-env.d.ts`
- New IPC channels must be registered in **both** `electron/main.cjs` (`ipcMain.handle`) and `electron/preload.cjs`, then typed in `src/vite-env.d.ts`.

### Permissions
- `Permission` union: `src/lib/types.ts`
- `ALL_PERMISSIONS` array + `ROLE_PERMISSIONS` map: `src/lib/db.ts` lines 94–131
- Adding a permission requires updating all 3, plus i18n labels.

### i18n
- Singleton `I18n` class in `src/lib/i18n.ts`, stored under `ttm_lang` localStorage key.
- Translations live in `src/lib/locales/{en,ar}.ts`. Every user-facing string needs entries in **both** blocks. Missing keys fall back to the key path string.

### Sound
- Synthesized via Web Audio API (`src/lib/sound.ts`). No audio files. Themes: `chime`, `glass`, `cyber`, `alert`.

### Styling
- Tailwind v4 with OKLCH tokens in `src/index.css`. Prefer semantic tokens (`bg-card`, `text-foreground`) over raw colors.
- Dark/light theme via `useThemeStore` (toggles `.dark` class on `<html>`).

### Build artifacts (gitignored, do not edit by hand)
- `dist/` — Vite build output
- `release/` — electron-builder output (unpacked exe + NSIS installer)
- `dist-ssr/` — SSR artifacts (if enabled)

### Build quirks
- `vite.config.ts` strips `crossorigin` attributes from index.html (required for `file://` loads in production Electron).
- Manual chunk splits: react-vendor, ui-vendor, state-vendor, icon-vendor.
- CSP enforced server-side in `electron/main.cjs` via `onHeadersReceived`.
- DevTools are locked to dev mode (`Ctrl+Shift+I` only works with `--dev` flag).

### Installer
- AppId: `com.novataskmanager.app`, productName: `Nova Task Manager`
- NSIS config in `electron-builder.json` includes `build/nsis-cleanup.nsh` (kills old "Team Task Manager" process, backs up `%APPDATA%\com.teamtaskmanager.app` data to the new app's `%APPDATA%`, then uninstalls the old app silently).
- Icons: `build/icon.ico` (multi-res from SVG, 256/48/32/16px).

### CI / GitHub
- `oxlint` is the linter — no ESLint/Prettier. Lint is fast.
- `npm run lint` before any commit.
- The build pipeline is `npm run build` (tsc + vite), not a separate type-check step.
- Auto-updater reads publish config from `electron-builder.json` (GitHub Releases, private repo `NovaKohai/Task-Manager`). Set `GH_TOKEN` env var for authenticated requests.

## External References
| Need | File |
|------|------|
| Demo seed credentials | `docs/seed-credentials.md` |
| Settings schema & all config keys | `src/lib/types.ts` (`AppSettings`) |
| i18n keys | `src/lib/locales/{en,ar}.ts` |
| Storage schema + auth + hashing | `src/lib/db.ts` |
| Routing structure | `src/App.tsx` |
| Electron main + CSP + IPC | `electron/main.cjs` |
| Build config | `electron-builder.json` |

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: MiniMax-M3 <noreply@example.com>
```
