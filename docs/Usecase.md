# Use Cases: VibeBoard

## UC-1: Live Vibe Sharing

- **Actor:** Authenticated User
- **Preconditions:** User must be logged in via Clerk.
- **Flow:**
  1. User enters a short message (e.g., "M4 Air is fire! 🔥") into the input field.
  2. User clicks the 'Send' button or presses 'Enter'.
  3. The application triggers a Next.js Server Action to insert the record into Supabase.
  4. **The Magic:** Supabase Realtime broadcasts the change.
  5. All active users' screens update instantly to show the new message at the top of the feed.
- **Postconditions:** The message is persisted in the database and visible to all users.

## UC-2: Access Control & Guardrails

- **Actor:** Anonymous Visitor
- **Flow:**
  1. Visitor opens the VibeBoard.
  2. Visitor can see the live feed of messages.
  3. Visitor attempts to type in the input box.
  4. The UI displays a "Sign in to share your vibe" message.
  5. The 'Send' button is disabled or hidden.
  6. Visitor clicks the 'Sign In' button and is redirected to the Clerk Auth page.

## UC-3: Self-Managed Cleanup

- **Actor:** Message Owner
- **Flow:**
  1. User views the list of messages.
  2. The system identifies messages where `user_id` matches the current Clerk `userId`.
  3. A 'Delete' icon (X) is rendered only for those specific messages.
  4. User clicks 'Delete'.
  5. The application calls a Server Action to delete the row in Supabase.
  6. The message disappears from all connected clients' feeds in real-time.
