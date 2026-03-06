'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { bazaarExpenseSchema, updateBazaarExpenseSchema } from '@/lib/validations';

// ============================================================================
// ADD BAZAAR EXPENSE (with items → triggers inventory deduction)
// ============================================================================

export async function addBazaarExpense(input: unknown) {
    const parsed = bazaarExpenseSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { cycleId, messId, shopperId, expenseDate, notes, items } = parsed.data;
    const supabase = await getSupabaseServerClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check if current user is manager (auto-approve)
    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

    const isManager = currentMember?.role === 'manager';

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    // Prepare data for RPC
    const expenseData = {
        mess_id: messId,
        cycle_id: cycleId,
        shopper_id: shopperId,
        expense_date: expenseDate,
        notes: notes || null,
        total_amount: totalAmount,
        approval_status: isManager ? 'approved' : 'pending',
        approved_by: isManager ? user.id : null,
        created_by: user.id,
    };

    const itemsData = items.map(item => ({
        item_name: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice
    }));

    // Call Atomic RPC (Fixes Orphan Bazaar Expenses)
    const { data: expenseId, error: rpcError } = await supabase.rpc('add_bazaar_expense_transaction', {
        p_expense_data: expenseData,
        p_items_data: itemsData
    });

    if (rpcError) {
        return { error: rpcError.message };
    }

    return { success: true, expenseId };
}

// ============================================================================
// APPROVE / REJECT BAZAAR EXPENSE
// ============================================================================

export async function approveBazaarExpense(
    expenseId: string,
    action: 'approved' | 'rejected'
) {
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('bazaar_expenses')
        .update({
            approval_status: action,
            approved_by: user.id,
        })
        .eq('id', expenseId);

    if (error) return { error: error.message };

    return { success: true };
}

// ============================================================================
// GET BAZAAR EXPENSES FOR A CYCLE
// ============================================================================

export async function getBazaarExpenses(cycleId: string) {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from('bazaar_expenses')
        .select(`
      *,
      items:bazaar_items(*),
      shopper:mess_members(
        *,
        is_manual,
        manual_name,
        profile:profiles(full_name, avatar_url)
      )
    `)
        .eq('cycle_id', cycleId)
        .order('expense_date', { ascending: false });

    if (error) return { error: error.message };

    return { data };
}

// ============================================================================
// GET CONSUMPTION RATES (auto-calculated from bazaar data)
// ============================================================================

export async function getConsumptionRates(cycleId: string) {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from('bazaar_items')
        .select(`
      item_name,
      quantity,
      unit,
      unit_price,
      total_price,
      expense:bazaar_expenses!inner(cycle_id)
    `)
        .eq('expense.cycle_id', cycleId);

    if (error) return { error: error.message };

    // Aggregate by item
    const aggregated = (data || []).reduce<
        Record<string, { totalQty: number; totalCost: number; unit: string; count: number }>
    >((acc, item) => {
        const key = item.item_name.toLowerCase().trim();
        if (!acc[key]) {
            acc[key] = { totalQty: 0, totalCost: 0, unit: item.unit, count: 0 };
        }
        acc[key].totalQty += Number(item.quantity);
        acc[key].totalCost += Number(item.total_price);
        acc[key].count += 1;
        return acc;
    }, {});

    const rates = Object.entries(aggregated).map(([name, data]) => ({
        itemName: name,
        totalQuantity: data.totalQty,
        totalCost: data.totalCost,
        unit: data.unit,
        avgUnitPrice: data.totalCost / data.totalQty,
        purchaseCount: data.count,
    }));

    return { data: rates };
}

// ============================================================================
// DELETE BAZAAR EXPENSE
// ============================================================================

export async function deleteBazaarExpense(expenseId: string, messId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase.rpc('delete_bazaar_expense_transaction', {
        p_expense_id: expenseId,
        p_mess_id: messId,
        p_actor_id: user.id
    });

    if (error) return { error: error.message };

    return { success: true };
}

// ============================================================================
// UPDATE BAZAAR EXPENSE
// ============================================================================

export async function updateBazaarExpense(input: unknown) {
    const parsed = updateBazaarExpenseSchema.safeParse(input);
    if (!parsed.success) return { error: 'Invalid input', details: parsed.error.issues };

    const { id, cycleId, messId, shopperId, expenseDate, notes, items } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const expenseData = {
        mess_id: messId,
        shopper_id: shopperId,
        expense_date: expenseDate,
        notes: notes || null,
        total_amount: totalAmount,
        approval_status: 'pending', // Assume edit requires re-approval unless manager (handled in RPC)
        approved_by: null,
        acted_by: user.id
    };

    const itemsData = items.map(item => ({
        item_name: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice
    }));

    const { error } = await supabase.rpc('update_bazaar_expense_transaction', {
        p_expense_id: id,
        p_expense_data: expenseData,
        p_items_data: itemsData
    });

    if (error) return { error: error.message };

    return { success: true };
}
