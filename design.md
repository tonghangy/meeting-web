# Design System for Meeting Detail Page

## 1. Design Goal

This redesign makes the meeting detail page feel like a professional SaaS workbench: clearer hierarchy, stronger status communication, denser but readable operational data, and a maintainable multi-theme system. The page must keep all existing business behavior, support theme switching, and work well on Huawei MatePad, phones, and desktop screens.

## 2. Reference Page Design Language

The live URL `https://8.130.18.115/viewer.html` could not be safely opened in the browser because the certificate failed with `ERR_CERT_COMMON_NAME_INVALID`. The visual language below is based on the user-provided screenshot of that page.

The reference has a dark, technical control-room character. It uses a near-black grid background, thin blue-gray panel borders, dense rectangular modules, and strong operational status tags. The first impression is precise, instrument-like, and slightly futuristic rather than decorative.

The layout is a workbench: a top title/status bar, a left stack of configuration/status panels, a large primary preview area, and lower control/log modules. Content is arranged in rigid grids with tight gaps. The visual weight sits on the main preview panel, while the side panels carry structured metadata.

The color system leans on deep navy/black backgrounds, cyan-blue accents for primary actions, muted blue-gray text for secondary data, amber for waiting/status emphasis, and subtle red for disabled or destructive states. Borders are visible and structural; shadows are minimal.

Typography is compact and bold. Titles are high-contrast, metadata labels are smaller and muted, values are stronger, and status text is short. Chinese labels use clear system fonts and generous line height. Numeric, protocol, and status values are presented in fixed-feeling blocks.

Components are squared panels, bordered fields, solid rectangular primary buttons, muted secondary/disabled actions, compact labels, dense key-value rows, and status chips. Hover/active states should be restrained: border brightening, slight surface shift, and color change rather than large motion.

## 3. Adapted Product Direction

Keep the reference page's dark workbench logic, fine borders, grid background, prominent status, and high-contrast primary action. Weaken the broadcast-control specificity: no oversized video preview, no fake logs, no streaming controls, and no copied labels. For this meeting product, the same language becomes a meeting command center: meeting state, core metadata, access actions, and participant management.

The default `reference-inspired` theme should feel closest to the screenshot, while `professional-light` and `focus-dark` provide calmer everyday alternatives. All themes share the same layout and component structure.

## 4. Information Architecture

- Top navigation / page shell: global product title, user identity, creation/playback/admin links, logout, and theme switcher.
- Page title area: meeting title, status badge, room number, host, schedule, and primary action.
- Meeting core information: room number, host, status, scheduled start, access mode, meeting type, and join link.
- Meeting status area: status badge plus contextual action availability, such as whether the meeting can be joined now.
- Participants: current invitees, invitee status, last reminder, remind/remove actions, and candidate chips for adding people.
- Summary / minutes: future backend-backed section only; do not show fake content.
- Action items: future backend-backed section only; do not show fake content.
- Transcript: future backend-backed section only; do not show fake content.
- Attachments or related materials: future backend-backed section only; do not show fake content.
- Timeline: future backend-backed section only; do not show fake content.
- AI insights or key conclusions: future backend-backed section only; do not show fake content.
- Operation area: enter meeting, edit, delete, and return to list.

## 5. Layout Rules

- Desktop: use a constrained workbench container up to about 1440px. Place the hero at the top, then a two-column grid with the core information as the main column and actions/management summary as the side rail.
- MatePad landscape: keep the two-column layout when width permits, but reduce gaps and ensure all touch targets are at least 44px tall.
- MatePad portrait and mobile: collapse into a single column. Convert dense tables into stacked cards or definition-list style blocks.
- Main/side ratio: main content should take roughly 2fr and the side rail 1fr on wide screens.
- Card/panel spacing: use 16px to 24px gaps, following the 4px spacing grid.
- Sticky rules: side rail can be sticky on desktop only; never sticky on small screens.
- Long content: links and long room names must wrap with `overflow-wrap: anywhere`; no horizontal page overflow is allowed.

## 6. Design Tokens

### Color Tokens

- --color-bg
- --color-bg-subtle
- --color-surface
- --color-surface-elevated
- --color-border
- --color-border-strong
- --color-text
- --color-text-muted
- --color-text-subtle
- --color-primary
- --color-primary-hover
- --color-primary-soft
- --color-success
- --color-warning
- --color-danger
- --color-info

### Typography Tokens

- --font-size-xs: 12px
- --font-size-sm: 14px
- --font-size-md: 16px
- --font-size-lg: 18px
- --font-size-xl: 22px
- --font-size-2xl: 28px
- --line-height-tight: 1.2
- --line-height-normal: 1.5
- --line-height-relaxed: 1.7
- --font-weight-regular: 400
- --font-weight-medium: 500
- --font-weight-semibold: 600
- --font-weight-bold: 700

