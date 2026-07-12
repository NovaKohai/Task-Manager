# Agent Instructions

## Package Manager
- Use **npm**: `npm ci` for CI (lockfile is committed).

## Commands
| Task | Command |
|------|---------|
| Dev (renderer only) | `npm run dev` |
| Electron dev | `npm run electron:dev` (Vite + electron-wait-on) |
| Lint | `npm run lint` |
| Build renderer | `npm run build` |
| Build unpacked exe | `npm run electron:build:dir` |
| Build installer | `npm run electron:build` |

## External References
| Need | File |
|------|------|
| Improvement plan | `docs/improvement-plan.md` |
| Demo seed credentials | `docs/seed-credentials.md` |
| Storage layout, auth, hashing | `src/lib/db.ts` |
| Settings schema + security keys | `src/lib/types.ts` (`AppSettings`) |
| i18n keys | `src/lib/i18n.ts` |
| Routing | `src/App.tsx`, `src/components/layout/AppShell.tsx` |
| Electron main | `electron/main.cjs` |
| Build config | `electron-builder.json` |
| Windows installer icons | `build/icon.ico` |

## Key Conventions
- **Generated artifacts (NOT to edit hand):** `dist/`, `dist-ssr/`, `release/` are gitignored outputs of `npm run build` and `npm run electron:build`. Build and copy; never modify them.
- **Renderer ↔ Node:** bridge is `electron/preload.cjs`, exposed as `window.electronAPI`. New IPC channels must be registered in BOTH `electron/main.cjs` (`ipcMain.handle(...)`) and `electron/preload.cjs` (`contextBridge.exposeInMainWorld(...)`). The `ElectronAPI` ambient type is in `src/vite-env.d.ts`.
- **Hashes:** all new password storage uses PBKDF2-SHA256 (600k iters, 16-byte salt) — see `src/lib/db.ts:hashPassword`. Never store plaintext.
- **Permissions enum:** when adding a new permission, update `Permission` in `src/lib/types.ts`, add to `ALL_PERMISSIONS` and adjust `ROLE_PERMISSIONS` in `src/lib/db.ts`, then add the i18n label.
- **i18n:** every new user-facing string needs `src/lib/i18n.ts` entries for **both** `en` and `ar` blocks. If a key doesn't exist, the rendering falls back to the key path (e.g. `profile.username_taken`).
- **Styling:** Tailwind v4 tokens are OKLCH in `src/index.css`. Use semantic tokens (`bg-card`, `text-foreground`) before raw colors.

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: MiniMax-M3 <noreply@example.com>
```
