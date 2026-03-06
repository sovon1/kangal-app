-- ============================================================================
-- BUG FIX: Meal Cutoff Trigger Type Mismatch
-- Fixes an issue where the trigger was comparing the new numeric meal values
-- to FALSE (boolean) instead of 0, which would crash PostgreSQL.
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_meal_cutoff()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_today DATE := CURRENT_DATE;
    v_meal_date DATE;
    v_cutoff_time TIME;
    v_cutoff_timestamp TIMESTAMPTZ;
BEGIN
    -- Managers bypass all cutoff checks
    IF is_mess_manager(NEW.mess_id) THEN
        RETURN NEW;
    END IF;

    v_meal_date := NEW.meal_date;

    -- Get cutoff config for this mess
    SELECT * INTO v_config
    FROM meal_cutoff_config
    WHERE mess_id = NEW.mess_id;

    -- If no config, use defaults
    IF NOT FOUND THEN
        v_config.breakfast_cutoff := '21:00'::TIME;
        v_config.lunch_cutoff := '10:00'::TIME;
        v_config.dinner_cutoff := '15:00'::TIME;
    END IF;

    -- Check each meal type that changed
    -- Breakfast: locks at cutoff time on PREVIOUS day
    -- FIX: Changed FALSE to 0 because meals are now NUMERIC(5,2)
    IF NEW.breakfast IS DISTINCT FROM COALESCE(OLD.breakfast, 0) THEN
        v_cutoff_timestamp := (v_meal_date - INTERVAL '1 day')::DATE + v_config.breakfast_cutoff;
        IF v_now > v_cutoff_timestamp THEN
            RAISE EXCEPTION 'Breakfast for % is locked (cutoff was %)',
                v_meal_date, v_cutoff_timestamp;
        END IF;
    END IF;

    -- Lunch: locks at cutoff time on SAME day
    IF NEW.lunch IS DISTINCT FROM COALESCE(OLD.lunch, 0) THEN
        v_cutoff_timestamp := v_meal_date::DATE + v_config.lunch_cutoff;
        IF v_now > v_cutoff_timestamp THEN
            RAISE EXCEPTION 'Lunch for % is locked (cutoff was %)',
                v_meal_date, v_cutoff_timestamp;
        END IF;
    END IF;

    -- Dinner: locks at cutoff time on SAME day
    IF NEW.dinner IS DISTINCT FROM COALESCE(OLD.dinner, 0) THEN
        v_cutoff_timestamp := v_meal_date::DATE + v_config.dinner_cutoff;
        IF v_now > v_cutoff_timestamp THEN
            RAISE EXCEPTION 'Dinner for % is locked (cutoff was %)',
                v_meal_date, v_cutoff_timestamp;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
