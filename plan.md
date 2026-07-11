# Windows Server Migration Plan

## Current Architecture

```
┌─────────────────────────────────────────────────┐
│              Electron Desktop App               │
│  ┌───────────────────────────────────────────┐  │
│  │       React SPA (Vite + TypeScript)       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │ Zustand  │  │ Zustand  │  │Zustand │  │  │
│  │  │ AuthStore│  │TaskStore │  │More... │  │  │
│  │  └────┬─────┘  └────┬─────┘  └───┬────┘  │  │
│  │       └──────┬──────┘────────────┘       │  │
│  │              ▼                            │  │
│  │       ┌──────────────┐                    │  │
│  │       │   db.ts      │  localStorage      │  │
│  │       │ (Database)   │────────────────►   │  │
│  │       │   class      │  'ttm_data'        │  │
│  │       └──────────────┘                    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Problem**: All data lives in browser `localStorage`. No sync, no backup, no multi-device. Each Electron install has its own isolated database.

---

## Target Architecture

```
┌──────────────────┐       ┌─────────────────────────────┐
│  Electron Client │       │    Windows Server 2022+     │
│  (React SPA)     │◄─────►│                             │
│                  │ HTTP  │  ┌───────────────────────┐  │
│  ┌────────────┐  │ JSON  │  │ ASP.NET Core 9 WebAPI │  │
│  │ api/       │  │       │  │                       │  │
│  │  auth.ts   │──┼───────┼─►│  Controllers/         │  │
│  │  tasks.ts  │  │       │  │  Services/            │  │
│  │  users.ts  │  │       │  │  Middleware/           │  │
│  │  ...       │  │       │  └──────────┬────────────┘  │
│  └────────────┘  │       │             │               │
│                  │       │  ┌──────────▼────────────┐  │
│  ┌────────────┐  │       │  │  Entity Framework     │  │
│  │ Zustand    │  │       │  │  (Code-First)         │  │
│  │ stores     │  │       │  └──────────┬────────────┘  │
│  │ use API    │  │       │             │               │
│  └────────────┘  │       │  ┌──────────▼────────────┐  │
│                  │       │  │  SQL Server 2022      │  │
│                  │       │  │  (or PostgreSQL)      │  │
│                  │       │  └───────────────────────┘  │
└──────────────────┘       └─────────────────────────────┘
```

---

## Migration Phases

### Phase 1: Backend Scaffold (2-3 days)

#### 1.1 Create ASP.NET Core 9 WebAPI project
```
team-task-manager-server/
├── Controllers/
│   ├── AuthController.cs
│   ├── TasksController.cs
│   ├── UsersController.cs
│   ├── CommentsController.cs
│   ├── NotificationsController.cs
│   ├── ReportsController.cs
│   ├── SettingsController.cs
│   └── AuditController.cs
├── Models/
│   ├── User.cs
│   ├── Task.cs
│   ├── Comment.cs
│   ├── Notification.cs
│   ├── AuditEntry.cs
│   └── AppSettings.cs
├── Data/
│   └── AppDbContext.cs
├── Services/
│   ├── AuthService.cs
│   ├── TaskService.cs
│   ├── ReportService.cs
│   └── AuditService.cs
├── DTOs/
│   ├── LoginRequest.cs
│   ├── LoginResponse.cs
│   ├── TaskFilter.cs
│   └── ReportMetrics.cs
├── Middleware/
│   ├── JwtMiddleware.cs
│   └── RateLimitMiddleware.cs
├── Migrations/
├── Program.cs
└── appsettings.json
```

**Key decisions:**
- **Framework**: ASP.NET Core 9 Minimal API or Controllers
- **Auth**: JWT with refresh tokens (matching current `accessTokenExpiry`/`refreshTokenExpiry` settings)
- **Database**: SQL Server 2022 Express (free, runs on Windows Server)
- **ORM**: Entity Framework Core (code-first, migrations)
- **Hosting**: IIS or `dotnet run` as Windows Service

#### 1.2 Database Schema

All entities map 1:1 from `StoreSchema` in `db.ts`:

| Table | Key fields |
|-------|-----------|
| `Users` | Id, Username, Name, Email, Role, PasswordHash, Active, Approved, CreatedAt |
| `Tasks` | Id, Code, Title, Description, Status, Priority, AssigneeId, CreatorId, DueDate, EstHours, Project, CreatedAt, UpdatedAt |
| `Comments` | Id, TaskId, AuthorId, Content, EditedAt, Deleted |
| `Notifications` | Id, UserId, Type, Title, Message, TaskId, Read, CreatedAt |
| `Sessions` | Id, UserId, Token, ExpiresAt |
| `AuditEntries` | Id, Action, UserId, Username, Details, Timestamp |
| `AppSettings` | Id, Key, Value (single-row or kv store) |

**Password storage**: BCrypt instead of SHA-256 (current SHA-256 is insufficient for production).

**Migrations**: EF Core migrations for schema versioning.

---

### Phase 2: Client API Layer (1-2 days)

#### 2.1 Create API module

```
src/api/
├── client.ts        # Base fetch wrapper (JWT attach, error handling, retry)
├── auth.ts          # login(), logout(), register(), refreshToken()
├── tasks.ts         # CRUD + list with filters
├── users.ts         # CRUD
├── comments.ts      # CRUD
├── notifications.ts # list, markRead, markAllRead
├── reports.ts       # getReportMetrics()
├── settings.ts      # get, update, reset
└── audit.ts         # list, clear
```

**`client.ts`** handles:
- Base URL from settings (or env variable)
- JWT token attachment via `Authorization: Bearer`
- 401 → token refresh → retry
- Request/response serialization
- Rate limiting backoff

#### 2.2 Rewrite Zustand stores

Each store currently calls `db.someMethod()` directly. Rewrite to call the API layer instead:

**Before** (current `taskStore.ts`):
```ts
createTask: async (data) => {
  const task = db.createTask(data)
  set(state => ({ tasks: [task, ...state.tasks] }))
  return task
}
```

**After**:
```ts
createTask: async (data) => {
  const task = await api.tasks.create(data)
  set(state => ({ tasks: [task, ...state.tasks] }))
  return task
}
```

Same pattern for all stores:
- `authStore.ts` → `api.auth.login()`, `api.auth.logout()`, `api.auth.checkSession()`
- `taskStore.ts` → `api.tasks.*`
- `userStore.ts` → `api.users.*`
- `commentStore.ts` → `api.comments.*`
- `notificationStore.ts` → `api.notifications.*`
- `reportStore.ts` → `api.reports.*`
- `settingsStore.ts` → `api.settings.*`
- `auditStore.ts` → `api.audit.*`

#### 2.3 Remove `db.ts` dependents

After all stores are migrated:
- Delete direct usage of `import { db } from '@/lib/db'` in page components
- The only remaining usage is in `TaskDetail.tsx` for `db.checkDeadlinesAndOverdue()` and `db.checkWeeklyDigests()` — move these to the server side
- Delete `src/lib/db.ts`

---

### Phase 3: Offline Support (optional, 2-3 days)

If offline resilience is needed:

1. Keep a lightweight local IndexedDB cache
2. On server available: read from server, write to server
3. On server unavailable: read from cache, queue writes, sync on reconnect
4. Conflict resolution: last-write-wins with timestamp

This adds significant complexity. **Recommend skipping v1** and shipping as online-only first.

---

### Phase 4: Deployment (1 day)

#### Windows Server setup:
- Install .NET 9 Runtime
- Install SQL Server 2022 Express
- Create DB and user
- Deploy via IIS or as a Windows Service
- Configure HTTPS with cert
- Open firewall port

#### IIS deployment:
```
- Create App Pool (No Managed Code, identity=NetworkService)
- Point to publish folder
- Set HTTPS binding with cert
- Enable Websockets if needed for real-time
```

#### Client config:
- Electron app reads server URL from a config file or environment variable
- First-run dialog: "Enter your TeamTask Server address"
- Or use mDNS/ZeroConf for LAN discovery

---

### Phase 5: Real-time Updates (stretch, 2-3 days)

- Add SignalR hub to ASP.NET Core backend
- Client subscribes to task/notification updates
- Push notifications instead of polling

---

## Effort Summary

| Phase | What | Days | Dependencies |
|-------|------|------|-------------|
| 1 | ASP.NET Core API + DB | 2-3 | None |
| 2 | Frontend API layer + store rewrite | 1-2 | Phase 1 |
| 3 | Offline support | 2-3 | Phase 2 (skip for v1) |
| 4 | Deployment | 1 | Phase 1+2 |
| 5 | SignalR real-time | 2-3 | Phase 2 (stretch) |
| **Total** | | **7-12** | |

---

## Key Risks

1. **Breaking all existing localStorage data**: Users will lose their local data after migration. Migration script needed to export localStorage → JSON → import to server on first connection.
2. **Auth model change**: JWT replaces simple token. Refresh token rotation, expiry handling, and secure storage needed.
3. **Password rehash**: All existing SHA-256 hashes must be rehashed to BCrypt on first login (or migration script).
4. **Rate limiting**: Currently simulated in settings. Server must enforce real rate limits.
5. **Concurrency**: LocalStorage is synchronous single-user. Server has concurrent access — need proper locking/transactions.

---

## Migration Data Script

Before cutting over, provide a utility to export `ttm_data` from localStorage and POST to the server:

```ts
// tools/export-local-data.ts
const data = JSON.parse(localStorage.getItem('ttm_data'))
await fetch(`${serverUrl}/api/migrate/import`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
```

Server endpoint re-encrypts passwords to BCrypt and inserts with preserved IDs.

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/db.ts` | **DELETE** (entire file, 803 lines) |
| `src/api/client.ts` | **CREATE** |
| `src/api/auth.ts` | **CREATE** |
| `src/api/tasks.ts` | **CREATE** |
| `src/api/users.ts` | **CREATE** |
| `src/api/comments.ts` | **CREATE** |
| `src/api/notifications.ts` | **CREATE** |
| `src/api/reports.ts` | **CREATE** |
| `src/api/settings.ts` | **CREATE** |
| `src/api/audit.ts` | **CREATE** |
| `src/stores/authStore.ts` | **REWRITE** (db → api) |
| `src/stores/taskStore.ts` | **REWRITE** (db → api) |
| `src/stores/userStore.ts` | **REWRITE** (db → api) |
| `src/stores/commentStore.ts` | **REWRITE** (db → api) |
| `src/stores/notificationStore.ts` | **REWRITE** (db → api) |
| `src/stores/reportStore.ts` | **REWRITE** (db → api) |
| `src/stores/settingsStore.ts` | **REWRITE** (db → api) |
| `src/stores/auditStore.ts` | **REWRITE** (db → api) |
| `src/pages/TaskDetail.tsx` | **EDIT** (remove db refs) |
| `src/lib/analytics.ts` | **REWRITE** (send to server if opted in) |
| `src/App.tsx` | Possibly **EDIT** (add server URL config) |