### Spacing Tokens

- --space-1: 4px
- --space-2: 8px
- --space-3: 12px
- --space-4: 16px
- --space-5: 20px
- --space-6: 24px
- --space-8: 32px
- --space-10: 40px
- --space-12: 48px

### Radius Tokens

- --radius-sm: 4px
- --radius-md: 6px
- --radius-lg: 8px
- --radius-xl: 12px
- --radius-2xl: 16px
- --radius-full: 999px

### Shadow Tokens

- --shadow-sm
- --shadow-md
- --shadow-lg
- --shadow-xl
- --shadow-focus

### Motion Tokens

- --motion-fast: 120ms
- --motion-normal: 180ms
- --motion-slow: 260ms
- --ease-standard: cubic-bezier(0.2, 0, 0, 1)
- --ease-emphasized: cubic-bezier(0.2, 0, 0, 1)

## 7. Theme Presets

### reference-inspired

Closest to the screenshot. Use a deep navy grid background, dark panels, blue-gray borders, cyan primary actions, amber status accents, and compact workbench density. It should feel technical and professional, not flashy.

### professional-light

Clean light SaaS style for daily office use. Use a pale gray background, white surfaces, blue primary actions, restrained borders, soft shadows, and high readability for long information pages.

### focus-dark

Dark reading and analysis mode. Use less cyan saturation than the reference theme, clearer text contrast, deeper surfaces, and calm accent colors so meeting notes and future AI analysis remain readable.

## 8. Component Guidelines

- Page shell: contains global navigation and page content. Use responsive padding, max width, and no horizontal overflow.
- Header: product label, user identity, route actions, and theme switcher. Wrap on small screens and keep touch targets at least 40px.
- Breadcrumb: optional for deeper flows; muted text, compact spacing, and clear current page state.
- Meeting hero section: title, status, host/time/room summary, and primary action. Desktop can use horizontal alignment; mobile stacks.
- Status badge: compact pill or edge-accent badge. Use text plus color, never color alone.
- Metadata item: icon, label, value. Use muted label, strong value, and wrapping for long links.
- Participant chip: rounded bordered chip with name and optional role/status. Maintain 40px minimum height on touch devices.
- Insight card: future backend-backed section only. Use elevated surface and short conclusion text when data exists.
- Summary card: future backend-backed section only. Use readable line length and relaxed line height.
- Action item card: future backend-backed section only. Include owner, due time, and state when data exists.
- Transcript block: future backend-backed section only. Use chronological grouping and strong speaker labels.
- Timeline item: future backend-backed section only. Use vertical rhythm and timestamp alignment.
- Tabs: use segmented controls with visible active state and keyboard focus.
- Button: icon plus text when action benefits from recognition. Primary is solid; secondary is muted; outline is transparent; danger uses danger token.
- Icon button: use for compact tools only, always with `aria-label`.
- Dropdown: use for theme or overflow options; current implementation uses segmented buttons for clarity.
- Empty state: quiet panel with concise text and no fake data.
- Loading skeleton: use subtle surface blocks or a centered loading panel.
- Error state: visible danger color, clear message, and no hidden failures.

## 9. Accessibility Rules

- Text contrast should target WCAG AA: normal text at least 4.5:1 and large text at least 3:1.
- All interactive elements need visible `:focus-visible` styling using `--shadow-focus`.
- Keyboard operation must work for links, buttons, and theme controls.
- Icon-only buttons must have `aria-label`; icon plus text is preferred for key actions.
- Status cannot rely on color alone; include readable text such as "进行中" or "待开始".
- Mobile touch targets must be at least 40px tall, with 44px preferred for MatePad and phones.

## 10. Implementation Notes

- CSS tokens and theme presets live in `src/styles/app.css` under `:root` and `html[data-theme=...]`.
- Theme switching is implemented with `ThemeProvider`, `useTheme`, and `ThemeSwitcher`. The selected theme is stored in `localStorage` under `meeting-web-theme`.
- Meeting detail remains in `src/pages/MeetingDetailPage.tsx`, split into local presentation components to avoid over-expanding the file tree.
- Files changed: `design.md`, `package.json`, `package-lock.json`, `src/context/ThemeContext.tsx`, `src/components/ThemeSwitcher.tsx`, `src/components/AppLayout.tsx`, `src/main.tsx`, `src/pages/MeetingDetailPage.tsx`, and `src/styles/app.css`.
- Existing routes, API paths, auth flow, meeting actions, and backend response types remain unchanged.
