# UI Audit — Refactoring UI (10 Dimensions)

Date: 2026-07-12  
App: Nova Task Manager  
Base: All pages + components in `src/`

---

## 1. Visual Hierarchy — `establish-visual-hierarchy`

| Criteria | Verdict | Notes |
|---|---|---|
| Primary element has highest visual weight | ✅ PASS | Page titles use `text-lg font-bold` or `text-2xl font-black`; CTAs use filled `primary` buttons |
| Hierarchy uses weight + color, not just size | ✅ PASS | Combo of `font-black`/`font-bold`/`font-semibold`, color (`foreground`/`muted-foreground`/`muted-foreground/80`), and size |
| Surrounding elements subdued | ✅ PASS | Secondary text uses `text-muted-foreground`; tertiary uses `text-muted-foreground/60` |
| Clear primary→secondary→tertiary path | ✅ PASS | Consistent pattern across all pages |

**⚠️ Nits:**
- Chat page uses `text-[8px]` and `text-[9px]` — below the minimum readable size for UI text
- Settings use `text-caption` (~11px) as body helper text — borderline at 18px base

---

## 2. Typography Scale — `apply-typography-scale`

| Criteria | Verdict | Notes |
|---|---|---|
| Hand-crafted, not mathematical | ✅ PASS | Uses Tailwind/named sizes (xs, sm, base, lg, xl, 2xl, 5xl) |
| Uses px/rem, not em | ✅ PASS | Font-size tokens in `rem` |
| Minimum 25% jumps between sizes | ⚠️ PARTIAL | 8→9→10→11→12px are micro-steps. The main app scale has gaps (12→14→16→18→20px = 17%-14%-12%-11%) which are under 25% |
| Two weights only (400/500, 600/700) | ✅ PASS | Uses `font-normal`, `font-semibold`, `font-bold`, `font-black` |
| Never < 400 weight for UI | ⚠️ ISSUE | `.text-micro` is 10px at weight 400 — very small. `text-[8px]`, `text-[9px]` in Chat page are undersized |

**🔴 Issues:**
- Micro-steps: 10px (`text-micro`) → 11px (`text-caption`) → 12px (`text-xs`) are only ~10-12% jumps, far below the 25% minimum
- Chat uses 8px and 9px inline font sizes — below any reasonable minimum

**Recommendations:**
- Eliminate `text-caption` (11px) and `text-micro` (10px); use `text-xs` (12px) as the smallest size
- Replace `text-[8px]`/`text-[9px]` in Chat with `text-[10px]` at minimum

---

## 3. Color Palette — `build-color-palette`

| Criteria | Verdict | Notes |
|---|---|---|
| 8-10 grey shades | ✅ PASS | 12 neutral tokens: muted ×3, muted-foreground ×2, surface ×3, outline ×2, border + input |
| 5-10 primary shades | 🔴 FAIL | Only 1 base primary token; all lighter variants use `color-mix(primary X%, transparent)` instead of explicit shades |
| 5-10 accent shades each (red, green, yellow) | 🔴 FAIL | Same issue — `color-mix` for all tints, no explicit shade scale |
| Not using opacity for shades | 🔴 FAIL | `color-mix(in oklch, var(--primary) 8%, transparent)` is equivalent to opacity-based shading |
| Sufficient contrast | ✅ PASS | OKLCH values give good contrast in light and dark modes |

**🔴 Issues:**
- No explicit `primary-50` through `primary-900` scale — `color-mix` is used everywhere for hover states, backgrounds, and glows
- Same for destructive, success, warning — all rely on opacity mixing
- Hard to create consistent hover states (e.g., `hover:bg-primary/90` vs `hover:bg-destructive/90` use different opacities)

**Recommendations:**
- Define explicit OKLCH values for at least primary ×5, destructive ×5, success ×5, warning ×5
- Replace `color-mix` in hover/background classes with the explicit shade

---

## 4. Consistent Spacing — `apply-consistent-spacing`

| Criteria | Verdict | Notes |
|---|---|---|
| Systematic scale with 25% jumps | ✅ PASS | Tailwind scale (1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32) — all ≥25% jumps |
| Related elements small gaps (4-16px) | ✅ PASS | `gap-2` (8px) within form fields, `gap-3` (12px) within button groups, `gap-4` (16px) within card content |
| Sections larger gaps (24-64px) | ⚠️ PARTIAL | Sections use `space-y-5` (20px) or `space-y-6` (24px) — minimum range |
| Whitespace > borders | ⚠️ PARTIAL | Many sections still rely on `border-b`/`border-t` rather than increased spacing |
| Consistent internal padding | ✅ PASS | Card padding consistently `p-4` (16px) or `p-6` (24px); button padding uniform |

