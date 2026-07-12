# خطة تطوير Team Task Manager

## نبذة سريعة
ده تطبيق Electron بيشتغل local-first على جهازك بنفسه - مفيش سيرفر، كل البيانات في `localStorage` على جهازك. الـ stack:
- Electron + React 19 + Vite + TypeScript
- Zustand للـ state
- Tailwind v4 للأستايل
- Radix UI للـ dialogs/dropdowns
- لُغتين: إنجليزي وعربي (RTL)
- صلاحيات RBAC: admin / manager / developer / viewer

## نسق خطة الـ Plan جوه الـ docs

| ملف | دوره إيه |
|---|---|
| `docs/plan.md` | ده اللي إنت فاتحه دلوقتي - 10 features ترتيبهم حسب الأولوية |
| `docs/improvement-plan.md` | الإصلاحات الموجودة قبل كده - مفيش علاقة مباشرة بالـ features دي |
| `docs/seed-credentials.md` | كلمات سر الـ seed users عشان تقدر تجرب |
| `src/lib/types.ts` | الـ schema الأساسي لكل حاجة |
| `src/lib/db.ts` | db واحد فيه كل العمليات |

---

# الأساسيات (لازم تتعمل قبل الـ features)

> لأسباب security و a11y و code quality، الإصلاحات دي لازم تتعمل قبل أي feature جديد عشان الـ features متورّثش نفس المشاكل الموجودة.

## م0.1 — تقفل الـ Settings بالصلاحيات
**الملفات:** `AppShell.tsx`, `Settings.tsx`, `Support.tsx`, `types.ts`, `db.ts`

الـ Settings page دلوقتي أي حد يقدر يدخلها. الإصلاح يبدأ إن اللي داخل يكون عنده `settings.view`، والـ "edit" بس لو عنده `settings.edit`. زمان كنت بتاع IT بتفتح الـ IT queue على طول بسبب `user.department === 'it'` - ده تغيير لازم يبقى عن طريق صلاحية مش عن طريق القسم.

**الهدف:**
1. `/settings` يبقى guarded بصلاحية
2. الـ IT tab يتحكم فيه بصلاحية `support.manage` بدل الـ department check
3. أي ميزة جديدة (مثلاً Pomodoro في Settings) تشتغل على نفس النظام

**لماذا؟** من غير ده، Feature 4 (Pomodoro) و Feature 7 (Export) هيفضلوا مكشوفين لأي حد.

---

## م0.2 — استخراج الـ helpers المشتركة
**الملفات:** `lib/format.ts` (جديد), `lib/utils.ts`, `components/ui/DepartmentSelect.tsx` (جديد)

دلوقتي `formatDate` و `getUserName` مكررين في 6 ملفات على الأقل:
- ManagerDashboard.tsx
- MyDashboard.tsx
- TaskList.tsx
- TaskDetail.tsx
- Reports.tsx
- Support.tsx

**الهدف:**
1. تنقلهم لـ `lib/format.ts` مرة واحدة
2. تستبدلهم في الـ 6 ملفات
3. تطلع DepartmentSelect مشترك بدل ما يكون مكرر في AdminUsers و Profile

**لماذا؟** كل Feature من الـ features الـ 10 الجديدة هتلمس صفحات تانية، يعني لو فضلت التكرار ده، الكود هينفجر بسرعة.

---

## م0.3 — تحويل `Notification.type` من string لـ union
**الملفات:** `types.ts`, `db.ts`, `NotificationStore`, `Notifications.tsx`, وأي مكان تاني بيستخدم `type`

دلوقتي `Notification.type: string` - ده بيسبب bugs عشان أي حد يكتب أي string. لازم يبقى union بالـ types المعروفة:
```ts
type NotificationType = 
  | 'announcement' 
  | 'mention' 
  | 'assignment' 
  | 'deadline' 
  | 'digest' 
  | 'security' 
  | 'qa_review'
  | 'overdue'
```

