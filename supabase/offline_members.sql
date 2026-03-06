-- ============================================================================
-- MIGRATION: Add support for Offline / Manual Members
-- ============================================================================

-- 1. Alter mess_members table to allow offline members
-- offline members won't have a user_id
ALTER TABLE public.mess_members
    ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add columns to distinguish manual members
ALTER TABLE public.mess_members
    ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS manual_name TEXT;

-- 3. Replace the strict UNIQUE(mess_id, user_id) constraint
-- We only want unique user_ids if they actually log in.
-- Manual members with no user_id shouldn't conflict with each other.
ALTER TABLE public.mess_members
    DROP CONSTRAINT IF EXISTS mess_members_mess_id_user_id_key;

-- Create a partial unique index instead.
-- This ensures a single registered user can't join the same mess twice,
-- but allows infinite NULL user_ids for manual members.
DROP INDEX IF EXISTS mess_members_unique_real_user_idx;
CREATE UNIQUE INDEX mess_members_unique_real_user_idx
    ON public.mess_members (mess_id, user_id)
    WHERE user_id IS NOT NULL;
