-- Add edit & delete RPCs for bazaar securely bypassing restricted RLS

CREATE OR REPLACE FUNCTION update_bazaar_expense_transaction(
    p_expense_id UUID,
    p_expense_data JSONB,
    p_items_data JSONB
)
RETURNS VOID AS $$
DECLARE
    v_mess_id UUID;
    v_actor_id UUID;
    v_current_creator UUID;
    v_active_role TEXT;
BEGIN
    v_mess_id := (p_expense_data->>'mess_id')::UUID;
    v_actor_id := (p_expense_data->>'acted_by')::UUID;

    -- Validate user role
    SELECT role INTO v_active_role
    FROM mess_members
    WHERE mess_id = v_mess_id AND user_id = v_actor_id AND status = 'active';

    IF v_active_role IS NULL THEN
        RAISE EXCEPTION 'User not active member of this mess';
    END IF;

    -- Get original creator
    SELECT created_by INTO v_current_creator
    FROM bazaar_expenses
    WHERE id = p_expense_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense not found';
    END IF;

    IF v_active_role != 'manager' AND v_current_creator != v_actor_id THEN
        RAISE EXCEPTION 'Unauthorized to edit this expense';
    END IF;

    -- Update expense header
    UPDATE bazaar_expenses
    SET shopper_id = (p_expense_data->>'shopper_id')::UUID,
        expense_date = (p_expense_data->>'expense_date')::DATE,
        notes = NULLIF(p_expense_data->>'notes', ''),
        total_amount = (p_expense_data->>'total_amount')::NUMERIC,
        approval_status = (p_expense_data->>'approval_status')::approval_status,
        approved_by = (p_expense_data->>'approved_by')::UUID,
        updated_at = NOW()
    WHERE id = p_expense_id;

    -- Delete old items
    DELETE FROM bazaar_items WHERE expense_id = p_expense_id;

    -- Insert new items
    INSERT INTO bazaar_items (
        expense_id,
        item_name,
        quantity,
        unit,
        unit_price
    )
    SELECT 
        p_expense_id,
        x.item_name,
        (x.quantity)::NUMERIC,
        x.unit,
        (x.unit_price)::NUMERIC
    FROM jsonb_to_recordset(p_items_data) AS x(
        item_name TEXT,
        quantity NUMERIC,
        unit TEXT,
        unit_price NUMERIC
    );

    -- Log Activity
    INSERT INTO activity_log (mess_id, actor_id, action, details)
    VALUES (
        v_mess_id,
        v_actor_id,
        'bazaar_updated',
        jsonb_build_object(
            'expense_id', p_expense_id,
            'item_count', jsonb_array_length(p_items_data),
            'total', (p_expense_data->>'total_amount')::NUMERIC
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION delete_bazaar_expense_transaction(
    p_expense_id UUID,
    p_mess_id UUID,
    p_actor_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_current_creator UUID;
    v_active_role TEXT;
BEGIN
    SELECT role INTO v_active_role
    FROM mess_members
    WHERE mess_id = p_mess_id AND user_id = p_actor_id AND status = 'active';

    IF v_active_role IS NULL THEN
        RAISE EXCEPTION 'User not active member of this mess';
    END IF;

    SELECT created_by INTO v_current_creator
    FROM bazaar_expenses
    WHERE id = p_expense_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense not found';
    END IF;

    IF v_active_role != 'manager' AND v_current_creator != p_actor_id THEN
        RAISE EXCEPTION 'Unauthorized to delete this expense';
    END IF;

    DELETE FROM bazaar_items WHERE expense_id = p_expense_id;
    DELETE FROM bazaar_expenses WHERE id = p_expense_id;

    INSERT INTO activity_log (mess_id, actor_id, action, details)
    VALUES (
        p_mess_id,
        p_actor_id,
        'bazaar_deleted',
        jsonb_build_object('expense_id', p_expense_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
