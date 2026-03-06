-- ============================================================================
-- MIGRATION: Fix NULL balance calculation in calculate_member_balance
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
    -- Securely grab the opening balance using a subquery so it properly COALESCEs to 0 if no rows exist
    v_opening := COALESCE((
        SELECT ms.closing_balance
        FROM month_snapshots ms
        JOIN mess_cycles mc ON mc.id = ms.cycle_id
        WHERE ms.member_id = p_member_id
          AND mc.end_date < (SELECT start_date FROM mess_cycles WHERE id = p_cycle_id)
        ORDER BY mc.end_date DESC
        LIMIT 1
    ), 0);

    -- Deposits
    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits
    FROM transactions
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id AND approval_status = 'approved';

    -- Meals
    SELECT COALESCE(
        SUM(
            breakfast + lunch + dinner +
            guest_breakfast + guest_lunch + guest_dinner
        ), 0
    )
    INTO v_meals
    FROM daily_meals
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id;

    -- Derived values
    v_rate := calculate_meal_rate(p_cycle_id);
    v_meal_cost := ROUND(v_meals * v_rate, 2);
    v_fixed := prorate_fixed_costs(p_member_id, p_cycle_id);

    -- Individual costs
    SELECT COALESCE(SUM(amount), 0)
    INTO v_individual
    FROM individual_costs
    WHERE member_id = p_member_id
      AND cycle_id = p_cycle_id
      AND approval_status = 'approved';

    -- Prevent any stray NULLs before final calculation
    v_opening := COALESCE(v_opening, 0);
    v_deposits := COALESCE(v_deposits, 0);
    v_meal_cost := COALESCE(v_meal_cost, 0);
    v_fixed := COALESCE(v_fixed, 0);
    v_individual := COALESCE(v_individual, 0);

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
