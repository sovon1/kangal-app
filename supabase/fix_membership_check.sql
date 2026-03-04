-- ============================================================================
-- KANGAL Security Patch: Fix Membership Check for Inactive Users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Update the helper to ONLY consider active members as valid mess members.
-- This prevents inactive/left members from accidentally accessing mess data through RLS.
CREATE OR REPLACE FUNCTION is_mess_member(p_mess_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mess_members
        WHERE mess_id = p_mess_id 
          AND user_id = auth.uid() 
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
