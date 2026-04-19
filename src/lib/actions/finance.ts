'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { depositSchema, updateDepositSchema, fixedCostSchema, individualCostSchema } from '@/lib/validations';

// ============================================================================
// ADD DEPOSIT
// ============================================================================

export async function addDeposit(input: unknown) {
    const parsed = depositSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { cycleId, messId, memberId, amount, paymentMethod, referenceNo, notes } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check if current user is manager (auto-approve)
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    const isManager = currentMember?.role === 'manager';

    const { error } = await supabase
        .from('transactions')
        .insert({
            mess_id: messId,
            cycle_id: cycleId,
            member_id: memberId,
            amount,
            payment_method: paymentMethod,
            reference_no: referenceNo || null,
            notes: notes || null,
            approval_status: isManager ? 'approved' : 'pending',
            approved_by: isManager ? user.id : null,
            created_by: user.id,
        });

    if (error) return { error: error.message };

    // Log activity
    await supabase.from('activity_log').insert({
        mess_id: messId,
        actor_id: user.id,
        action: 'deposit_added',
        details: { member_id: memberId, amount, payment_method: paymentMethod, status: isManager ? 'approved' : 'pending' },
    });

    return { success: true };
}

// ============================================================================
// UPDATE DEPOSIT
// ============================================================================

export async function updateDeposit(input: unknown) {
    const parsed = updateDepositSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { id, cycleId, messId, memberId, amount, paymentMethod, referenceNo, notes } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Fetch existing deposit to check permissions
    const { data: deposit, error: fetchErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchErr || !deposit) return { error: 'Deposit not found' };

    // Check manager status
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    const isManager = currentMember?.role === 'manager';
    const isOwner = deposit.created_by === user.id;

    // Only let managers edit approved deposits, owners can edit pending
    if (deposit.approval_status === 'approved' && !isManager) {
        return { error: 'Cannot edit an approved deposit. Ask your manager.' };
    }
    if (!isManager && !isOwner) {
        return { error: 'Unauthorized to edit this deposit.' };
    }

    const { error } = await supabase
        .from('transactions')
        .update({
            amount,
            payment_method: paymentMethod,
            reference_no: referenceNo || null,
            notes: notes || null,
            // If it was already approved and manager edits it, it stays approved.
            // If creator edits a pending, it stays pending.
        })
        .eq('id', id);

    if (error) return { error: error.message };

    // Log activity
    await supabase.from('activity_log').insert({
        mess_id: messId,
        actor_id: user.id,
        action: 'deposit_edited',
        details: { deposit_id: id, amount, payment_method: paymentMethod },
    });

    return { success: true };
}

// ============================================================================
// DELETE DEPOSIT
// ============================================================================

export async function deleteDeposit(depositId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: deposit, error: fetchErr } = await supabase
        .from('transactions')
        .select('*, mess_members(role)')
        .eq('id', depositId)
        .single();

    if (fetchErr || !deposit) return { error: 'Deposit not found' };

    // Check permissions
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', deposit.mess_id)
        .eq('user_id', user.id)
        .single();

    const isManager = currentMember?.role === 'manager';
    const isOwner = deposit.created_by === user.id;

    if (deposit.approval_status === 'approved' && !isManager) {
        return { error: 'Cannot delete an approved deposit.' };
    }
    if (!isManager && !isOwner) {
        return { error: 'Unauthorized to delete this deposit.' };
    }

    const { error: deleteErr } = await supabase.from('transactions').delete().eq('id', depositId);
    if (deleteErr) return { error: deleteErr.message };

    // Log activity
    await supabase.from('activity_log').insert({
        mess_id: deposit.mess_id,
        actor_id: user.id,
        action: 'deposit_deleted',
        details: { deposit_id: depositId, amount: deposit.amount },
    });

    return { success: true };
}

// ============================================================================
// APPROVE / REJECT DEPOSIT
// ============================================================================