**الهدف:**
1. تعمل union معروف
2. تستبدل كل `type: string` في الكود
3. تستفيد من `dedupKey` اللي موجود في الـ type بس مش متربط بأي حاجة

**لماذا؟** Feature 5 (Notification center) و Feature 10 (@mentions) محتاجين الـ type union عشان ميعملوش دوشة.

---

## م0.4 — إصلاح i18n.toggle إنه بيعمل reload
**الملفات:** `lib/i18n.ts`, `stores/` (ممكن تحتاج واحدة جديدة للـ locale)

دلوقتي لما تغيّر اللغة من إنجليزي لعربي، الصفحة كلها بتعمل reload وده بيمسح الـ state. الإصلاح إن الـ locale يبقى في Zustand store والـ component تعيد render من غير reload.

**الهدف:**
1. تنقل الـ locale الحالي لـ Zustand store
2. تشيل `window.location.reload()` من `i18n.toggle()`
3. تتأكد إن كل صفحة بتفهم اللغة الجديدة تلقائياً

**لماذا؟** Feature 2 (البحث في الـ tasks) هيعتمد على لو الـ locale بيتغير من غير ما يضيع الـ search. ده ضروري.

---

# Tier 1 — تتعمل بعد الأساسيات مباشرة (3 features)

## م1 — Subtasks / Checklists على الـ Task
**الملفات:** `types.ts`, `db.ts`, `TaskDetail.tsx`, `MyDashboard.tsx`, `i18n.ts`, `lib/constants.ts`

### المشكلة الحالية
الـ Task دلوقتي فيه `description` كنص بس، يعني أي حد بياخد مهمة كبيرة مفيش طريقة يقسّمها لـ steps صغيرة. ده بيخلي الـ tasks الـ 50 نقطة يبقوا "مهمة واحدة ضخمة" وبيتسقطوا.

### الحل
1. تضيف حقل جديد على `Task`:
```ts
type ChecklistItem = {
  id: string
  text: string
  done: boolean
  doneAt?: string
  doneBy?: string
}
```
التصبح في الـ `Task` نفسه `checklist: ChecklistItem[]`.

2. تعمل العمليات في `db.ts`:
   - `addChecklistItem(taskId, text)` - ضيف عنصر جديد
   - `toggleChecklistItem(taskId, itemId)` - علّم خلاص / مش خلاص
   - `removeChecklistItem(taskId, itemId)` - شيل عنصر
   - `reorderChecklist(taskId, orderedIds)` - رتّب العناصر

3. تعمل permission جديد: `subtask.toggle` في `types.ts` و `db.ts`.

4. تعمل checklist من `<fieldset><legend>` جوه `TaskDetail.tsx`، كل عنصر `<button role="checkbox" aria-checked>` عشان الـ screen readers تفهمها.

5. تضيف progress chip على `MyDashboard` للـ tasks اللي عندها open items.

### مين يقدر يعمل إيه
- **Owner** أو **assignee****: يشوف الـ checklist، يعدّل، يلغي.
- **Manager / Admin**: كل ده + يحذف عناصر.
- **Viewer**: يشوف بس (لو task.assign مش متاح ليه).

### الـ a11y المهمة هنا
- ولازم يكون الـ drag rtl-safe في المهمة الحساسة - الـ checklist لازم تكون `<fieldset>` بـ `<legend>` فيها "Subtasks (2 of 5)".
- كل عنصر لازم يكون `<button>` مش `<div onClick>` عشان الـ keyboard يفتحها.

### الـ i18n entries المطلوبة (~6 keys × 2 = 12)
- `task.checklist`
- `task.checklist.add`
- `task.checklist.empty`
- `task.checklist.progress`
- `task.checklist.count`
- `perm.subtask.toggle`

---

## م2 — بحث حقيقي وفلاتر في TaskList
**الملفات:** `Header.tsx`, `TaskList.tsx`, `AppShell.tsx`, `i18n.ts`

### المشكلة الحالية
الـ Header فيه input للبحث بس مش بيعمل حاجة فعلاً. ده decoy layer، بيسبب إن المستخدم يدخل ويطلع فاضي.

