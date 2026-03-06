-- ============================================================================
-- BUG FIX: Restore Approval Status Checks in RPC Calculations
-- Fixes an issue where Pending/Rejected deposits and bazaar expenses 
-- were being calculated into the live member balances.
-- ============================================================================

-- 1. Fix: add `AND approval_status = 'approved'` to calculate_meal_rate
CREATE OR REPLACE FUNCTION calculate_meal_rate(p_cycle_id UUID)
RETURNS NUMERIC AS $$ 
DECLARE
    v_total_bazaar NUMERIC(12, 2);
    v_total_meals NUMERIC(12, 2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_bazaar
    FROM bazaar_expenses
    WHERE cycle_id = p_cycle_id AND approval_status = 'approved';

    SELECT COALESCE(
        SUM(
            breakfast + lunch + dinner +
            guest_breakfast + guest_lunch + guest_dinner
        ), 0
    )
    INTO v_total_meals
    FROM daily_meals
    WHERE cycle_id = p_cycle_id;

    IF v_total_meals = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(v_total_bazaar / v_total_meals, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix: add `AND approval_status = 'approved'` to calculate_member_balance deposits lookup
DROP FUNCTION IF EXISTS public.calculate_member_balance(UUID, UUID);

CREATE OR REPLACE FUNCTION calculate_member_balance(
    p_member_id UUID,
    p_cycle_id UUID
)
RETURNS TABLE (
    opening_balance NUMERIC,
    total_deposits NUMERIC,
    total_meals NUMERIC, 
    meal_rate NUMERIC,
    meal_cost NUMERIC,
    fixed_cost_share NUMERIC,
    individual_cost_total NUMERIC,
    current_balance NUMERIC
) AS $$
DECLARE
    v_opening NUMERIC(12, 2) := 0;
    v_deposits NUMERIC(12, 2) := 0;
    v_meals NUMERIC(12, 2) := 0;
    v_rate NUMERIC(10, 4) := 0;
    v_meal_cost NUMERIC(12, 2) := 0;
    v_fixed NUMERIC(12, 2) := 0;
    v_individual NUMERIC(12, 2) := 0;
    v_balance NUMERIC(12, 2) := 0;
BEGIN
    SELECT COALESCE(ms.closing_balance, 0)
    INTO v_opening
    FROM month_snapshots ms
    JOIN mess_cycles mc ON mc.id = ms.cycle_id
    WHERE ms.member_id = p_member_id
      AND mc.end_date < (SELECT start_date FROM mess_cycles WHERE id = p_cycle_id)
    ORDER BY mc.end_date DESC
    LIMIT 1;

    -- FIX: Added 'AND approval_status = 'approved''
    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits
    FROM transactions
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id AND approval_status = 'approved';

    SELECT COALESCE(
        SUM(
            breakfast + lunch + dinner +
            guest_breakfast + guest_lunch + guest_dinner
        ), 0
    )
    INTO v_meals
    FROM daily_meals
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id;

    v_rate := calculate_meal_rate(p_cycle_id);
    v_meal_cost := ROUND(v_meals * v_rate, 2);
    v_fixed := prorate_fixed_costs(p_member_id, p_cycle_id);

    SELECT COALESCE(SUM(amount), 0)
    INTO v_individual
    FROM individual_costs
    WHERE member_id = p_member_id
      AND cycle_id = p_cycle_id
      AND approval_status = 'approved';

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
