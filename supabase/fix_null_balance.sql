-- ============================================================================
-- BUG FIX: Restore COALESCE check for opening balance
-- Fixes an issue where `v_opening` became NULL for new members, poisoning
-- all subsequent math equations and resulting in a 0.00 balance.
-- ============================================================================

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

    -- CRITICAL FIX: PostgreSQL sets variable to NULL when SELECT INTO returns no rows
    -- If v_opening is NULL, all subsequent math (NULL + 150) becomes NULL!
    v_opening := COALESCE(v_opening, 0);

    -- FIX: Added 'AND approval_status = 'approved''
    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits
    FROM transactions
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id AND approval_status = 'approved';
    -- Safe against no rows because SUM() generates a row of NULL which gets COALESCE'd.

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
