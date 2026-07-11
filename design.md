# TeamTask — UI/UX Design System & Visual Specification

This document details the visual language, design system, layout grid templates, typography specifications, and animation kinetics implemented inside the **TeamTask** desktop application.

---

## 1. Design Philosophy & Visual Archetype

TeamTask is designed around the **Ethereal Glass / Soft Structuralist** visual archetype. It blends physical hardware layers (depth and tactile surfaces) with digital glassmorphism to create a premium, clean, and highly readable task management space.

*   **Tactility**: Containers use double-bezel borders (`.double-bezel-outer` and `.double-bezel-inner`) to mimic nested plastic or aluminum plates.
*   **Depth & Elevation**: Elevated components use semi-transparent backdrops (`backdrop-blur-xl`) and diffuse shadows to sit above background layers.
*   **Micro-animations**: Tiny, spring-like movements on hover, select, and status change states make the app feel responsive and "alive."

---

## 2. Color System (OKLCH Space)

The color palette is declared using the modern, uniform lightness OKLCH color space. This prevents visual fatigue in Dark Mode and ensures high contrast ratios for accessibility.

| Token | Light Mode Value | Dark Mode Value | Context / Component |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.985 0 0)` | `oklch(0.09 0.005 110)` | Global window canvas background |
| `--foreground` | `oklch(0.13 0.01 110)` | `oklch(0.97 0.002 110)` | Main body text, titles, labels |
| `--card` | `oklch(1 0 0)` | `oklch(0.13 0.005 110)` | Bento plates, forms, inner layouts |
| `--primary` | `oklch(0.53 0.15 160)` | `oklch(0.58 0.15 160)` | Branding, buttons, action highlights |
| `--border` | `oklch(0.88 0.004 110)` | `oklch(0.2 0.005 110)` | Nested hair-line grids |
| `--muted-foreground`| `oklch(0.5 0.01 110)` | `oklch(0.75 0.008 110)`| Subtitles, descriptions, task dates |
| `--success` | `oklch(0.62 0.17 145)` | `oklch(0.65 0.17 145)` | Completed tasks, approval updates |
| `--destructive` | `oklch(0.55 0.2 25)` | `oklch(0.55 0.2 25)` | Overdue alerts, delete actions |

---

## 3. Typography & Font Hierarchy

To ensure perfect readability in both languages, TeamTask uses separate typographic hierarchies for Latin and Arabic scripts. 

*   **Arabic Typography**:
    *   **Font Family**: `Cairo` (imported from Google Fonts).
    *   **Design Rationale**: A clean, modern geometric Arabic typeface that ensures text remains highly legible at small sizes, especially in dark mode.
    *   **Styling**: Font weights are increased (medium/semibold) and text size is boosted by `1.2x` globally for Arabic screens (`html.rtl body`).
*   **Latin Typography**:
    *   **Font Family**: `Outfit Variable` / `Plus Jakarta Sans`.
    *   **Design Rationale**: A geometric sans-serif font optimized for numeric charts, dates, code items, and layout headers.
*   **Technical Monospace**:
    *   **Font Family**: `JetBrains Mono Variable`.
    *   **Usage**: Technical logs, task identification numbers, and settings metrics.

---

## 4. UI Components & Layout Templates

### A. The Double-Bezel Bento Card
All primary cards, task lists, dashboards, and settings pages are enclosed inside nested double-bezel wrappers to replicate physical panels:

```html
<div class="double-bezel-outer">
  <div class="double-bezel-inner">
    <!-- Component Content -->
  </div>
</div>
```
*   `double-bezel-outer`: Renders the outermost border with a smooth radius (`rounded-2xl` / `rounded-3xl`) and background glass opacity (`bg-card/40`).
*   `double-bezel-inner`: Nested inside with padding (`p-1.5` / `p-2`) to construct a physical bezel gap, rendering the main background color and inner shadow accents.

### B. Action Buttons & Inputs
*   **Primary Action Buttons**:
    *   Fully rounded pills (`rounded-full`) or smooth squircles (`rounded-[var(--radius-sm)]`).
    *   Hover effect: Smooth expansion with subtle box shadow transitions using a customized spring transition.
*   **Input Fields**:
    *   Rendered with a clean background (`bg-background/50`) and a thin border (`border-border/60`).
    *   Focus state: Outer highlight ring using `--primary` color to provide clear keyboard focus feedback.

---

## 5. Specific Feature Screens (UI/UX specs)

### A. User Profile & Avatar Upload (`Profile.tsx`)
*   **Layout**: Balanced grid displaying personal information on the left and security password update on the right.
*   **Avatar Editor**:
    *   Circular avatar slot (`h-24 w-24`) with an overlaid camera icon on hover.
    *   Supports drag-and-drop or selection of image files, automatically converting them to optimized Base64 strings to preserve offline SQLite compatibility.
    *   Includes immediate feedback on successful upload.

### B. Admin User Approvals (`AdminUsers.tsx`)
*   **Layout**: Two-tab workspace split between:
    1.  `Active Users` (جدول الموظفين النشطين).
    2.  `Pending Approvals` (جدول طلبات الانضمام المعلقة).
*   **Action Flow**: Shows user profiles, email, role badges. Admins can click "Approve" (موافقة) to instantly active accounts, or "Reject" (رفض) to remove pending registrations.
*   **Broadcast Banner**: Contains a floating dialog modal allowing admins to quickly write and broadcast text announcements to all active users instantly.

### C. Notification Feed & Modal Announcer (`Notifications.tsx`)
*   **Layout**: A unified bento plate showing a scrollable list of activity notifications.
*   **Unread Indicators**: Unread alerts feature a neon dot (`bg-primary`) and a subtle background glow (`bg-primary/[0.02]`).
*   **Interaction**:
    *   Clicking a task alert redirects the user to the task detail page.
    *   Clicking an announcement alert opens a dedicated popup modal displaying the full title, date, and paragraph text written by the administrator, marking the alert as read.

---

## 6. Motion, Kinetics, and Transition Curves

Linear animations are replaced with custom cubic-bezier spring physics curves to make interactions satisfying:

*   **Global Transition Curve**:
    `transition: all 0.7s cubic-bezier(0.32, 0.72, 0, 1)` (provides instant acceleration with a gentle decelerating spring bounce on arrive).
*   **CSS Class**: `.spring-transition`
*   **Page Transitions**: Slide up and fade-in entry configurations (`translate-y-6 opacity-0` transitioning to `translate-y-0 opacity-100` over 600ms).

---

## 7. Native OS Shell & Window Identity

*   **Window Titlebar Icon**: Set to a local `icon.png` inside the packaged `electron` directory to ensure taskbar branding is rendered correctly in both development and production.
*   **Window Bounds**: Fixed min-width `960px` and min-height `600px` to prevent bento panels from overlapping on small displays.
*   **Desktop Installer**: Packaged with a custom `icon.ico` compiled with multi-resolution files (16x16 to 256x256) to ensure the installer and executable files render sharp branding on Windows desktops.
