-- ============================================================================
-- MIGRATION: Support Offline / Manual Members
-- ============================================================================

-- 1. Alter mess_members table to support offline members
ALTER TABLE mess_members
DROP CONSTRAINT IF EXISTS mess_members_user_id_fkey CASCADE;

-- Re-add the foreign key, but MAKE IT NULLABLE
ALTER TABLE mess_members
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE mess_members
ADD CONSTRAINT mess_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add manual flags
ALTER TABLE mess_members
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE mess_members
ADD COLUMN IF NOT EXISTS manual_name TEXT;

-- We want to ensure that either user_id is provided, or (is_manual = true AND manual_name is not null)
ALTER TABLE mess_members
ADD CONSTRAINT check_member_identity 
CHECK (
    (is_manual = FALSE AND user_id IS NOT NULL) OR
    (is_manual = TRUE AND manual_name IS NOT NULL AND TRIM(manual_name) <> '')
);

-- Note: In PostgreSQL, if we drop a unique constraint that was used for an index, we need to recreate the index
ALTER TABLE mess_members
DROP CONSTRAINT IF EXISTS mess_members_mess_id_user_id_key;

-- We only want unique user_ids per mess IF they are not manual. Manual members don't have user_ids.
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_per_mess 
ON mess_members(mess_id, user_id) 
WHERE user_id IS NOT NULL AND is_manual = FALSE;

-- ============================================================================
-- NOTE: 
-- You will need to run this script in the Supabase SQL Editor to apply these changes.
-- ============================================================================