### الحل
1. تشيل input الـ search من الـ header Decoy، تخلّيه button يفتح `/tasks?search=...`، أو تشيله نهائياً لو مش محتاج.

2. تضيف URL-driven filters في `TaskList`:
   - `?q=...` للنص
   - `?status=todo|in_progress|done|cancelled`
   - `?priority=low|medium|high|critical`
   - `?assignee=userId`
   - `?project=ProjectName`

3. تستخدم `useSearchParams` و `useDebounce` (الموجودين فعلاً في الـ codebase).

4. تعمل filter chips فوق الجدول، كل chip بيقول كام مهمة matches.

5. تعمل saved views زي: "اعرض المهمات الـ open دي دايماً" - تتخزن في localStorage.

### مين يقدر يعمل إيه
- **أي حد عنده task.view_all أو task.edit.own**: يقدر يعمل بحث وفلتر.
- **Admin**: يقدر يحفظ view كـ default للكل (مستوى بيرمشن إضافي).

### الـ a11y المهمة هنا
- الـ filter chips لازم يكون عندها `aria-label` توضح الـ matches.
- الـ select elements لازم عندها labels حقيقية، مش placeholders.
- الـ URL لازم يتحدث لما تتغير الفلاتر عشان الناس يقدروا يعملوا share.

### الـ i18n entries المطلوبة (~12 keys × 2 = 24)
- `task_list.filter.status`
- `task_list.filter.priority`
- `task_list.filter.assignee`
- `task_list.filter.project`
- `task_list.filter.empty`
- `task_list.saved_view.label`
- `task_list.saved_view.save`
- `task_list.saved_view.remove`
- `task_list.saved_view.default`
- `task_list.search.placeholder`
- `task_list.search.clear`
- `task_list.results_count`

---

## م5 — Notification Center حقيقي
**الملفات:** `Header.tsx`, `Notifications.tsx`, `notificationStore.ts`, `db.ts`, `i18n.ts`

### المشكلة الحالية
- الـ bell في الـ Header مش بيعرضش عدد الـ unread.
- مفيش "mark all as read" في الـ dropdown.
- مفيش refresh على focus النافذة.
- `dedupKey` مكتوب في الـ type بس مش متستخدم فين.

### الحل
1. تضيف permission جديد: `notifications.view` في `types.ts` و `db.ts`.

2. تعمل unread badge في الـ Header bell:
   - `<span aria-live="polite">{unreadCount}</span>`
   - لو count > 0 الاعمل الأحمر بيظهر

3. تعمل mark-all-read button جوه `Notifications.tsx`.

4. تعمل polling كل 60 ثانية لما الـ tab تكون مرئية (refresh عند الـ focus).

5. تربط `dedupKey` اللي موجود فعلاً عشان لو حد اتمنشن مرتين في كومنت واحد، ميجيش غير notification واحدة.

6. تعمل filters: All / Unread / Announcement / Task existing فعلاً بس نضيف aria roles ناقصة.

### مين يقدر يعمل إيه
- **أي حد عنده `notifications.view`**: يشوف الجرس ويتصفح.
- **Owner**: يلغي أو يعلّم مقروء.
- **Admin**: كل ده + يقدر يعطل notification على مستوى user.

### الـ a11y المهمة هنا
- الـ badge لازم يكون `aria-live="polite"` عشان الـ screen reader تعلن لما العدد يتغير.
- filter chips لازم عندها `role="group"` مع `aria-label`.
- زر "mark all read" لازم `aria-label` يوضح اللي بيحصل.

### الـ i18n entries المطلوبة (~4 keys × 2 = 8)
- `notifications.unread_badge`
- `notifications.mark_all`
- `notifications.empty_filtered`
- `perm.notifications.view`

---

# Tier 2 — بعد ما Tier 1 يخلص (4 features)

## م4 — Pomodoro + Time Entries
**الملفات (جديدة):** `pages/Focus.tsx`, `lib/time.ts`
**الملفات (التعديل):** `types.ts`, `db.ts`, `Reports.tsx`, `Settings.tsx`, `i18n.ts`, `App.tsx`

