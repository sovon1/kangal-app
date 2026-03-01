'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { depositSchema, fixedCostSchema, individualCostSchema } from '@/lib/validations';

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
// APPROVE / REJECT DEPOSIT
// ============================================================================

export async function approveDeposit(
    depositId: string,
    action: 'approved' | 'rejected'
) {
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

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
            .eq('cycle_id', cycleId),

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
        // Mess name
        supabase.from('messes').select('name').eq('id', messId).single(),

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
    const messBalance = totalDeposits - (totalMealCost + totalBazaarCost + totalFixedCost + totalIndividualCost);

    // Format month name from cycle
    let monthLabel = '';
    if (cycleResult.data?.start_date) {
        const d = new Date(cycleResult.data.start_date);
        monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return {
        messName: messResult.data?.name || 'Mess',
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
        .select('id, role, profile:profiles(full_name)')
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

            return {
                memberId: member.id,
                name: (member.profile as unknown as { full_name: string })?.full_name || 'Unknown',
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
