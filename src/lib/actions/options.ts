'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient as getSupabase } from '@/lib/supabase/server';

// ============================================================================
// START NEW MONTH (Manager executes, Member requests)
// ============================================================================

export async function startNewMonth(messId: string, currentCycleId: string, newMonthName: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check role
    const { data: member } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    if (member?.role === 'manager') {
        // Manager: Execute directly via DB function
        // The DB function close_month_and_create_next handles closing current and creating next
        // But wait, the existing pg function `close_month_and_create_next` might not take a name argument for the new month
        // Let's check the schema or strict implementation.
        // Actually, looking at previous schema context, `closeMonth` in `finance.ts` called `close_month_and_create_next`.
        // That function auto-generates the name.
        // If we want a custom name, we might need to update the new cycle after creation.

        // Let's call the existing logic
        const { error } = await supabase.rpc('close_mess_month', {
            p_cycle_id: currentCycleId
        });

        if (error) return { error: error.message };

        // If specific name provided, update the newly created cycle
        // The function creates a cycle starting tomorrow. We need to find the new open cycle.
        if (newMonthName) {
            const { data: newCycle } = await supabase
                .from('mess_cycles')
                .select('id')
                .eq('mess_id', messId)
                .eq('status', 'open')
                .order('start_date', { ascending: false })
                .limit(1)
                .single();

            if (newCycle) {
                await supabase
                    .from('mess_cycles')
                    .update({ name: newMonthName })
                    .eq('id', newCycle.id);
            }
        }

        revalidatePath('/dashboard');
        return { success: true, message: 'New month started successfully' };

    } else {
        // Member: Request approval
        const { error } = await supabase.from('activity_log').insert({
            mess_id: messId,
            actor_id: user.id,
            action: 'request_new_month',
            details: {
                cycle_id: currentCycleId,
                new_month_name: newMonthName,
                status: 'pending'
            }
        });

        if (error) return { error: error.message };
        return { success: true, message: 'Request submitted for approval' };
    }
}

// ============================================================================
// GET ALL MONTHS
// ============================================================================

export async function getAllMonths(messId: string) {
    const supabase = await getSupabase();

    // Check permissions (any active member)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: months, error } = await supabase
        .from('mess_cycles')
        .select('*')
        .eq('mess_id', messId)
        .order('start_date', { ascending: false });

    if (error) return { error: error.message };
    return { data: months };
}

// ============================================================================
// RENAME CYCLE (Manager only)
// ============================================================================

export async function renameCycle(cycleId: string, newName: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check manager role
    // We can do a join or two queries.
    // First get the mess_id of the cycle
    const { data: cycle } = await supabase
        .from('mess_cycles')
        .select('mess_id')
        .eq('id', cycleId)
        .single();

    if (!cycle) return { error: 'Cycle not found' };

    const { data: member } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', cycle.mess_id)
        .eq('user_id', user.id)
        .single();

    if (member?.role !== 'manager') return { error: 'Only managers can rename months' };

    const { error } = await supabase
        .from('mess_cycles')
        .update({ name: newName })
        .eq('id', cycleId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/options');
    return { success: true };
}

// ============================================================================
// DELETE MESS (Manager executes, Member requests)
// ============================================================================

export async function deleteMess(messId: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: member } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    if (member?.role === 'manager') {
        // Manager: Delete directly
        // Messes table has CASCADE on delete?
        // Let's assume standard cascading delete or we might need to delete related items first.
        // Usually, top-level delete is enough if FKs are set to CASCADE.
        // Based on schema review, mess_members, mess_cycles, etc references messes(id) ON DELETE CASCADE.

        const { error } = await supabase
            .from('messes')
            .delete()
            .eq('id', messId);

        if (error) return { error: error.message };
        return { success: true, message: 'Mess deleted successfully' };

    } else {
        // Member: Request approval
        const { error } = await supabase.from('activity_log').insert({
            mess_id: messId,
            actor_id: user.id,
            action: 'request_delete_mess',
            details: {
                status: 'pending'
            }
        });

        if (error) return { error: error.message };
        return { success: true, message: 'Request submitted for approval' };
    }
}
