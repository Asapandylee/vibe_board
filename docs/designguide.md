# Design Specification: VibeBoard

## 1. Design Philosophy

VibeBoard follows a **"Zen-Minimalist"** and **"Cyber-Functional"** aesthetic. The goal is to provide zero distraction, focusing entirely on the content (The Vibe) and the feeling of real-time presence.

- **Atmosphere:** Dark mode by default, clean, high-contrast.
- **Interaction:** Snappy, animated, and keyboard-friendly.
- **Layout:** Centered single-column "Feed" layout to maximize focus.

## 2. Visual Identity

### 2.1 Color Palette (Dark Mode)

| Element         | Hex Code  | Purpose                                    |
| --------------- | --------- | ------------------------------------------ |
| **Background**  | `#09090b` | Zinc-950 (Deep Black/Gray)                 |
| **Foreground**  | `#fafafa` | Zinc-50 (Near White Text)                  |
| **Muted**       | `#27272a` | Zinc-800 (Borders, Secondary Text)         |
| **Accent**      | `#8b5cf6` | Violet-500 (Primary buttons, Focus states) |
| **Destructive** | `#ef4444` | Red-500 (Delete actions)                   |

### 2.2 Typography

- **Primary Font:** `Geist Sans` or `Inter` (Sans-serif). Modern, highly readable.
- **Monospace:** `Geist Mono` for timestamps or metadata.
- **Sizes:** - Brand: 1.25rem (Bold)
- Vibe Content: 1.125rem (Medium)
- Metadata: 0.75rem (Muted)

## 3. Component UI Specifications

### 3.1 The Navigation Bar (Header)

- **Style:** Glassmorphism effect (`backdrop-blur-md` with semi-transparent background).
- **Elements:**
- Left: `VibeBoard` logo in bold sans-serif.
- Right: Clerk `<UserButton />` with a subtle ring matching the accent color.

### 3.2 The Vibe Input (Composer)

- **Style:** A floating or sticky input field at the top.
- **States:**
- **Focus:** Subtle outer glow using the accent color (`ring-2 ring-violet-500/50`).
- **Empty:** "What's your vibe?..." placeholder in muted text.
- **Validation:** Character counter (0/20) that turns red if limit is exceeded.

### 3.3 The Vibe Card (Feed Item)

- **Structure:**
- `[ Avatar ] [ User Name ] • [ Time Ago ]`
- `[ Vibe Content Text ]`

- **Animation:** New vibes should slide down from the top with a "fade-in" effect using **Framer Motion**.
- **Hover State:** Subtle background highlight and the appearance of the 'Delete' button for owners.

## 4. Motion & UX (The "Hip" Factor)

### 4.1 Real-time Transitions

- Use `framer-motion` for the feed. When a new message arrives:
- **Initial:** `{ opacity: 0, y: -20 }`
- **Animate:** `{ opacity: 1, y: 0 }`
- **Exit:** `{ opacity: 0, scale: 0.95 }`

### 4.2 Loading States

- Use **Skeleton Screens** (via `shadcn/ui`) for the initial data fetch to prevent layout shift.
- Pulse animation for the "Connecting to Real-time..." status indicator.

### 4.3 Feedback Loops

- **Optimistic UI:** When the user hits 'Send', the message appears immediately in a slightly transparent state (0.7 opacity) until the Supabase server confirms the insert.

## 5. Responsive Design

- **Mobile:** 100% width with horizontal padding (`px-4`).
- **Desktop:** Max-width restricted to `640px` (sm/md screen size) to keep the feed vertical and readable.
