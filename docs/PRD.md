# PRD: VibeBoard (Simple Real-time Status Board)

## 1. Project Overview

- **Product Name:** VibeBoard
- **Definition:** A minimalist, real-time "status board" where users share their current mood or thoughts in 20 characters or less.
- **Core Objective:** To master the seamless integration of **Clerk** (Auth), **Supabase** (DB/Real-time), and **Next.js** (Framework) while maintaining a high-quality developer experience.

## 2. Target Features (MVP)

### P0: Critical Path

- **Seamless Authentication (Clerk):** One-tap Social Login (Google/Github). Protected write access.
- **The "Vibe" Stream (Real-time Read):** A live feed that updates instantly when anyone posts, without a page refresh.
- **Lightweight Posting (Create):** A simple input for 20-character status updates using Next.js Server Actions.

### P1: Polish

- **Ownership Control (Delete):** Users can remove their own vibes.
- **Optimistic UI:** Instant visual feedback when posting (immediate UI update before server confirmation).

## 3. Technical Specifications

### Database Schema (`messages` table)

| Column        | Type        | Default             | Description                     |
| :------------ | :---------- | :------------------ | :------------------------------ |
| `id`          | `uuid`      | `gen_random_uuid()` | Primary Key                     |
| `user_id`     | `text`      | -                   | Clerk User ID (Unique)          |
| `user_name`   | `text`      | -                   | Display Name from Clerk Profile |
| `content`     | `text`      | -                   | The Vibe (Max 20 chars)         |
| `inserted_at` | `timestamp` | `now()`             | Sorting & Time-ago display      |

### Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Clerk
- **Backend/DB:** Supabase (PostgreSQL + Realtime)
- **Styling:** Tailwind CSS + shadcn/ui (Dark Mode default)

## 4. Development Roadmap

1. **Phase 1:** Project initialization & Env setup (Clerk/Supabase keys).
2. **Phase 2:** Database schema deployment & Realtime publication setup.
3. **Phase 3:** Clerk Middleware & Layout integration (UserButton).
4. **Phase 4:** Implementing Server Actions for `Create` and `Delete`.
5. **Phase 5:** Connecting the `useRealtime` hook for the live feed.
