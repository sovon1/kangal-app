'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { bazaarExpenseSchema } from '@/lib/validations';

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
        .single();

    const isManager = currentMember?.role === 'manager';

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    // 1. Create the expense header
    const { data: expense, error: expenseError } = await supabase
        .from('bazaar_expenses')
        .insert({
            mess_id: messId,
            cycle_id: cycleId,
            shopper_id: shopperId,
            expense_date: expenseDate,
            notes: notes || null,
            total_amount: totalAmount,
            approval_status: isManager ? 'approved' : 'pending',
            approved_by: isManager ? user.id : null,
            created_by: user.id,
        })
        .select('id')
        .single();

    if (expenseError || !expense) {
        return { error: expenseError?.message || 'Failed to create expense' };
    }

    // 2. Insert all line items (this triggers inventory deduction)
    const bazaarItems = items.map((item) => ({
        expense_id: expense.id,
        item_name: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase
        .from('bazaar_items')
        .insert(bazaarItems);

    if (itemsError) {
        // Rollback: delete the expense header
        await supabase.from('bazaar_expenses').delete().eq('id', expense.id);
        return { error: itemsError.message };
    }

    // 3. Log the activity
    await supabase.from('activity_log').insert({
        mess_id: messId,
        actor_id: user.id,
        action: 'bazaar_added',
        details: {
            expense_id: expense.id,
            item_count: items.length,
            total: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
        },
    });

    return { success: true, expenseId: expense.id };
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
