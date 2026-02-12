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

function isMealLocked(mealType: MealType, mealDate: string, config: CutoffConfig): boolean {
    const now = new Date();
    const date = new Date(mealDate);

    let cutoffTime: string;
    let cutoffDate: Date;

    switch (mealType) {
        case 'breakfast':
            // Breakfast locks at cutoff time on the PREVIOUS day
            cutoffTime = config.breakfast_cutoff;
            cutoffDate = new Date(date);
            cutoffDate.setDate(cutoffDate.getDate() - 1);
            break;
        case 'lunch':
            cutoffTime = config.lunch_cutoff;
            cutoffDate = new Date(date);
            break;
        case 'dinner':
            cutoffTime = config.dinner_cutoff;
            cutoffDate = new Date(date);
            break;
    }

    const [hours, minutes] = cutoffTime.split(':').map(Number);
    cutoffDate.setHours(hours, minutes, 0, 0);

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

    // 2. Server-side cutoff check
    if (isMealLocked(mealType, mealDate, cutoffConfig)) {
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
