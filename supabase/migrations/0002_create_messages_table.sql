-- Migration: create messages table for VibeBoard real-time status board
-- Ensures pgcrypto available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL CHECK (char_length(content) <= 20),
  inserted_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS 'VibeBoard real-time status messages. Max 20 characters per vibe.';

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read vibes (including anonymous visitors)
CREATE POLICY "Anyone can read messages"
  ON public.messages FOR SELECT
  USING (true);

-- Allow inserts (auth checked at Server Action level via Clerk)
CREATE POLICY "Allow inserts"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- Allow deletes (ownership checked at Server Action level via Clerk)
CREATE POLICY "Allow deletes"
  ON public.messages FOR DELETE
  USING (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
