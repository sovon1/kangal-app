-- Function to reset a mess by wiping all cycles and financial data, 
-- and starting fresh with a single active cycle.
-- This Uses SECURITY DEFINER to bypass RLS policies that prevent deleting mess_cycles.

CREATE OR REPLACE FUNCTION reset_mess_data(
    p_mess_id UUID, 
    p_new_cycle_name TEXT, 
    p_start_date DATE, 
    p_end_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Ensure the caller is a manager for this mess
    IF NOT is_mess_manager(p_mess_id) THEN
        RAISE EXCEPTION 'Only managers can reset the mess';
    END IF;

    -- 2. Delete all existing cycles (this automatically cascades to delete all meals, transactions, and costs)
    DELETE FROM public.mess_cycles WHERE mess_id = p_mess_id;

    -- 3. Delete any dangling data explicitly just to be 100% thorough
    DELETE FROM public.daily_meals WHERE mess_id = p_mess_id;
    DELETE FROM public.transactions WHERE mess_id = p_mess_id;
    DELETE FROM public.bazaar_expenses WHERE mess_id = p_mess_id;
    DELETE FROM public.fixed_costs WHERE mess_id = p_mess_id;
    DELETE FROM public.individual_costs WHERE mess_id = p_mess_id;

    -- 4. Create the new clean cycle
    INSERT INTO public.mess_cycles (mess_id, name, start_date, end_date, status)
    VALUES (p_mess_id, p_new_cycle_name, p_start_date, p_end_date, 'open');

END;
$$;
