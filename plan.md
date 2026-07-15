# Final Audit — Fix Plan

## Scope: Full codebase audit + fix
Audited using: clean‑code‑guard, emil‑design‑eng, impeccable, a11y-audit

---

## Phase 1 — Bugs (3 items)

### 1.1 App.tsx — Wrap LoginPage in `<Suspense>`
- **File:** `src/App.tsx`
- **Problem:** `LoginPage` is lazy‑loaded but rendered outside `AppShell` which provides the only `<Suspense>`. If the chunk doesn't load, React throws the promise and the tree fails to render (blank page).
- **Fix:** Wrap the `LoginPage` route with `<Suspense fallback={...}>`.

### 1.2 AdminUsers.tsx — Partial update on edit
- **File:** `src/pages/AdminUsers.tsx:150-151`
- **Problem:** `updateUser()` is called before `updateUserPassword()`. If the password call throws, the profile was already saved but the password wasn't — the error message doesn't tell the user.
- **Fix:** Use a two‑phase approach: if password is provided, try password first, then save profile. Show specific error.

### 1.3 ErrorBoundary.tsx — Missing preventDefault
- **File:** `src/components/ErrorBoundary.tsx:63`
- **Problem:** `handlePromiseRejection` catches the error for state display but doesn't call `event.preventDefault()`, so the browser still logs an unhandled rejection.
- **Fix:** Add `event.preventDefault()` as first line.

---

## Phase 2 — A11y: Critical (15 items)

### 2.1–2.7 Form controls missing accessible labels
- **Files:** BroadcastDialog (select), TicketSubmitForm (select), DepartmentSelect (select), ITApps (input, select, textarea, input, input, textarea), Preferences (select), Support (select)
- **Fix:** Add `aria-label` or `<label>` + `id` to each unlabeled control.

### 2.8–2.9 TaskList keyboard‑inaccessible divs
- **File:** `src/pages/TaskList.tsx:517-518`
- **Fix:** Add `onKeyDown` handler (Escape to close) or use `<button>` with `role="presentation"`.

### 2.10 ITApps icon img alt
- **File:** `src/pages/ITApps.tsx:358`
- **Fix:** Add descriptive `alt` text (the app name).

---

## Phase 3 — A11y: Site‑wide structural (one‑time setup)

### 3.1 Add skip‑to‑content link
- **File:** `src/components/layout/AppShell.tsx`
- **Fix:** Add `<a href="#main-content" className="sr-only...">` as first focusable element.

### 3.2 Add `<main>` landmark wrapper
- **File:** `src/components/layout/AppShell.tsx` (or each page shell)
- **Fix:** Wrap `<Outlet />` in `<main id="main-content">`.

### 3.3 Add `<nav>` to Sidebar
- **File:** `src/components/layout/Sidebar.tsx`
- **Fix:** Wrap nav link groups in `<nav aria-label="...">`.

### 3.4 Add `<h1>` to every page
- **Files:** All page components that start with `<h2>` or `<h3>` (AdminUsers, AuditLog, BroadcastDialog, etc.)
- **Fix:** Add a single `<h1 className="sr-only">` or visible `<h1>` as the main heading.