export async function approveDeposit(
    depositId: string,
    action: 'approved' | 'rejected'
) {
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: currentMember } = await supabase
        .from('transactions')
        .select('mess_id, mess_members!inner(role, user_id)')
        .eq('id', depositId)
        .eq('mess_members.user_id', user.id)
        .single();

    // In order to check role, we need the mess_id. Let's get the deposit's mess_id first.
    const { data: deposit } = await supabase.from('transactions').select('mess_id').eq('id', depositId).single();
    if (!deposit) return { error: 'Deposit not found' };

    const { data: memberRole } = await supabase.from('mess_members').select('role').eq('mess_id', deposit.mess_id).eq('user_id', user.id).single();
    if (memberRole?.role !== 'manager') return { error: 'Only managers can approve or reject deposits' };

    const { error } = await supabase
        .from('transactions')
        .update({
            approval_status: action,
            approved_by: user.id,
        })
        .eq('id', depositId);

    if (error) return { error: error.message };

    return { success: true };
}

// ============================================================================
// ADD FIXED COST
// ============================================================================

export async function addFixedCost(input: unknown) {
    const parsed = fixedCostSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { cycleId, messId, costType, description, amount } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: memberRole } = await supabase.from('mess_members').select('role').eq('mess_id', messId).eq('user_id', user.id).single();
    if (memberRole?.role !== 'manager') return { error: 'Only managers can add fixed costs' };

    const { error } = await supabase
        .from('fixed_costs')
        .insert({
            mess_id: messId,
            cycle_id: cycleId,
            cost_type: costType,
            description: description || null,
            amount,
            created_by: user.id,
        });

    if (error) return { error: error.message };

    return { success: true };
}

// ============================================================================
// ADD INDIVIDUAL COST
// ============================================================================

export async function addIndividualCost(input: unknown) {
    const parsed = individualCostSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { cycleId, messId, memberId, description, amount } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check if the current user is a manager (auto-approve)
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    const isManager = currentMember?.role === 'manager';

    const { error } = await supabase
        .from('individual_costs')
        .insert({
            mess_id: messId,
            cycle_id: cycleId,
            member_id: memberId,
            description,
            amount,
            approval_status: isManager ? 'approved' : 'pending',
            approved_by: isManager ? user.id : null,
            created_by: user.id,
        });

    if (error) return { error: error.message };

    return { success: true };
}

// ============================================================================
// APPROVE / REJECT INDIVIDUAL COST
// ============================================================================

export async function updateCostApproval(
    costId: string,
    action: 'approved' | 'rejected',
    rejectionReason?: string
) {
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: cost } = await supabase.from('individual_costs').select('mess_id').eq('id', costId).single();
    if (!cost) return { error: 'Cost not found' };

    const { data: memberRole } = await supabase.from('mess_members').select('role').eq('mess_id', cost.mess_id).eq('user_id', user.id).single();
    if (memberRole?.role !== 'manager') return { error: 'Only managers can approve or reject costs' };

    const updateData: Record<string, unknown> = {
        approval_status: action,
        approved_by: user.id,
    };

    if (action === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
        .from('individual_costs')
        .update(updateData)
        .eq('id', costId);

    if (error) return { error: error.message };

    return { success: true };
}

// ============================================================================
// CLOSE MONTH (Calls the stored procedure)
// ============================================================================