### المشكلة الحالية
الـ Reports بتعرض "—" لكل metric ساعات، يعني مفيش حد بيعرف مين اشتغل كام ساعة على إيه. ده بيخلي تحديد الـ priorities بعد كده مبني على التخمين.

### الحل
1. تضيف type جديد في `types.ts`:
```ts
type TimeEntry = {
  id: string
  taskId: string
  userId: string
  startedAt: string
  endedAt: string | null
  durationMinutes: number
  kind: 'focus' | 'break'
}
```

2. تعمل صفحة جديدة `Focus.tsx` بـ route `/focus/:taskId?`:
   - بتعرض timer مع start / pause / stop
   - بتخزّن `startTimestamp` في الـ Component state
   - لما تعمل stop، بتحسب الـ minutes و تكتب TimeEntry في الـ db

3. تعمل صلاحية `effort.view_all` في الـ types عشان الـ manager بس يشوف وقت الفريق، مش أي حد.

4. تربط الـ Reports عشان بدل ما تعرض "—" تعرض متوسط الـ hours لكل assignee.

5. تضيف إعدادات في Settings:
   - `workDuration: 25` (دقيقة)
   - `breakDuration: 5`
   - `longBreakDuration: 15`

### مين يقدر يعمل إيه
- **أي حد عنده task.edit.own**: يبدأ focus session على مهمة مفيش assigned ليه.
- **Manager**: يشوف effort reports بتاعته + بتاعت الـ team.
- **Admin**: كل ده + edit الـ global work durations.

### الـ a11y المهمة هنا
- الـ timer لازم يكون `aria-live="polite"` يعلن لما يفضى الوقت.
- زرار الـ start/stop لازم `<button>` نقي، مش `<div onClick>`.
- الـ tooltip لازم يبقى dismissible (Radix HoverCard).

### الـ i18n entries المطلوبة (~10 keys × 2 = 20)
- `focus.start`
- `focus.stop`
- `focus.pause`
- `focus.completed`
- `focus.summary`
- `focus.saved`
- `settings.focus.work_duration`
- `settings.focus.break_duration`
- `settings.focus.long_break_duration`
- `perm.effort.view_all`

---

## م10 — @-mentions في الـ Comments
**الملفات:** `db.ts`, `commentStore.ts`, `Notifications.tsx`, `TaskDetail.tsx`, `i18n.ts`

### المشكلة الحالية
لو حد عمل comment لزميله، مفيش notification أوّل بيوصله. لازم حد تاني يفتح الـ Task ويشوف الـ comment.

### الحل
1. في `addComment` بـ `db.ts`:
   - parse الـ `content` للـ mentions بالـ regex `@(\w+)` (الـ usernames lowercase)
   - لكل mention حلّ username لـ userId
   - أنشئ `Notification` بـ `dedupKey: 'mention:<commentId>:<userId>'`
   - cap mentions عند 10 لكل comment عشان الـ DoS

2. تعمل permission جديد: `mention.create` في `types.ts` و `db.ts`.

3. تضيف highlight للـ mentioned username جوه Comment:
   - `<span class="mention">{username}</span>` مع `<a>` لو username حلّ لـ active user

4. تعمل filter في `Notifications.tsx`: "Mentions" badge يعرض بس الـ mentioned ones.

### مين يقدر يعمل إيه
- **أي حد عنده task.edit.own أو task.create**: يعمل mention في الـ comments.
- **Mentioned user**: يوصله notification على طول.
- **Admin**: يقدر يعطل mentions على مستوى النظام.

### الـ a11y المهمة هنا
- الـ mentioned username لازم يكون جوه visible text مش لون بس.
- لو عملت typeahead suggestions لازم يكون ARIA combobox (`role="combobox"` + `aria-activedescendant`).
- **تنبيه:** الـ v1 هيعمل parse بس من غير suggestions عشان الـ ARIA combobox معقد.