⚠️ **Issues:**
- `space-y-5` (20px) between sections is barely more than within-section gaps (16px)
- Many sections within cards use `border-b border-border/10` as separators instead of just increasing space

---

## 5. Button Hierarchy — `design-button-hierarchy`

| Criteria | Verdict | Notes |
|---|---|---|
| One clear primary action per section | ✅ PASS | Save/Create/Submit always use `primary` variant; dialogs have one primary action |
| Secondary actions visually subordinate | ✅ PASS | Cancel/Dismiss use `secondary` or `ghost` variants |
| Tertiary actions minimal | ✅ PASS | Text links or ghost buttons for tertiary |
| Clear visual distinction between levels | ✅ PASS | Filled brand vs outlined grey vs ghost — 3 distinct levels |
| Destructive doesn't compete with primary | ✅ PASS | Destructive buttons use red but are secondary/ghost in hierarchy |

✅ **No critical issues.** The button hierarchy is well-implemented.

**Nit:** Both "Reload" and "Go to Dashboard" in ErrorBoundary use identical secondary variant — they visually compete. Could demote "Go to Dashboard" to ghost.

---

## 6. Visual Clutter — `eliminate-visual-clutter`

| Criteria | Verdict | Notes |
|---|---|---|
| Every visual element serves a purpose | ⚠️ PARTIAL | Borders on nearly every card — many could be replaced with spacing |
| Whitespace used instead of borders | 🔴 NOT ENOUGH | `border border-border/10` on almost every container, plus `border-b`/`border-t` separators inside cards |
| No decorative shadows | ✅ PASS | Shadows are functional (card elevation, hover, modal) |
| Backgrounds used sparingly | ⚠️ PARTIAL | Every card has a background — the `glass-panel` + `glass-panel-inner` creates dual-layer backgrounds |
| Minimal separator lines | 🔴 TOO MANY | `border-b border-border/10` used between most card sections (profile, settings, task detail) |

**🔴 Issues:**
- "Border-itis": Every card has `border border-border/10` — ~80% of containers
- Separator lines (`border-b border-border/10`) used inside cards where spacing alone would suffice
- `double-bezel` pattern creates two visual layers (outer+inner) for every stat card — visually heavy

**Recommendations:**
- Remove `border-b`/`border-t` separators inside cards; double the `space-y` gap instead
- Consider flattening some cards to use spacing + shadow only (no border)

---

## 7. Empty States — `design-empty-states`

| Criteria | Verdict | Notes |
|---|---|---|
| Explains what would be here | ✅ PASS | EmptyState has title + description |
| Tells user how to add content | ⚠️ PARTIAL | Some states have CTAs (Create Task, Add User), others only describe ("No notifications") |
| Provides clear primary action | ⚠️ PARTIAL | Not all empty states include a CTA button |
| Appropriate illustration/icon | ✅ PASS | Uses contextual icons in the EmptyState component |
| Friendly, helpful tone | ✅ PASS | "No tasks yet — create your first task" style |
| Hides useless UI | ✅ PASS | Filters/tabs that don't work without content are shown but functional |

⚠️ **Issues:**
- Empty notification list: says "No notifications" but no CTA — could suggest checking settings
- Empty comments on task: EmptyState used but may lack full contextual guidance
- Empty search results in task list: has "Clear filters" action but no suggestion to broaden search

---

## 8. Shadows — `use-shadows-appropriately`

| Criteria | Verdict | Notes |
|---|---|---|
| Small shadows on cards | ✅ PASS | `shadow-card` is subtle, multi-layer OKLCH shadow |
| Modals: large shadow | ✅ PASS | `shadow-lg` on DialogContent |
| Dropdowns/menus: medium shadow | ✅ PASS | `shadow-md` on SelectContent |
| Cards: subtle or no shadow | ✅ PASS | `shadow-card` is barely visible |
| Hover states: subtle increase | ✅ PASS | `.hover-lift` adds shadow + translateY on hover |
| Static elements: no shadow | ⚠️ PARTIAL | Logo icon has `shadow-md shadow-primary/20` — decorative |
| 2-3 shadow levels max | ⚠️ ISSUE | Uses 4 levels: `shadow-card`, `shadow-raised`, `shadow-modal`, `shadow-diffusion` |

