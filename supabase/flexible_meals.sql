-- ============================================================================
-- MIGRATION: Flexible Meal Portions (Boolean to Numeric)
-- Upgrades kangal-app to support 0.5, 1.5, etc. for breakfast, lunch, and dinner
-- ============================================================================

-- 1. Alter daily_meals table to change booleans to numeric
-- PostgreSQL handles the conversion gracefully using the USING clause.
-- false -> 0, true -> 1
ALTER TABLE public.daily_meals
    ALTER COLUMN breakfast DROP DEFAULT,
    ALTER COLUMN lunch DROP DEFAULT,
    ALTER COLUMN dinner DROP DEFAULT,
    ALTER COLUMN guest_breakfast DROP DEFAULT,
    ALTER COLUMN guest_lunch DROP DEFAULT,
    ALTER COLUMN guest_dinner DROP DEFAULT;

ALTER TABLE public.daily_meals
    ALTER COLUMN breakfast TYPE NUMERIC(5,2) USING CASE WHEN breakfast THEN 1 ELSE 0 END,
    ALTER COLUMN breakfast SET DEFAULT 0,
    ALTER COLUMN lunch TYPE NUMERIC(5,2) USING CASE WHEN lunch THEN 1 ELSE 0 END,
    ALTER COLUMN lunch SET DEFAULT 0,
    ALTER COLUMN dinner TYPE NUMERIC(5,2) USING CASE WHEN dinner THEN 1 ELSE 0 END,
    ALTER COLUMN dinner SET DEFAULT 0,
    ALTER COLUMN guest_breakfast TYPE NUMERIC(5,2) USING guest_breakfast::NUMERIC,
    ALTER COLUMN guest_breakfast SET DEFAULT 0,
    ALTER COLUMN guest_lunch TYPE NUMERIC(5,2) USING guest_lunch::NUMERIC,
    ALTER COLUMN guest_lunch SET DEFAULT 0,
    ALTER COLUMN guest_dinner TYPE NUMERIC(5,2) USING guest_dinner::NUMERIC,
    ALTER COLUMN guest_dinner SET DEFAULT 0;

-- 2. Update calculate_meal_rate RPC to sum fractions directly instead of using CASE logic
CREATE OR REPLACE FUNCTION calculate_meal_rate(p_cycle_id UUID)
RETURNS NUMERIC AS $$ 
DECLARE
    v_total_bazaar NUMERIC(12, 2);
    v_total_meals NUMERIC(12, 2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_bazaar
    FROM bazaar_expenses
    WHERE cycle_id = p_cycle_id;

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

-- 3. Update calculate_member_balance RPC to use the new exact sums
DROP FUNCTION IF EXISTS public.calculate_member_balance(UUID, UUID);

CREATE OR REPLACE FUNCTION calculate_member_balance(
    p_member_id UUID,
    p_cycle_id UUID
)
RETURNS TABLE (
    opening_balance NUMERIC,
    total_deposits NUMERIC,
    total_meals NUMERIC, -- Kept as NUMERIC to support fractions returning properly
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

    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits
    FROM transactions
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id;

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

-- 4. Update the month_snapshots table to allow total_meals as NUMERIC
ALTER TABLE public.month_snapshots
    ALTER COLUMN total_meals TYPE NUMERIC(12,2) USING total_meals::NUMERIC;