### الـ i18n entries المطلوبة (~3 keys × 2 = 6)
- `notifications.mention`
- `comment.mention_help`
- `perm.mention.create`

---

## م9 — Drag-and-Drop في Kanban
**الملفات:** `ManagerDashboard.tsx`, `db.ts`, `i18n.ts`

### المشكلة الحالية
الـ ManagerDashboard فيه 4 columns (todo / in_progress / done / cancelled) بس الـ statuses بتتغير بـ dropdown على كل مهمة. ده بطيء للـ manager اللي عنده 30 مهمة عايز يرتّبهم.

### الحل
1. تضيف permission جديد: `task.reorder` في `types.ts` و `db.ts`.

2. تعمل native HTML5 drag-and-drop (مش library) عشان منضفش dep جديد:
   - كل task card عنده `draggable={true}` و `onDragStart/onDragEnd`
   - كل column عنده `onDragOver/onDrop`
   - عند الـ drop اعمل optimistic update + rollback لو الـ db write فشل

3. تعمل keyboard alternative عشان WCAG 2.5.7:
   - كل card عليه "< Move left" و "> Move right" buttons ظاهرة لما الـ card ياخد focus

4. تعمل `moveTask(taskId, fromColumn, toColumn)` في الـ db:
   - check بيرمشن `task.reorder` أو `task.edit`
   - اكتب الـ audit log
   - ارجع الـ updated task

5. تعمل aria-live region اللي يعلن: "انتقلت لـ In Progress" (عربي).

### مين يقدر يعمل إيه
- **Manager / Admin**: يسحبوا الـ cards بين الـ columns.
- **Developer**: لو عنده task.edit على المهمة، يقدر يسحب بطريقته.
- **Viewer**: قراءة بس، الـ cards مفيش عليها drag handles.

### الـ a11y المهمة هنا
- **critical:** WCAG 2.5.7 بيقول drag-only reordering ممنوع، لازم يكون فيه keyboard alternative.
- كل drop لازم يعمل announce جوا الـ aria-live.
- الـ column headers لازم semantic.

### الـ i18n entries المطلوبة (~4 keys × 2 = 8)
- `kanban.move_next`
- `kanban.move_prev`
- `kanban.move_announce`
- `perm.task.reorder`

---

## م3 — Recurring Tasks
**الملفات:** `types.ts`, `db.ts`, `TaskDetail.tsx`, `CreateTask.tsx`, `Settings.tsx`, `i18n.ts`

### المشكلة الحالية
في tasks بتتكرر كل أسبوع أو كل شهر (stand-up، monthly report، backup check) - كل مرة لازم حد يعمل create يدوي. ده شغل تكرار سخيف.

### الحل
1. تضيف حقل على `Task`:
```ts
type Recurrence = {
  rule: 'none' | 'daily' | 'weekly' | 'monthly'
  endsOn?: string  // nullable ISO date
  sourceTaskId?: string  // الـ task اللي اتعمل منه الريكور
}
```

2. تضيف toggle jوه `CreateTask.tsx` و `TaskDetail.tsx`:
   - dropdown بسيط (مش cron، مش RRULE - YAGNI)
   - لو اختار recurring، input لـ `endsOn`

3. تعمل function في `db.ts`:
   - `tickRecurring()` - لما مهمة recurring تتم، أنشئ الـ next instance
   - next due date = previous due date + N days (مش من الـ close today، عشان predictable)
   - ادرج في الـ audit log

4. تعمل scheduler:
   - عند الـ startup، اتحقق من الـ tasks الـ recurring المكتملة
   - عند الـ window focus، إعادة check较快

5. تضيف badge "🔁 recurring" على الـ task card في `MyDashboard` - بس مع descriptive text مش icon بس.

### مين يقدر يعمل إاه
- **Manager / Admin / owner**: يفعّل recurrence على مهمة.
- **System**: يولّد الـ instances الـ next أوتوماتيك.

### الـ edge cases المهمة لازم enumerate في الكود
```ts
// cases: closed-on-due, closed-before-due, closed-after-due, no-due-date, endsOn-passed
```
اكتبهم كـ comment قبل الكود عشان ماتنساش واحدة.