**⚠️ Issues:**
- Logo shadow is decorative (no functional elevation purpose)
- 4 shadow levels could be reduced to 3 (card/raised/modal)
- Some buttons have `shadow-lg shadow-primary/20` which is excessive for a button

---

## 9. Color Contrast — `manage-color-contrast`

| Criteria | Verdict | Notes |
|---|---|---|
| Normal text <18px: ≥4.5:1 | ⚠️ PARTIAL | Main text is high contrast, but `text-muted-foreground/60` and `/80` lower the ratio significantly |
| Large text ≥18px bold/≥24px: ≥3:1 | ✅ PASS | Large titles use full `--foreground` |
| UI components: ≥3:1 | ✅ PASS | Button borders use `--border` which is darker than background |
| Focus indicators: ≥3:1 | ✅ PASS | `focus-visible:ring-ring` uses primary color |

⚠️ **Issues:**
- `text-muted-foreground/60` on white bg: `muted-foreground` at 60% opacity will be ~2.9:1 — **fails WCAG AA**
- `text-muted-foreground/80`: ~3.8:1 — **fails WCAG AA** for normal text
- `disabled:opacity-50` on buttons: 50% of secondary grey may be <3:1

---

## 10. Group Related Elements — `group-related-elements`

| Criteria | Verdict | Notes |
|---|---|---|
| Related elements have small gap (8-16px) | ✅ PASS | `gap-2` (8px) form fields, `gap-3` (12px) button groups |
| Unrelated groups larger gap (24-48px) | ⚠️ PARTIAL | Section gaps `space-y-5` (20px) and `space-y-6` (24px) — minimum threshold |
| Form labels close to inputs (4-8px) | ✅ PASS | `space-y-2` (8px) between label and input |
| Sections clearly separated | ⚠️ PARTIAL | Between-section space is only slightly larger than within-section |
| Space hierarchy: tight↔loose↔loosest | ⚠️ PARTIAL | Most levels use similar gaps (16-24px) |

**⚠️ Issues:**
- Within-card section separation (`space-y-5` = 20px) is too close to within-element gaps (`space-y-2` = 8px) — the ratio is only 2.5×
- Per the skill, between-section gaps should be 32-64px (at least 4× the within-group gap)

---

## Summary

| Dimension | Verdict | Critical Issues |
|---|---|---|
| 1. Visual Hierarchy | ✅ PASS | Minor (8px text in Chat) |
| 2. Typography Scale | ⚠️ PARTIAL | Micro-steps between sizes; 8-11px text too small |
| 3. Color Palette | 🔴 FAIL | No explicit shade scale; relies on `color-mix` |
| 4. Consistent Spacing | ✅ PASS | Minor (section gaps could be larger) |
| 5. Button Hierarchy | ✅ PASS | None |
| 6. Visual Clutter | ⚠️ PARTIAL | Border-itis; too many separators |
| 7. Empty States | ✅ PASS | Minor (missing CTAs on a few) |
| 8. Shadows | ✅ PASS | Minor (4 levels instead of 3; decorative logo shadow) |
| 9. Color Contrast | ⚠️ PARTIAL | `text-muted-foreground/60` fails WCAG AA |
| 10. Group Related Elements | ✅ PASS | Minor (section gaps borderline) |

### Priority Fixes

| Priority | Dimension | Fix |
|---|---|---|
| 🔴 High | 3. Color Palette | Define explicit OKLCH shade scales for primary + accents; replace `color-mix` |
| 🔴 High | 9. Contrast | Increase `text-muted-foreground` opacity from /60 → /75 minimum |
| 🟡 Medium | 6. Clutter | Remove 50% of borders, use spacing instead; remove `border-b`/`border-t` separators inside cards |
| 🟡 Medium | 2. Typography | Eliminate `text-caption`/`text-micro`; use `text-xs` as minimum; fix Chat 8-9px text |
| 🟢 Low | 4. Spacing | Increase section gaps from `space-y-5` to `space-y-8` (32px) |
| 🟢 Low | 8. Shadows | Remove decorative logo shadow; reduce to 3 levels |
