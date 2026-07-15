# Agent Instructions

## Package Manager
- Use **npm**. Lockfile (`package-lock.json`) is committed — use `npm ci` for CI.
- Docker dev environment available (`docker-compose.yml` + `Dockerfile`).

## Commands
| Task | Command |
|------|---------|
| Dev (renderer only) | `npm run dev` (Vite on :5173) |
| Electron dev | `npm run electron:dev` (Vite + `wait-on` + launches Electron with `--dev`) |
| Lint | `npm run lint` (uses `oxlint`) |
| Build renderer | `npm run build` (`tsc -b` + `vite build`) |
| Preview renderer | `npm run preview` |
| Build unpacked exe | `npm run electron:build:dir` |
| Build installer | `npm run electron:build` (produces NSIS exe in `release/`) |

## Architecture

- **Stack:** Electron 43 + React 19 (SPA with HashRouter) + Vite 8 + Tailwind v4 + Zustand 5
- **Path alias:** `@/` → `./src/` (defined in `tsconfig.app.json` + `vite.config.ts`)
- **Routing:** `src/App.tsx` wraps all routes in `ErrorBoundary`, uses lazy-loaded pages via `React.lazy` + `HashRouter`. 18 pages.
- **Data layer:** All state lives in a single `localStorage` blob keyed `ttm_data`. See `src/lib/db.ts` for `StoreSchema`. No backend server.
- **Auth:** PBKDF2-SHA256 (600k iters, 16-byte salt) via Web Crypto API. See `src/lib/db.ts:hashPassword`.
- **Roles:** 4 roles (`admin`, `manager`, `developer`, `viewer`) with permission sets in `ROLE_PERMISSIONS` map (`src/lib/db.ts:111`).

## Key Conventions

### Renderer ↔ Node IPC bridge
- Preload: `electron/preload.cjs` (`contextBridge.exposeInMainWorld`)
- Ambient type `ElectronAPI` + `Window.electronAPI`: `src/vite-env.d.ts`
- New IPC channels must be registered in **both** `electron/main.cjs` (`ipcMain.handle`) and `electron/preload.cjs`, then typed in `src/vite-env.d.ts`.

### Permissions
- `Permission` union: `src/lib/types.ts`
- `ALL_PERMISSIONS` array + `ROLE_PERMISSIONS` map: `src/lib/db.ts`
- Adding a permission requires updating all 3, plus i18n labels.

### i18n
- Singleton `I18n` class in `src/lib/i18n.ts`, stored under `ttm_lang` localStorage key.
- Translations in `src/lib/locales/{en,ar}.ts`. Both blocks required. Missing keys fall back to the key path string.
- RTL support: Arabic locale sets `dir: 'rtl'`, toggles `.rtl` class on `<html>`.

### Sound
- Synthesized via Web Audio API (`src/lib/sound.ts`). No audio files. Themes: `chime`, `glass`, `cyber`, `alert`.

### Styling
- Tailwind v4 with OKLCH tokens in `src/index.css`. Prefer semantic tokens (`bg-card`, `text-foreground`) over raw colors.
- Dark/light theme via `useThemeStore` (toggles `.dark` class on `<html>`).
- Radix UI primitives used for interactive components.

### Build artifacts (gitignored, do not edit by hand)
- `dist/` — Vite build output
- `release/` — electron-builder output (unpacked exe + NSIS installer)
- `dist-ssr/` — SSR artifacts (if enabled)

### Build quirks
- `vite.config.ts` strips `crossorigin` attributes from index.html (required for `file://` loads in production Electron).
- Manual chunk splits: react-vendor, ui-vendor, state-vendor, icon-vendor.
- CSP enforced server-side in `electron/main.cjs` via `onHeadersReceived`.
- DevTools locked to dev mode (`Ctrl+Shift+I` only works with `--dev` flag).

### Installer
- AppId: `com.novataskmanager.app`, productName: `Nova Task Manager`
- NSIS config includes `build/nsis-cleanup.nsh` (kills old process, migrates data from `com.teamtaskmanager.app`, uninstalls old app).
- Icons: `build/icon.ico` (multi-res from SVG, 256/48/32/16px).

### Testing
- **No test framework installed** — no Jest, Vitest, or Playwright in dependencies.

### CI / GitHub
- `oxlint` is the linter — no ESLint/Prettier.
- Build pipeline: `npm run build` (`tsc -b` → `vite build`).
- Auto-updater reads publish config from `electron-builder.json` (GitHub Releases, private repo `NovaKohai/Task-Manager`). Set `GH_TOKEN` env var for authenticated requests.
- No CI workflow files currently committed.

### TypeScript 6 notes
- `tsconfig.app.json` sets `ignoreDeprecations: "6.0"`.
- `noUnusedLocals` and `noUnusedParameters` are both `false`.

### Module organization
- `src/lib/db.ts` delegates to `src/lib/db/{support,chat}.ts` for support ticket and chat domain logic.
- Each domain has its own Zustand store in `src/stores/` (12 stores total). Stores read/write through the `db` singleton.

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
