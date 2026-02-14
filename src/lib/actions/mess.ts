'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createMessSchema, joinMessSchema } from '@/lib/validations';

// ============================================================================
// CREATE MESS
// ============================================================================

export async function createMess(input: unknown) {
    const parsed = createMessSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { name, address } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Create the mess
    const { data: mess, error: messError } = await supabase
        .from('messes')
        .insert({
            name,
            address: address || null,
            created_by: user.id,
        })
        .select('id, invite_code')
        .single();

    if (messError || !mess) {
        return { error: messError?.message || 'Failed to create mess' };
    }

    // 2. Add creator as manager
    const { error: memberError } = await supabase
        .from('mess_members')
        .insert({
            mess_id: mess.id,
            user_id: user.id,
            role: 'manager',
            status: 'active',
        });

    if (memberError) {
        // Rollback: delete the mess
        await supabase.from('messes').delete().eq('id', mess.id);
        return { error: memberError.message };
    }

    // 3. Create the first cycle (current month)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { error: cycleError } = await supabase
        .from('mess_cycles')
        .insert({
            mess_id: mess.id,
            name: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'open',
        });

    if (cycleError) {
        console.error('Failed to create initial cycle:', cycleError);
    }

    // 4. Create default meal cutoff config
    await supabase
        .from('meal_cutoff_config')
        .insert({
            mess_id: mess.id,
        });

    return { success: true, messId: mess.id, inviteCode: mess.invite_code };
}

// ============================================================================
// JOIN MESS
// ============================================================================

export async function joinMess(input: unknown) {
    const parsed = joinMessSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { inviteCode } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Find the mess by invite code
    const { data: mess, error: messError } = await supabase
        .from('messes')
        .select('id, name, max_members')
        .eq('invite_code', inviteCode.trim())
        .single();

    if (messError || !mess) {
        return { error: 'Invalid invite code. Please check and try again.' };
    }

    // 2. Check if already a member
    const { data: existing } = await supabase
        .from('mess_members')
        .select('id')
        .eq('mess_id', mess.id)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        return { error: 'You are already a member of this mess.' };
    }

    // 3. Check member limit
    const { count } = await supabase
        .from('mess_members')
        .select('id', { count: 'exact' })
        .eq('mess_id', mess.id)
        .eq('status', 'active');

    if (count && mess.max_members && count >= mess.max_members) {
        return { error: 'This mess has reached its maximum member capacity.' };
    }

    // 4. Join as member
    const { error: joinError } = await supabase
        .from('mess_members')
        .insert({
            mess_id: mess.id,
            user_id: user.id,
            role: 'member',
            status: 'active',
        });

    if (joinError) {
        return { error: joinError.message };
    }

    return { success: true, messId: mess.id, messName: mess.name };
}

// ============================================================================
// TRANSFER MANAGER ROLE
// ============================================================================

export async function transferManager(input: {
    messId: string;
    newManagerMemberId: string;
}) {
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Verify current user is the manager
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('id, role')
        .eq('mess_id', input.messId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

    if (!currentMember || currentMember.role !== 'manager') {
        return { error: 'Only the current manager can transfer the role.' };
    }

    // 3. Call Atomic RPC (Fixes Manager Transfer Risk)
    const { error: rpcError } = await supabase.rpc('transfer_mess_manager', {
        p_mess_id: input.messId,
        p_current_manager_id: user.id,
        p_new_manager_member_id: input.newManagerMemberId
    });

    if (rpcError) return { error: rpcError.message };

    return { success: true };
}