### الـ i18n entries المطلوبة (~5 keys × 2 = 10)
- `task.recurrence.none`
- `task.recurrence.daily`
- `task.recurrence.weekly`
- `task.recurrence.monthly`
- `task.recurring_badge`

---

# Tier 3 — بعد ما Tier 1 + 2 يخلصوا (3 features)

## م7 — Export / Import (CSV + JSON)
**الملفات:** `electron/main.cjs`, `electron/preload.cjs`, `lib/exporter.ts` (جديد), `TaskList.tsx`, `Settings.tsx`, `types.ts`, `db.ts`, `i18n.ts`

### المشكلة الحالية
مفيش backup للبيانات غير تصوير الـ installer. لو الجهاز وقع، البيانات كلها تروح.

### الحل
1. Export CSV / JSON:
   - في الـ TaskList اعمل زر "Export CSV"
   - في الـ Settings اعمل زر "Export Full Snapshot (JSON)" و "Import Snapshot"

2. الجديدة في `electron/main.cjs`:
```js
ipcMain.handle('export:snapshot', async (event, data, defaultName) => {
  const { filePath } = await dialog.showSaveDialog({ defaultPath: defaultName })
  if (!filePath) return { saved: false }
  await fs.writeFile(filePath, data, 'utf8')
  return { saved: true, path: filePath }
})
```

3. في `electron/preload.cjs`: ضيف `electronAPI.exportSnapshot`.

4. Import محتاج Zod validation على الـ المستورد قبل `db.replaceAll()` عشان ميعملش bad data.

5. أضف audit action جديد: `snapshot_imported`, `snapshot_exported` في `AuditAction`.

### مين يقدر يعمل إيه
- **Admin بس**: Export / Import - ده admin action.
- **Manager**: Export بس للـ projects بتاعته.
- **Developer / Viewer**: لا حاجة.

### الـ security المهمة هنا
- **critical:** الـ Import لازم يكون Zod-validated، مش `JSON.parse()` وخلاص.
- التحقق قبل `db.replaceAll()` - لو فشل validation، abort.
- اسم الملف من `dialog:save` trusted (الـ Electron بيـ sanitize).

### الـ i18n entries المطلوبة (~6 keys × 2 = 12)
- `export.csv`
- `export.json`
- `import.json`
- `import.confirm_phrase`
- `export.include_comments`
- `export.include_attachments`

---

## م6 — File Attachments على الـ Tasks
**الملفات:** `types.ts`, `db.ts`, `TaskDetail.tsx`, `Settings.tsx`, `i18n.ts`

### ملحوظة مهمة
ده **مرتبط** بـ SQLite migration اللي موجودة في `docs/plan.md` priest. الـ dلوقتي `localStorage` عندها حد 5 MB. الـ attachments على شكل base64 بتاخد ~137% من حجم الملف الأصلي، يعني:
- صورة 256 KB → 350 KB في base64
- 5 صور 256 KB → 1.75 MB → مقبول
- 10 صور 500 KB → 6.85 MB → overflow

### الحل
1. تضيف type جديد في `types.ts`:
```ts
type Attachment = {
  id: string
  taskId: string
  name: string
  mime: string
  sizeBytes: number
  dataBase64: string
  uploadedBy: string
  uploadedAt: string
}
```

2. تعمل في `db.ts`:
   - `addAttachment(taskId, file)` - validate MIME + size
   - `removeAttachment(attachmentId)`
   - `getAttachments(taskId)` - cache size check

3. تعمل dropzone في `TaskDetail.tsx`:
   - validate الـ MIME prefix (`data:image/...; base64,...`)
   - max 256 KB لكل ملف
   - max 5 attachments لكل task
   - preview بـ `<img>` + `<Dialog>` من Radix

4. تعمل banner في Settings: "إنت عندك X.X MB من 5 MB المحلي - لو قربت، اعمل snapshot export"

5. **لو الـ SQLite migration اتعملت قبل ده، الـ limit يتحذف.**

