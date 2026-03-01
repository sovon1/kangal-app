'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { mealToggleSchema, guestMealSchema } from '@/lib/validations';
import type { MealType } from '@/types';

// ============================================================================
// MEAL CUT-OFF VALIDATION (Server-side enforcement)
// ============================================================================

interface CutoffConfig {
    breakfast_cutoff: string;
    lunch_cutoff: string;
    dinner_cutoff: string;
}

function getBDTime(): Date {
    // Get current time in Bangladesh (UTC+6) regardless of server timezone
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 6 * 3600000); // UTC+6
}

function isMealLocked(mealType: MealType, mealDate: string, config: CutoffConfig): boolean {
    const now = getBDTime();
    // Parse mealDate as a local date (no timezone shift)
    const [year, month, day] = mealDate.split('-').map(Number);

    let cutoffTime: string;
    let cutoffDay: number = day;

    switch (mealType) {
        case 'breakfast':
            // Breakfast locks at cutoff time on the PREVIOUS day
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

// ============================================================================
// TOGGLE MEAL
// ============================================================================

export async function toggleMeal(input: unknown) {
    const parsed = mealToggleSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { memberId, cycleId, messId, mealDate, mealType, value } = parsed.data;
    const supabase = await getSupabaseServerClient();

    // Get current user to check if they're a manager
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: currentMember } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    const isManager = currentMember?.role === 'manager';

    // 1. Get cutoff config
    const { data: config } = await supabase
        .from('meal_cutoff_config')
        .select('*')
        .eq('mess_id', messId)
        .single();

    const cutoffConfig: CutoffConfig = config || {
        breakfast_cutoff: '21:00',
        lunch_cutoff: '10:00',
        dinner_cutoff: '15:00',
    };

    // 2. Server-side cutoff check (managers bypass this)
    if (!isManager && isMealLocked(mealType, mealDate, cutoffConfig)) {
        return {
            error: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} for ${mealDate} is locked. The cutoff time has passed.`,
        };
    }

    // 3. Check if a record exists for this date
    const { data: existing } = await supabase
        .from('daily_meals')
        .select('id')
        .eq('member_id', memberId)
        .eq('meal_date', mealDate)
        .single();

    if (existing) {
        // Update existing record
        const { error } = await supabase
            .from('daily_meals')
            .update({ [mealType]: value })
            .eq('id', existing.id);

        if (error) {
            return { error: error.message };
        }
    } else {
        // Insert new record
        const { error } = await supabase
            .from('daily_meals')
            .insert({
                mess_id: messId,
                cycle_id: cycleId,
                member_id: memberId,
                meal_date: mealDate,
                [mealType]: value,
            });

        if (error) {
            return { error: error.message };
        }
    }

    return { success: true };
}

// ============================================================================
// UPDATE GUEST MEAL COUNT
// ============================================================================

export async function updateGuestMeal(input: unknown) {
    const parsed = guestMealSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input', details: parsed.error.issues };
    }

    const { memberId, cycleId, messId, mealDate, mealType, count } = parsed.data;
    const supabase = await getSupabaseServerClient();

    const guestField = `guest_${mealType}` as const;

    // Check existing
    const { data: existing } = await supabase
        .from('daily_meals')
        .select('id')
        .eq('member_id', memberId)
        .eq('meal_date', mealDate)
        .single();

    if (existing) {
        const { error } = await supabase
            .from('daily_meals')
            .update({ [guestField]: count })
            .eq('id', existing.id);

        if (error) return { error: error.message };
    } else {
        const { error } = await supabase
            .from('daily_meals')
            .insert({
                mess_id: messId,
                cycle_id: cycleId,
                member_id: memberId,
                meal_date: mealDate,
                [guestField]: count,
            });

        if (error) return { error: error.message };
    }

    return { success: true };
}

// ============================================================================
// GET TODAY'S MEAL STATE
// ============================================================================

export async function getTodayMeals(memberId: string, messId: string) {
    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    // Get meal data
    const { data: meal } = await supabase
        .from('daily_meals')
        .select('*')
        .eq('member_id', memberId)
        .eq('meal_date', today)
        .single();

    // Get cutoff config
    const { data: config } = await supabase
        .from('meal_cutoff_config')
        .select('*')
        .eq('mess_id', messId)
        .single();

    const cutoffConfig: CutoffConfig = config || {
        breakfast_cutoff: '21:00',
        lunch_cutoff: '10:00',
        dinner_cutoff: '15:00',
    };

    return {
        date: today,
        breakfast: meal?.breakfast ?? false,
        lunch: meal?.lunch ?? false,
        dinner: meal?.dinner ?? false,
        guestBreakfast: meal?.guest_breakfast ?? 0,
        guestLunch: meal?.guest_lunch ?? 0,
        guestDinner: meal?.guest_dinner ?? 0,
        breakfastLocked: isMealLocked('breakfast', today, cutoffConfig),
        lunchLocked: isMealLocked('lunch', today, cutoffConfig),
        dinnerLocked: isMealLocked('dinner', today, cutoffConfig),
    };
}

// ============================================================================
// GET ALL MEMBERS' MEALS FOR A DATE (Manager only)
// ============================================================================

export async function getAllMealsForDate(messId: string, cycleId: string, mealDate: string) {
    const supabase = await getSupabaseServerClient();

    // Fetch all active members
    const { data: members, error: membersError } = await supabase
        .from('mess_members')
        .select('id, role, profile:profiles(full_name, avatar_url)')
        .eq('mess_id', messId)
        .eq('status', 'active')
        .order('role', { ascending: true });

    if (membersError) return { error: membersError.message };
    if (!members) return { data: [] };

    // Fetch meals for all members on this date
    const { data: meals } = await supabase
        .from('daily_meals')
        .select('*')
        .eq('mess_id', messId)
        .eq('meal_date', mealDate);

    // Merge member info with meal data
    const result = members.map((member) => {
        const meal = (meals || []).find((m: Record<string, unknown>) => m.member_id === member.id);
        const profile = member.profile as unknown as { full_name: string; avatar_url: string | null };
        return {
            memberId: member.id,
            name: profile?.full_name || 'Unknown',
            avatarUrl: profile?.avatar_url || null,
            breakfast: meal?.breakfast ? 1 : 0,
            lunch: meal?.lunch ? 1 : 0,
            dinner: meal?.dinner ? 1 : 0,
            guestBreakfast: meal?.guest_breakfast || 0,
            guestLunch: meal?.guest_lunch || 0,
            guestDinner: meal?.guest_dinner || 0,
        };
    });

    return { data: result };
}

// ============================================================================
// GET ALL MEMBERS' MEALS FOR FULL MONTH/CYCLE (for chart view)
// ============================================================================

export async function getAllMealsForMonth(messId: string, cycleId: string) {
    const supabase = await getSupabaseServerClient();

    // Get cycle dates
    const { data: cycle } = await supabase
        .from('mess_cycles')
        .select('start_date, end_date')
        .eq('id', cycleId)
        .single();

    if (!cycle) return { error: 'Cycle not found' };

    // Fetch all active members
    const { data: members, error: membersError } = await supabase
        .from('mess_members')
        .select('id, role, profile:profiles(full_name)')
        .eq('mess_id', messId)
        .eq('status', 'active')
        .order('role', { ascending: true });

    if (membersError) return { error: membersError.message };
    if (!members) return { data: { members: [], dates: [], meals: {} } };

    // Fetch ALL meals for this cycle
    const { data: meals } = await supabase
        .from('daily_meals')
        .select('member_id, meal_date, breakfast, lunch, dinner, guest_breakfast, guest_lunch, guest_dinner')
        .eq('cycle_id', cycleId)
        .order('meal_date', { ascending: true });

    // Build date list from cycle start to today (or end_date, whichever is earlier)
    const startDate = new Date(cycle.start_date);
    const endDate = new Date(Math.min(new Date(cycle.end_date).getTime(), new Date().getTime()));
    const dates: string[] = [];
    const d = new Date(startDate);
    while (d <= endDate) {
        dates.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
    }

    // Build a map: date -> memberId -> meal data
    const mealsMap: Record<string, Record<string, { breakfast: number; lunch: number; dinner: number; guestBreakfast: number; guestLunch: number; guestDinner: number }>> = {};
    for (const meal of (meals || [])) {
        const date = meal.meal_date as string;
        const memberId = meal.member_id as string;
        if (!mealsMap[date]) mealsMap[date] = {};
        mealsMap[date][memberId] = {
            breakfast: meal.breakfast ? 1 : 0,
            lunch: meal.lunch ? 1 : 0,
            dinner: meal.dinner ? 1 : 0,
            guestBreakfast: (meal.guest_breakfast as number) || 0,
            guestLunch: (meal.guest_lunch as number) || 0,
            guestDinner: (meal.guest_dinner as number) || 0,
        };
    }

    const memberList = members.map((m) => {
        const profile = m.profile as unknown as { full_name: string };
        return {
            id: m.id,
            name: profile?.full_name || 'Unknown',
        };
    });

    return { data: { members: memberList, dates: dates.reverse(), meals: mealsMap } };
}

// ============================================================================
// MANAGER BULK UPDATE MEALS (bypasses cutoff checks)
// ============================================================================

interface MemberMealUpdate {
    memberId: string;
    breakfast: number;
    lunch: number;
    dinner: number;
}

export async function managerBulkUpdateMeals(
    messId: string,
    cycleId: string,
    mealDate: string,
    updates: MemberMealUpdate[]
) {
    const supabase = await getSupabaseServerClient();

    // Verify the user is a manager
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: member } = await supabase
        .from('mess_members')
        .select('role')
        .eq('mess_id', messId)
        .eq('user_id', user.id)
        .single();

    if (member?.role !== 'manager') return { error: 'Only managers can bulk edit meals' };

    // Process each member update
    const errors: string[] = [];
    for (const update of updates) {
        // Check if record exists
        const { data: existing } = await supabase
            .from('daily_meals')
            .select('id')
            .eq('member_id', update.memberId)
            .eq('meal_date', mealDate)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('daily_meals')
                .update({
                    breakfast: update.breakfast > 0,
                    lunch: update.lunch > 0,
                    dinner: update.dinner > 0,
                    guest_breakfast: Math.max(0, update.breakfast - 1),
                    guest_lunch: Math.max(0, update.lunch - 1),
                    guest_dinner: Math.max(0, update.dinner - 1),
                })
                .eq('id', existing.id);

            if (error) errors.push(`${update.memberId}: ${error.message}`);
        } else {
            // Only insert if there's at least one meal
            if (update.breakfast > 0 || update.lunch > 0 || update.dinner > 0) {
                const { error } = await supabase
                    .from('daily_meals')
                    .insert({
                        mess_id: messId,
                        cycle_id: cycleId,
                        member_id: update.memberId,
                        meal_date: mealDate,
                        breakfast: update.breakfast > 0,
                        lunch: update.lunch > 0,
                        dinner: update.dinner > 0,
                        guest_breakfast: Math.max(0, update.breakfast - 1),
                        guest_lunch: Math.max(0, update.lunch - 1),
                        guest_dinner: Math.max(0, update.dinner - 1),
                    });

                if (error) errors.push(`${update.memberId}: ${error.message}`);
            }
        }
    }

    if (errors.length > 0) return { error: `Some updates failed: ${errors.join(', ')}` };

    return { success: true };
}