export async function closeMonth(cycleId: string) {
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Call the atomic stored procedure
    const { data, error } = await supabase.rpc('close_mess_month', {
        p_cycle_id: cycleId,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true, newCycleId: data };
}

// ============================================================================
// GET DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(messId: string, cycleId: string) {
    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    // Parallel queries for dashboard data
    const [
        membersResult,
        mealRateResult,
        todayMealsResult,
        bazaarResult,
        depositsResult,
        cycleResult,
    ] = await Promise.all([
        // Active members count
        supabase
            .from('mess_members')
            .select('id', { count: 'exact' })
            .eq('mess_id', messId)
            .eq('status', 'active'),

        // Current meal rate (call the stored function)
        supabase.rpc('calculate_meal_rate', { p_cycle_id: cycleId }),

        // Today's meals
        supabase
            .from('daily_meals')
            .select('breakfast, lunch, dinner, guest_breakfast, guest_lunch, guest_dinner')
            .eq('mess_id', messId)
            .eq('meal_date', today),

        // Total bazaar expense for cycle
        supabase
            .from('bazaar_expenses')
            .select('total_amount')
            .eq('cycle_id', cycleId)
            .eq('approval_status', 'approved'),

        // Total deposits for cycle (approved only)
        supabase
            .from('transactions')
            .select('amount')
            .eq('cycle_id', cycleId)
            .eq('approval_status', 'approved'),

        // Cycle dates for progress
        supabase
            .from('mess_cycles')
            .select('start_date, end_date')
            .eq('id', cycleId)
            .single(),
    ]);

    // Calculate today's meal count
    const todayMealCount = (todayMealsResult.data || []).reduce((sum, m) => {
        return sum +
            (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0) +
            (m.guest_breakfast || 0) + (m.guest_lunch || 0) + (m.guest_dinner || 0);
    }, 0);

    // Calculate cycle progress
    let cycleProgress = 0;
    let daysRemaining = 0;
    if (cycleResult.data) {
        const start = new Date(cycleResult.data.start_date);
        const end = new Date(cycleResult.data.end_date);
        const now = new Date();
        const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
        const elapsed = Math.max((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
        cycleProgress = Math.min(Math.round((elapsed / totalDays) * 100), 100);
        daysRemaining = Math.max(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
    }

    return {
        currentMealRate: Number(mealRateResult.data) || 0,
        provisionalMealRate: Number(mealRateResult.data) || 0,
        totalMembers: membersResult.count || 0,
        activeMembers: membersResult.count || 0,
        totalMealsToday: todayMealCount,
        totalBazaarExpense: (bazaarResult.data || []).reduce((s, e) => s + Number(e.total_amount), 0),
        totalDeposits: (depositsResult.data || []).reduce((s, d) => s + Number(d.amount), 0),
        cycleProgress,
        daysRemaining,
    };
}

// ============================================================================
// GET MESS OVERVIEW (Whole mess aggregate stats)
// ============================================================================

export async function getMessOverview(messId: string, cycleId: string) {
    const supabase = await getSupabaseServerClient();

    const [
        messResult,
        cycleResult,
        depositsResult,
        mealsResult,
        mealRateResult,
        bazaarResult,
        individualResult,
        fixedResult,
    ] = await Promise.all([
        // Mess name & code
        supabase.from('messes').select('name, invite_code').eq('id', messId).single(),

        // Cycle info
        supabase.from('mess_cycles').select('start_date, end_date, status, name').eq('id', cycleId).single(),

        // Total deposits across all members (approved only)
        supabase.from('transactions').select('amount').eq('cycle_id', cycleId).eq('approval_status', 'approved'),

        // Total meals across all members
        supabase
            .from('daily_meals')
            .select('breakfast, lunch, dinner, guest_breakfast, guest_lunch, guest_dinner')
            .eq('cycle_id', cycleId),

        // Meal rate
        supabase.rpc('calculate_meal_rate', { p_cycle_id: cycleId }),

        // Total bazaar (shared) expense
        supabase.from('bazaar_expenses').select('total_amount').eq('cycle_id', cycleId).eq('approval_status', 'approved'),

        // Total individual costs
        supabase.from('individual_costs').select('amount').eq('cycle_id', cycleId).eq('approval_status', 'approved'),

        // Total fixed costs
        supabase.from('fixed_costs').select('amount').eq('cycle_id', cycleId),
    ]);

    const totalDeposits = (depositsResult.data || []).reduce((s, d) => s + Number(d.amount), 0);

    const totalMeals = (mealsResult.data || []).reduce((sum, m) => {
        return sum +
            (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0) +
            (m.guest_breakfast || 0) + (m.guest_lunch || 0) + (m.guest_dinner || 0);
    }, 0);

    const mealRate = Number(mealRateResult.data) || 0;
    const totalMealCost = totalMeals * mealRate;
    const totalBazaarCost = (bazaarResult.data || []).reduce((s, e) => s + Number(e.total_amount), 0);
    const totalFixedCost = (fixedResult.data || []).reduce((s, e) => s + Number(e.amount), 0);
    const totalIndividualCost = (individualResult.data || []).reduce((s, e) => s + Number(e.amount), 0);

    // messBalance represents the actual CASH in the mess pool.
    // We spent money on Bazaar, Fixed Costs, and Individual Costs payouts.
    // Total Meal Cost is NOT a cash expense (it's just bazaar distributed).
    const messBalance = totalDeposits - (totalBazaarCost + totalFixedCost + totalIndividualCost);

    // Format month name from cycle
    let monthLabel = '';
    if (cycleResult.data?.start_date) {
        const d = new Date(cycleResult.data.start_date);
        monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return {
        messName: messResult.data?.name || 'Mess',
        inviteCode: messResult.data?.invite_code || '',
        cycleName: cycleResult.data?.name || '',
        cycleStatus: cycleResult.data?.status || 'open',
        monthLabel,
        messBalance,
        totalDeposits,
        totalMeals,
        totalMealCost,
        mealRate,
        totalIndividualCost,
        totalSharedCost: totalBazaarCost + totalFixedCost,
    };
}

// ============================================================================
// GET MEMBER BALANCE (Calls the stored procedure)
// ============================================================================

export async function getMemberBalance(memberId: string, cycleId: string) {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc('calculate_member_balance', {
        p_member_id: memberId,
        p_cycle_id: cycleId,
    });

    if (error) return { error: error.message };

    const row = Array.isArray(data) ? data[0] : data;

    return {
        openingBalance: Number(row?.opening_balance) || 0,
        totalDeposits: Number(row?.total_deposits) || 0,
        totalMeals: Number(row?.total_meals) || 0,
        mealRate: Number(row?.meal_rate) || 0,
        mealCost: Number(row?.meal_cost) || 0,
        fixedCostShare: Number(row?.fixed_cost_share) || 0,
        individualCostTotal: Number(row?.individual_cost_total) || 0,
        currentBalance: Number(row?.current_balance) || 0,
    };
}

// ============================================================================
// GET ALL MEMBER BALANCES (for All Member Info section)
// ============================================================================

export async function getAllMemberBalances(messId: string, cycleId: string) {
    const supabase = await getSupabaseServerClient();

    // Fetch all active members
    const { data: members, error: membersError } = await supabase
        .from('mess_members')
        .select('id, role, is_manual, manual_name, profile:profiles(full_name)')
        .eq('mess_id', messId)
        .eq('status', 'active')
        .order('role', { ascending: true });

    if (membersError) return { error: membersError.message };
    if (!members?.length) return { data: [] };

    // Calculate balance for each member
    const results = await Promise.all(
        members.map(async (member) => {
            const { data, error } = await supabase.rpc('calculate_member_balance', {
                p_member_id: member.id,
                p_cycle_id: cycleId,
            });

            if (error) return null;
            const row = Array.isArray(data) ? data[0] : data;

            const isManual = Boolean(member.is_manual);
            const name = isManual ? (member.manual_name as string) : ((member.profile as unknown as { full_name: string })?.full_name || 'Unknown');

            return {
                memberId: member.id,
                name,
                role: member.role,
                totalMeals: Number(row?.total_meals) || 0,
                totalDeposits: Number(row?.total_deposits) || 0,
                mealCost: Number(row?.meal_cost) || 0,
                fixedCostShare: Number(row?.fixed_cost_share) || 0,
                individualCostTotal: Number(row?.individual_cost_total) || 0,
                currentBalance: Number(row?.current_balance) || 0,
            };
        })
    );

    return { data: results.filter(Boolean) };
}

// ============================================================================
// GET RECENT ACTIVITY
// ============================================================================

export async function getRecentActivity(messId: string, limit = 5) {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from('activity_log')
        .select(`
      *,
      actor:profiles(full_name, avatar_url)
    `)
        .eq('mess_id', messId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return { error: error.message };

    return { data };
}

// ============================================================================
// SETTLE MEMBER BALANCE (Pay Up Feature)
// ============================================================================

export async function settleMemberBalance(
    messId: string,
    cycleId: string,
    memberId: string,
    balance: number // negative means they owe, positive means they get refund
) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Manager check
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    if (currentMember?.role !== 'manager') {
        return { error: 'Only managers can settle balances' };
    }

    if (balance < 0) {
        // They owe money: add a Deposit to bring balance to 0
        const amount = Math.abs(balance);
        const { error } = await supabase.from('transactions').insert({
            mess_id: messId,
            cycle_id: cycleId,
            member_id: memberId,
            amount: amount,
            payment_method: 'cash',
            notes: 'Balance Settlement (Collection)',
            approval_status: 'approved',
            approved_by: user.id,
            created_by: user.id,
        });
        if (error) return { error: error.message };

        // Log
        await supabase.from('activity_log').insert({
            mess_id: messId, actor_id: user.id, action: 'balance_settled',
            details: { member_id: memberId, type: 'collection', amount }
        });

    } else if (balance > 0) {
        // They have extra: add an Individual Cost to bring balance to 0 (cash out)
        const { error } = await supabase.from('individual_costs').insert({
            mess_id: messId,
            cycle_id: cycleId,
            member_id: memberId,
            amount: balance,
            description: 'Balance Settlement (Refund)',
            approval_status: 'approved',
            approved_by: user.id,
            created_by: user.id,
        });
        if (error) return { error: error.message };

        // Log
        await supabase.from('activity_log').insert({
            mess_id: messId, actor_id: user.id, action: 'balance_settled',
            details: { member_id: memberId, type: 'refund', amount: balance }
        });
    }

    return { success: true };
}

// ============================================================================
// UNIFIED DASHBOARD DATA (Single server action, 1 auth call, all parallel)
// ============================================================================

interface CutoffConfig {
    breakfast_cutoff: string;
    lunch_cutoff: string;
    dinner_cutoff: string;
}

function getBDTime(): Date {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 6 * 3600000);
}

function isMealLocked(mealType: 'breakfast' | 'lunch' | 'dinner', mealDate: string, config: CutoffConfig): boolean {
    const now = getBDTime();
    const [year, month, day] = mealDate.split('-').map(Number);

    let cutoffTime: string;
    let cutoffDay: number = day;

    switch (mealType) {
        case 'breakfast':
            cutoffTime = config.breakfast_cutoff;
            cutoffDay = day - 1;
            break;
        case 'lunch':
            cutoffTime = config.lunch_cutoff;
            break;
        case 'dinner':
            cutoffTime = config.dinner_cutoff;
            break;
    }

    const [hours, minutes] = cutoffTime.split(':').map(Number);
    const cutoffDate = new Date(year, month - 1, cutoffDay, hours, minutes, 0, 0);
    return now > cutoffDate;
}

export async function getDashboardData(params: {
    memberId: string;
    messId: string;
    cycleId: string;
}) {
    const { memberId, messId, cycleId } = params;
    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    // ONE auth check (was 4 before!)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' as const };

    // ALL queries in parallel — single Promise.all
    const [
        membersResult,
        mealRateResult,
        todayMealsResult,
        bazaarResult,
        depositsResult,
        cycleResult,
        balanceResult,
        myMealResult,
        cutoffResult,
        activityResult,
    ] = await Promise.all([
        // === Dashboard Stats ===
        supabase
            .from('mess_members')
            .select('id', { count: 'exact' })
            .eq('mess_id', messId)
            .eq('status', 'active'),

        supabase.rpc('calculate_meal_rate', { p_cycle_id: cycleId }),

        supabase
            .from('daily_meals')
            .select('breakfast, lunch, dinner, guest_breakfast, guest_lunch, guest_dinner')
            .eq('mess_id', messId)
            .eq('meal_date', today),

        supabase
            .from('bazaar_expenses')
            .select('total_amount')
            .eq('cycle_id', cycleId)
            .eq('approval_status', 'approved'),

        supabase
            .from('transactions')
            .select('amount')
            .eq('cycle_id', cycleId)
            .eq('approval_status', 'approved'),

        supabase
            .from('mess_cycles')
            .select('start_date, end_date')
            .eq('id', cycleId)
            .single(),

        // === Member Balance ===
        supabase.rpc('calculate_member_balance', {
            p_member_id: memberId,
            p_cycle_id: cycleId,
        }),

        // === Today's Meals (my meals) ===
        supabase
            .from('daily_meals')
            .select('*')
            .eq('member_id', memberId)
            .eq('meal_date', today)
            .single(),

        // === Meal Cutoff Config ===
        supabase
            .from('meal_cutoff_config')
            .select('*')
            .eq('mess_id', messId)
            .single(),

        // === Recent Activity ===
        supabase
            .from('activity_log')
            .select(`*, actor:profiles(full_name, avatar_url)`)
            .eq('mess_id', messId)
            .order('created_at', { ascending: false })
            .limit(5),
    ]);

    // ---------- Process Dashboard Stats ----------
    const todayMealCount = (todayMealsResult.data || []).reduce((sum, m) => {
        return sum +
            (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0) +
            (m.guest_breakfast || 0) + (m.guest_lunch || 0) + (m.guest_dinner || 0);
    }, 0);

    let cycleProgress = 0;
    let daysRemaining = 0;
    if (cycleResult.data) {
        const start = new Date(cycleResult.data.start_date);
        const end = new Date(cycleResult.data.end_date);
        const now = new Date();
        const totalDays = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 1);
        const elapsed = Math.max((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
        cycleProgress = Math.min(Math.round((elapsed / totalDays) * 100), 100);
        daysRemaining = Math.max(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
    }

    const stats = {
        currentMealRate: Number(mealRateResult.data) || 0,
        provisionalMealRate: Number(mealRateResult.data) || 0,
        totalMembers: membersResult.count || 0,
        activeMembers: membersResult.count || 0,
        totalMealsToday: todayMealCount,
        totalBazaarExpense: (bazaarResult.data || []).reduce((s, e) => s + Number(e.total_amount), 0),
        totalDeposits: (depositsResult.data || []).reduce((s, d) => s + Number(d.amount), 0),
        cycleProgress,
        daysRemaining,
    };

    // ---------- Process Member Balance ----------
    const balRow = Array.isArray(balanceResult.data) ? balanceResult.data[0] : balanceResult.data;
    const balance = {
        openingBalance: Number(balRow?.opening_balance) || 0,
        totalDeposits: Number(balRow?.total_deposits) || 0,
        totalMeals: Number(balRow?.total_meals) || 0,
        mealRate: Number(balRow?.meal_rate) || 0,
        mealCost: Number(balRow?.meal_cost) || 0,
        fixedCostShare: Number(balRow?.fixed_cost_share) || 0,
        individualCostTotal: Number(balRow?.individual_cost_total) || 0,
        currentBalance: Number(balRow?.current_balance) || 0,
    };

    // ---------- Process Today's Meals ----------
    const cutoffConfig: CutoffConfig = cutoffResult.data || {
        breakfast_cutoff: '21:00',
        lunch_cutoff: '10:00',
        dinner_cutoff: '15:00',
    };
    const meal = myMealResult.data;
    const todayMeals = {
        date: today,
        breakfast: Number(meal?.breakfast || 0),
        lunch: Number(meal?.lunch || 0),
        dinner: Number(meal?.dinner || 0),
        guestBreakfast: meal?.guest_breakfast ?? 0,
        guestLunch: meal?.guest_lunch ?? 0,
        guestDinner: meal?.guest_dinner ?? 0,
        breakfastLocked: isMealLocked('breakfast', today, cutoffConfig),
        lunchLocked: isMealLocked('lunch', today, cutoffConfig),
        dinnerLocked: isMealLocked('dinner', today, cutoffConfig),
    };

    // ---------- Process Activity ----------
    const activity = activityResult.data || [];

    return {
        stats,
        balance,
        todayMeals,
        activity,
    };
}