### مين يقدر يعمل إيه
- **Owner / assignee**: يعمل attach.
- **أي حد عنده task.view_all / view.own**: يشوف الـ attachments.
- **Manager / Admin**: يحذف.

### الـ a11y المهمة هنا
- كل attachment لازم عنده alt text مشتقة من الـ filename.
- الـ "×" buttons لازم تأخذ hit area ≥ 24×24.

### الـ i18n entries المطلوبة (~7 keys × 2 = 14)
- `attachment.drop`
- `attachment.size_error`
- `attachment.count_error`
- `attachment.preview_alt`
- `attachment.remove`
- `attachment.uploading`
- `settings.storage_warning`

---

## م8 — Keyboard Shortcuts
**الملفات (جديدة):** `hooks/useKeyboardShortcuts.ts`
**الملفات (التعديل):** `AppShell.tsx`, كل صفحة (للـ shortcut wires), `Settings.tsx`, `i18n.ts`

### الحل
1. تعمل hook موحد `useKeyboardShortcuts()`:
   - بيعمل listener على `keydown`
   - بيعمل skip لو الـ target input أو textarea أو contenteditable
   - بيرجع cleanup function للـ unmount

2. تعرّف الـ shortcuts الأساسية (مش قابلة للتعديل في v1):
   - `g t` → Tasks
   - `g d` → Dashboard
   - `g s` → Settings
   - `c` → Create task (لو modal مش مفتوح)
   - `?` → يفتح shortcut overlay
   - `Esc` → يقفل أي Radix Dialog مفتوح (Radix بيعمله naturally)

3. تعمل overlay Radix Dialog:
   - يعرض كل الـ shortcuts
   - focus-trap مفتوح (Radix بيديها)
   - زرار close أو Esc

4. ضيف toggle في Settings: `enableKeyboardShortcuts: boolean`.

### مين يقدر يعمل إيه
- **أي حد**: يستخدم الـ shortcuts لو مفعّلة في الـ settings.
- الـ Admin**: يعطلها على مستوى النظام أو كل user.

### الـ a11y المهمة هنا
- **critical:** WCAG 2.1.4 بيقول الـ character shortcuts لازم يبقوا toggleable.
- لازم يتعمل skip لو الـ target input/textarea عشان الـ shortcuts متسرقش الكتابة.
- الـ overlay لازم `role="dialog"` + `aria-describedby` (Radix بيعمله).

### الـ i18n entries المطلوبة (~6 keys × 2 = 12)
- `shortcuts.overlay_title`
- `shortcuts.gt`
- `shortcuts.c`
- `shortcuts.toggle`
- `shortcuts.disable`
- `settings.keyboard_shortcuts`

---

# الملخص النهائي

## ترتيب التنفيذ الموصى به

1. **الأساسيات (م0.1 → م0.4)**: ≈ أسبوع
2. **Tier 1 (م1 → م2 → م5)**: ≈ 2-3 أسابيع
3. **Tier 2 (م4 → م10 → م9 → م3)**: ≈ 3-4 أسابيع
4. **Tier 3 (م7 → م8)**: ≈ 1-2 أسابيع، بالـ parallel مع أي حاجة تانية
5. **Tier 3 (م6)**: بعد ما الـ SQLite migration تخلص

## ملاحظات ختامية

- كل feature جديد بيركّب على اللي قبله. متبدأش Feature 4 قبل ما الأساسيات تخلص.
- كل الليست بـ i18n entries دي مقسومة على `en` و `ar`. أي feature جديد بياخد entries جدد، لازم تخلص الاتنين.
- الصلاحيات الجديدة: `subtask.toggle`, `notifications.view`, `effort.view_all`, `mention.create`, `task.reorder` - لازم تتعرّف في `ALL_PERMISSIONS` و `ROLE_PERMISSIONS` في `db.ts`.
- Documentation: أي حاجة جديدة تتعمل، اعمل PR بـ Conventional Commits و ركّب الـ commit attribution المطلوب.
