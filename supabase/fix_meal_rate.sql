-- ============================================================================
-- KANGAL Security Patch: Fix Meal Rate Calculation Exploit
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Function to calculate meal rate (MUST only include approved bazaar expenses)
CREATE OR REPLACE FUNCTION calculate_meal_rate(p_cycle_id UUID)
RETURNS NUMERIC AS $$ 
DECLARE
    v_total_bazaar NUMERIC(12, 2);
    v_total_meals INT;
BEGIN
    -- Sum ONLY APPROVED bazaar expenses for this cycle
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_bazaar
    FROM bazaar_expenses
    WHERE cycle_id = p_cycle_id
      AND approval_status = 'approved';

    -- Count total individual meals (each toggle = 1 meal, each guest = 1 meal)
    SELECT COALESCE(
        SUM(
            CASE WHEN breakfast THEN 1 ELSE 0 END +
            CASE WHEN lunch THEN 1 ELSE 0 END +
            CASE WHEN dinner THEN 1 ELSE 0 END +
            guest_breakfast + guest_lunch + guest_dinner
        ), 0
    )
    INTO v_total_meals
    FROM daily_meals
    WHERE cycle_id = p_cycle_id;

    -- Guard against division by zero
    IF v_total_meals = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(v_total_bazaar / v_total_meals, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
