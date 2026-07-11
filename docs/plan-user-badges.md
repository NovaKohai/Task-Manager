# Plan: Role & Department Badges

## Objective
Add **role badges** (admin, moderator/manager, developer, viewer) and **department badges** (ENG, QA, IT, HR, Finance, etc.) throughout the app, plus **job titles**. Every user mention should display these badges.

## Data Model Changes

### `src/lib/types.ts` — User type
```ts
export type User = {
  id: string
  username: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
  avatar?: string
  active: boolean
  approved: boolean
  createdAt: string
  title?: string        // free-text job title (e.g. "Software Engineer")
  department?: string   // department key (e.g. "engineering", "hr")
}
```

### `src/lib/constants.ts` — New exports
1. Role badge config (moved from AdminUsers.tsx into shared constants)
2. Department config with display labels + badge variants
3. Helper function `getDepartmentConfig(key)` for unknown departments

## Department Config (13 predefined)

| Key | Label | Badge Variant | Tag Color |
|-----|-------|--------------|-----------|
| engineering | ENG | primary | green |
| qa | QA | success | emerald |
| it | IT | warning | amber |
| hr | HR | danger | red |
| finance | Finance | default | brand |
| accounting | Accounting | outline | — |
| marketing | MKTG | primary | green |
| sales | Sales | success | emerald |
| operations | Ops | warning | amber |
| design | Design | danger | red |
| legal | Legal | outline | — |
| customer_support | Support | default | brand |
| product | Product | success | emerald |

## Improved Role Badges

- `admin` → `danger` (red) — visually distinct
- `manager` → `warning` (amber) — moderator tier
- `developer` → `success` (green) — standard user
- `viewer` → `outline` (subtle) — read-only

## Display Locations

### 1. Sidebar (`src/components/layout/Sidebar.tsx`)
Show under user name: role badge + department badge (if set)

### 2. Header (`src/components/layout/Header.tsx`)
Add small role tag after greeting text

### 3. Profile page (`src/pages/Profile.tsx`)
- Show role badge + department badge + title text as read-only display
- In edit mode: add title text input + department dropdown

### 4. Admin users table (`src/pages/AdminUsers.tsx`)
- New column "Department" showing department badge
- New column "Title" showing job title text
- Edit/Create dialog: add title text input + department dropdown
- Role badge column kept intact

### 5. TaskList (`src/pages/TaskList.tsx`)
Show role + department badges next to assignee name on each task card

### 6. TaskDetail (`src/pages/TaskDetail.tsx`)
Show role + department badges in the assignee section of the header

### 7. MyDashboard (`src/pages/MyDashboard.tsx`)
Show department badge on task items in open tasks list

### 8. ManagerDashboard (`src/pages/ManagerDashboard.tsx`)
Show department badge on task items in recent tasks section

## DB Migration

`src/lib/db.ts` — Version bump + add `title` and `department` as optional fields. Existing records auto-populate with undefined (optional fields).

## Files Touched

1. `src/lib/types.ts` — +2 fields
2. `src/lib/constants.ts` — +roleBadge map, +departmentConfig, +getDepartmentConfig helper
3. `src/lib/i18n.ts` — i18n keys for departments
4. `src/lib/db.ts` — schema version bump
5. `src/pages/AdminUsers.tsx` — table columns + edit dialog
6. `src/pages/Profile.tsx` — display + edit
7. `src/components/layout/Sidebar.tsx` — badges under name
8. `src/components/layout/Header.tsx` — small role tag
9. `src/pages/TaskList.tsx` — badges on task cards
10. `src/pages/TaskDetail.tsx` — badges next to assignee
11. `src/pages/MyDashboard.tsx` — badges on task items
12. `src/pages/ManagerDashboard.tsx` — badges on task items

## Implementation Order

1. Types & constants (foundation)
2. i18n keys
3. DB schema migration
4. Sidebar + Header (quick wins, visible immediately)
5. AdminUsers (table + dialog)
6. Profile page
7. TaskList, TaskDetail, MyDashboard, ManagerDashboard (task display)

## Edge Cases

- **No department set**: Don't render an empty badge — check `user.department` exists
- **Unknown department key**: Use `getDepartmentConfig(key)` which returns `{ variant: 'outline', label: key }` gracefully
- **No title set**: Don't render anything — check `user.title` exists
- **Edit user without permission**: Only admins can edit department/title of others; users can edit their own in Profile
- **DB records without new fields**: Optional fields → existing users show nothing until admin sets values