### 3.5 Add `prefers-reduced-motion` to global CSS
- **File:** `src/index.css`
- **Fix:** Add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; ... } }`

---

## Phase 4 — Animation polish (emil‑design‑eng)

### 4.1 Replace `transition-all` with specific properties
- **Files:** toast.tsx, TicketSubmitForm.tsx, AppShell.tsx, TaskList.tsx, Sidebar.tsx, ChatWindow.tsx, PriorityAlerts.tsx, ChatSidebar.tsx, VoipCallOverlay.tsx, MyTicketsList.tsx, ItQueueManager.tsx, Reports.tsx, Onboarding.tsx, Settings.tsx
- **Fix:** `transition-all` → `transition-[specific-props] duration-200 ease-out`.

### 4.2 Add button `:active` press feedback
- **File:** `src/components/ui/button.tsx`
- **Fix:** Add `active:scale-[0.97]` to button variants.

### 4.3 Improve entry animations
- **Files:** All `animate-rise` usages (consider adding `motion-safe:animate-rise` wrapper)
- **Fix:** Wrap anim classes with `motion-safe:` or add reduced‑motion fallback.

### 4.4 `animate-pulse` on non‑loading indicators
- **Files:** ChatSidebar, ChatWindow (online dot), ErrorBoundary (alert icon), Header, PriorityAlerts
- **Fix:** Remove `animate-pulse` from static indicators; use subtle static styling.

---

## Phase 5 — Code quality (10 items)

### 5.1 db.ts — Permission migration runs on every load
- **File:** `src/lib/db.ts:226-239`
- **Fix:** Track schema version in store; only run migration on version change.

### 5.2 db.ts — Hardcoded English auth errors
- **File:** `src/lib/db.ts:288,294`
- **Fix:** Use `i18n.t()` for error messages (throw translated strings).

### 5.3 types.ts — `RecommendedApp.category` should be union
- **File:** `src/lib/types.ts:224`
- **Fix:** Create `RecommendedAppCategory` union type.

### 5.4 ITApps.tsx — Empty catch block
- **File:** `src/pages/ITApps.tsx:136`
- **Fix:** Log the error: `catch (e) { console.error(e); ... }`.

### 5.5 ITApps.tsx — Touch‑unfriendly hover‑reveal buttons
- **File:** `src/pages/ITApps.tsx:222`
- **Fix:** Use `group-hover:opacity-100 focus-visible:opacity-100` instead of just `group-hover`.

### 5.6 AuditLog.tsx — CSV export missing catch
- **File:** `src/pages/AuditLog.tsx:145-168`
- **Fix:** Add `catch` block with toast error.

### 5.7 AuditLog.tsx — Stale store access
- **File:** `src/pages/AuditLog.tsx:175`
- **Fix:** Pass `user` as parameter or use hook at call time.

### 5.8 AdminUsers.tsx — async on sync functions
- **File:** `src/pages/AdminUsers.tsx:183,211`
- **Fix:** Remove `async` from `handleDelete` and `handleReject`.

### 5.9 App.tsx — Toaster outside HashRouter
- **File:** `src/App.tsx:74`
- **Fix:** Move `<Toaster />` and `<UpdateDialog />` inside `</HashRouter>`.

### 5.10 AdminUsers.tsx — Silent error on admin actions
- **File:** `src/pages/AdminUsers.tsx:179,196,207,220`
- **Fix:** Show error toast on failure for toggle/delete/approve/reject.

---

## Phase 6 — UI polish (4 items)

### 6.1 Chat.tsx — Fake online indicator
- **File:** `src/components/chat/ChatWindow.tsx:67`
- **Fix:** Remove the green dot + `animate-pulse` that implies real presence.

### 6.2 ITApps.tsx — Better empty states
- **File:** `src/pages/ITApps.tsx:211-218`
- **Fix:** Differentiate "no apps at all" vs "no apps in filter".

### 6.3 Chat.tsx — Missing aria-labels on call buttons
- **File:** `src/components/chat/ChatWindow.tsx:78-94`
- **Fix:** Add `aria-label` to voice/video buttons.

### 6.4 Chat.tsx — Hardcoded English fallback
- **File:** `src/components/chat/ChatWindow.tsx:72`
- **Fix:** Use `i18n.t()` instead of `'System Administrator'` / `'Staff'`.

---

## Execution order
1. Phase 1 (bugs) — highest risk
2. Phase 2 (a11y critical) — blocks access
3. Phase 3 (a11y structural) — one‑time setup, benefits every page
4. Phase 4 (animation) — visual polish
5. Phase 5 (code quality) — maintainability
6. Phase 6 (UI polish) — minor improvements

After each phase: `npm run lint` and `npm run build` to verify.
