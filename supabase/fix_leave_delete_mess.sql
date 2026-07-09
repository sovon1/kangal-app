-- ============================================================================
-- LEAVE MESS, DELETE MESS, AND REMOVE MEMBER RPC FIXES
-- ============================================================================

-- 1. Grant general RLS permission for messes delete
DROP POLICY IF EXISTS messes_delete ON public.messes;
CREATE POLICY messes_delete ON public.messes 
    FOR DELETE 
    USING (is_mess_manager(id));

-- 2. Leave Mess RPC (Security Definer to bypass RLS restrictions safely)
CREATE OR REPLACE FUNCTION public.leave_mess_safe(p_mess_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_member_id UUID;
    v_role user_role;
    v_active_member_count INT;
BEGIN
    -- Get current authenticated user's active membership in this mess
    SELECT id, role INTO v_member_id, v_role
    FROM public.mess_members
    WHERE mess_id = p_mess_id
      AND user_id = auth.uid()
      AND status = 'active'
    LIMIT 1;

    IF v_member_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not an active member of this mess.');
    END IF;

    -- Count other active members in the mess
    SELECT COUNT(*) INTO v_active_member_count
    FROM public.mess_members
    WHERE mess_id = p_mess_id
      AND status = 'active';

    IF v_role = 'manager' THEN
        -- If manager and only active member -> Delete the mess entirely
        IF v_active_member_count = 1 THEN
            DELETE FROM public.messes WHERE id = p_mess_id;
            RETURN jsonb_build_object('success', true, 'action', 'deleted_mess', 'message', 'Mess deleted successfully since you were the only member.');
        ELSE
            -- Manager but other active members exist -> Can't leave without transfer
            RETURN jsonb_build_object('success', false, 'error', 'You must transfer the manager role before leaving.');
        END IF;
    ELSE
        -- Regular member -> Mark as inactive (soft delete)
        UPDATE public.mess_members
        SET status = 'inactive',
            leave_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = v_member_id;

        -- Log the action
        INSERT INTO public.activity_log (mess_id, actor_id, action, details)
        VALUES (
            p_mess_id,
            auth.uid(),
            'member_left',
            jsonb_build_object('status', 'inactive')
        );

        RETURN jsonb_build_object('success', true, 'action', 'left_mess', 'message', 'You have successfully left the mess.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Delete Mess RPC (Security Definer to bypass RLS restrictions safely)
CREATE OR REPLACE FUNCTION public.delete_mess_safe(p_mess_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_status user_status;
    v_member_id UUID;
BEGIN
    -- Check if current authenticated user is manager of this mess
    SELECT id, role, status INTO v_member_id, v_role, v_status
    FROM public.mess_members
    WHERE mess_id = p_mess_id
      AND user_id = auth.uid()
      AND status = 'active'
    LIMIT 1;

    IF v_member_id IS NULL OR v_role IS DISTINCT FROM 'manager' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only active managers can delete the mess.');
    END IF;

    -- Delete the mess
    DELETE FROM public.messes WHERE id = p_mess_id;

    RETURN jsonb_build_object('success', true, 'message', 'Mess deleted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Remove / Kick Member RPC (Security Definer to bypass RLS restrictions safely)
CREATE OR REPLACE FUNCTION public.remove_member_safe(p_mess_id UUID, p_target_member_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_manager_exists BOOLEAN;
    v_target_role user_role;
    v_target_user_id UUID;
BEGIN
    -- Verify current caller is the manager
    SELECT EXISTS (
        SELECT 1 FROM public.mess_members
        WHERE mess_id = p_mess_id
          AND user_id = auth.uid()
          AND role = 'manager'
          AND status = 'active'
    ) INTO v_manager_exists;

    IF NOT v_manager_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only active managers can remove members.');
    END IF;

    -- Get target member role and user ID
    SELECT role, user_id INTO v_target_role, v_target_user_id
    FROM public.mess_members
    WHERE id = p_target_member_id
      AND mess_id = p_mess_id
      AND status = 'active';

    IF v_target_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Target member not found or is already inactive.');
    END IF;

    -- Cannot remove self (must use leave_mess or transfer manager)
    IF v_target_user_id = auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot remove yourself. Use Leave Mess or Delete Mess.');
    END IF;

    -- Deactivate the target member
    UPDATE public.mess_members
    SET status = 'inactive',
        leave_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = p_target_member_id;

    -- Log the action
    INSERT INTO public.activity_log (mess_id, actor_id, action, details)
    VALUES (
        p_mess_id,
        auth.uid(),
        'member_removed',
        jsonb_build_object('removed_member_id', p_target_member_id)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Member removed successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
