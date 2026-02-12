# TRD: VibeBoard (Technical Requirements Document)

## 1. System Architecture

VibeBoard follows a serverless, real-time architecture utilizing Next.js as the full-stack framework, Supabase as the backend/database, and Clerk for identity management.

- **Frontend:** Next.js 15 (App Router)
- **Backend:** Next.js Server Actions (for Mutations)
- **Database:** Supabase (PostgreSQL)
- **Real-time Engine:** Supabase Realtime (via WebSockets)
- **Auth:** Clerk (Identity & Session Middleware)

## 2. Technical Stack Detail

| Layer          | Technology   | Description                                                   |
| -------------- | ------------ | ------------------------------------------------------------- |
| **Framework**  | Next.js 15   | Leveraging Server Components (RSC) and Server Actions.        |
| **Language**   | TypeScript   | Strict type safety for DB schemas and component props.        |
| **Database**   | Supabase     | Managed Postgres with Row Level Security (RLS) enabled.       |
| **Auth**       | Clerk        | Handles social OAuth, session tokens, and User UI components. |
| **Styling**    | Tailwind CSS | Utility-first CSS for rapid UI development.                   |
| **UI Library** | shadcn/ui    | Radix UI-based accessible components (Input, Button, Toast).  |

## 3. Database Design & Security

### 3.1 Schema: `messages` table

- **id**: `uuid` (Primary Key, Default: `gen_random_uuid()`)
- **user_id**: `text` (Not Null, Clerk User ID)
- **user_name**: `text` (Not Null, Display Name)
- **content**: `text` (Not Null, Check: length <= 20)
- **inserted_at**: `timestamptz` (Not Null, Default: `now()`)

### 3.2 Row Level Security (RLS) Policies

- **Enable RLS**: `ALTER TABLE messages ENABLE ROW LEVEL SECURITY;`
- **Select Policy**: Anyone can read vibes.
- **Insert Policy**: Only authenticated users can post (`auth.uid()` is not null).
- **Delete Policy**: Users can only delete their own vibes (`auth.uid() = user_id`).

## 4. Application Logic & Data Flow

### 4.1 Mutation (Write Operations)

- **Flow**: User Input -> Server Action (`actions.ts`) -> Clerk Auth Check -> Supabase Insert.
- **Server Action**: Use `auth()` from `@clerk/nextjs/server` to validate the session. Ensure `user_id` from Clerk matches the inserted record to prevent identity spoofing.

### 4.2 Real-time Synchronization (Read Operations)

- **Initial Fetch**: Handled via a Server Component (RSC) to ensure fast First Contentful Paint (FCP).
- **Subscription**: Client Component uses `supabase.channel('messages').on('postgres_changes', ...)` to listen for `INSERT` and `DELETE` events.
- **State Merge**: Use `useEffect` to subscribe to changes and update the local `useState` array to reflect the live feed in real-time.

## 5. Component Architecture

- **/app/layout.tsx**: Root layout with `ClerkProvider` and global styles.
- **/app/page.tsx**: Main Server Component that fetches initial 20 messages from Supabase.
- **/components/vibe-input.tsx**: Client Component handling the form input and **Optimistic UI** (via `useOptimistic`).
- **/components/vibe-list.tsx**: Client Component managing the Supabase Real-time channel subscription.
- **/lib/supabase.ts**: Singleton instance for the Supabase Browser Client.

## 6. Infrastructure & Env Variables

The following environment variables are required in `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 7. Performance & Error Handling

- **Optimistic UI**: Show the vibe immediately on the client side to provide a latency-free experience.
- **Validation**: Character limit (20 chars) enforced at the UI level (HTML `maxlength`) and DB level (`CHECK` constraint).
- **Error Handling**: Use `sonner` or `toast` for failed DB operations and implement a basic `Loading.tsx` skeleton for the initial feed load.
