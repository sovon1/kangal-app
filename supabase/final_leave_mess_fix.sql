-- ============================================================================
-- FINAL LEAVE MESS & MEMBERSHIP FIX
-- This script ensures the database correctly handles 'inactive' members.
-- ============================================================================

-- 1. Fix the is_mess_member function (MUST check for 'active' status)
CREATE OR REPLACE FUNCTION public.is_mess_member(p_mess_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mess_members
    WHERE mess_id = p_mess_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix the is_mess_manager function (MUST check for 'active' status)
CREATE OR REPLACE FUNCTION public.is_mess_manager(p_mess_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mess_members
    WHERE mess_id = p_mess_id
    AND user_id = auth.uid()
    AND role = 'manager'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure users can update their own membership status (needed for leaving)
DROP POLICY IF EXISTS "mess_members_update_self" ON mess_members;
CREATE POLICY "mess_members_update_self" ON mess_members
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Ensure SELECT policy on mess_members also respects 'active' for others
-- but allows seeing yourself even if inactive (so you can see you left)
DROP POLICY IF EXISTS "mess_members_select" ON mess_members;
CREATE POLICY "mess_members_select" ON mess_members
FOR SELECT USING (
  is_mess_member(mess_id) OR auth.uid() = user_id
);

-- 5. Cleanup: If there are any duplicate active memberships for the same user-mess, 
-- keep only the newest one (optional but recommended for data integrity).
-- This is a one-time cleanup.
UPDATE mess_members m1
SET status = 'inactive'
WHERE status = 'active'
AND EXISTS (
    SELECT 1 FROM mess_members m2
    WHERE m2.mess_id = m1.mess_id
    AND m2.user_id = m1.user_id
    AND m2.status = 'active'
    AND m2.created_at > m1.created_at
);
