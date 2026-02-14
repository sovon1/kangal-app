-- ============================================================================
-- KANGAL Migration: Add Approval System to Transactions & Bazaar
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add approval columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approval_status approval_status NOT NULL DEFAULT 'pending';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- 2. Add approval columns to bazaar_expenses
ALTER TABLE bazaar_expenses ADD COLUMN IF NOT EXISTS approval_status approval_status NOT NULL DEFAULT 'pending';
ALTER TABLE bazaar_expenses ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- 3. Auto-approve all existing records (retroactive)
UPDATE transactions SET approval_status = 'approved' WHERE approval_status = 'pending';
UPDATE bazaar_expenses SET approval_status = 'approved' WHERE approval_status = 'pending';

-- 4. Fix RLS: Allow any mess member to insert deposits (will be pending until approved)
DROP POLICY IF EXISTS transactions_insert ON transactions;
CREATE POLICY transactions_insert ON transactions FOR INSERT WITH CHECK (is_mess_member(mess_id));

-- 5. Add UPDATE policy for transactions (so managers can approve/reject)
DROP POLICY IF EXISTS transactions_update ON transactions;
CREATE POLICY transactions_update ON transactions FOR UPDATE USING (is_mess_manager(mess_id));

-- 6. Update calculate_member_balance to only count APPROVED deposits
CREATE OR REPLACE FUNCTION calculate_member_balance(
    p_member_id UUID,
    p_cycle_id UUID
)
RETURNS TABLE (
    opening_balance NUMERIC,
    total_deposits NUMERIC,
    total_meals INT,
    meal_rate NUMERIC,
    meal_cost NUMERIC,
    fixed_cost_share NUMERIC,
    individual_cost_total NUMERIC,
    current_balance NUMERIC
) AS $$
DECLARE
    v_opening NUMERIC(12, 2) := 0;
    v_deposits NUMERIC(12, 2) := 0;
    v_meals INT := 0;
    v_rate NUMERIC(10, 4) := 0;
    v_meal_cost NUMERIC(12, 2) := 0;
    v_fixed NUMERIC(12, 2) := 0;
    v_individual NUMERIC(12, 2) := 0;
    v_balance NUMERIC(12, 2) := 0;
BEGIN
    -- Get opening balance from previous cycle snapshot (if any)
    SELECT COALESCE(ms.closing_balance, 0)
    INTO v_opening
    FROM month_snapshots ms
    JOIN mess_cycles mc ON mc.id = ms.cycle_id
    WHERE ms.member_id = p_member_id
      AND mc.end_date < (SELECT start_date FROM mess_cycles WHERE id = p_cycle_id)
    ORDER BY mc.end_date DESC
    LIMIT 1;

    -- Sum APPROVED deposits only
    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits
    FROM transactions
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id AND approval_status = 'approved';

    -- Count total meals for this member
    SELECT COALESCE(
        SUM(
            CASE WHEN breakfast THEN 1 ELSE 0 END +
            CASE WHEN lunch THEN 1 ELSE 0 END +
            CASE WHEN dinner THEN 1 ELSE 0 END +
            guest_breakfast + guest_lunch + guest_dinner
        ), 0
    )
    INTO v_meals
    FROM daily_meals
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id;

    -- Get current meal rate
    v_rate := calculate_meal_rate(p_cycle_id);

    -- Calculate meal cost
    v_meal_cost := ROUND(v_meals * v_rate, 2);

    -- Get prorated fixed costs
    v_fixed := prorate_fixed_costs(p_member_id, p_cycle_id);

    -- Sum approved individual costs
    SELECT COALESCE(SUM(amount), 0)
    INTO v_individual
    FROM individual_costs
    WHERE member_id = p_member_id
      AND cycle_id = p_cycle_id
      AND approval_status = 'approved';

    -- Final balance
    v_balance := (v_opening + v_deposits) - (v_meal_cost + v_fixed + v_individual);

    RETURN QUERY SELECT
        v_opening,
        v_deposits,
        v_meals,
        v_rate,
        v_meal_cost,
        v_fixed,
        v_individual,
        v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! ✅
