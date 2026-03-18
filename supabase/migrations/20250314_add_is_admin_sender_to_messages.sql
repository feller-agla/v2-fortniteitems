-- Fix messages table schema (run in Supabase SQL Editor)
-- Ensure: sender_id = UUID, text = message body, is_admin_sender = boolean

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_admin_sender boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id uuid;

-- If you get "invalid input syntax for type boolean" with a UUID, sender_id is probably boolean. Fix it:
-- Step 1: rename wrong column (if sender_id exists and is boolean)
-- ALTER TABLE public.messages RENAME COLUMN sender_id TO sender_id_old;
-- Step 2: add correct column
-- ALTER TABLE public.messages ADD COLUMN sender_id uuid;
-- Step 3: drop old column
-- ALTER TABLE public.messages DROP COLUMN sender_id_old;
