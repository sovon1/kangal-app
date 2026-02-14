-- 1. Atomic Manager Transfer
-- Demotes current manager and promotes new manager in a single transaction
-- Prevents "headless mess" scenario where mess has 0 managers
CREATE OR REPLACE FUNCTION transfer_mess_manager(
    p_mess_id UUID,
    p_current_manager_id UUID, 
    p_new_manager_member_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_current_member_id UUID;
    v_target_user_id UUID;
BEGIN
    -- 1. Get current manager's member ID and verify they are indeed the manager
    SELECT id INTO v_current_member_id
    FROM mess_members
    WHERE mess_id = p_mess_id 
      AND user_id = p_current_manager_id
      AND role = 'manager'
      AND status = 'active';

    IF v_current_member_id IS NULL THEN
        RAISE EXCEPTION 'User is not the active manager of this mess';
    END IF;

    -- 2. Verify target member exists, is in this mess, and is active
    SELECT user_id INTO v_target_user_id
    FROM mess_members
    WHERE id = p_new_manager_member_id
      AND mess_id = p_mess_id
      AND status = 'active';

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target member not found or inactive';
    END IF;

    IF v_target_user_id = p_current_manager_id THEN
        RAISE EXCEPTION 'Cannot transfer role to yourself';
    END IF;

    -- 3. Perform the swap (Atomic)
    -- Demote current
    UPDATE mess_members 
    SET role = 'member', updated_at = NOW()
    WHERE id = v_current_member_id;

    -- Promote target
    UPDATE mess_members 
    SET role = 'manager', updated_at = NOW()
    WHERE id = p_new_manager_member_id;

    -- 4. Log the activity (Safe to do inside transaction)
    INSERT INTO activity_log (mess_id, actor_id, action, details)
    VALUES (
        p_mess_id, 
        p_current_manager_id, 
        'manager_transferred', 
        jsonb_build_object('new_manager_member_id', p_new_manager_member_id)
    );

    -- Transaction commits automatically if no exception raised
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atomic Bazaar Expense + Items Insert
-- Inserts expense header and all items in one transaction
-- Prevents "ghost expenses" (header with no items) if item insert fails
CREATE OR REPLACE FUNCTION add_bazaar_expense_transaction(
    p_expense_data JSONB,
    p_items_data JSONB
)
RETURNS UUID AS $$
DECLARE
    v_expense_id UUID;
    v_mess_id UUID;
    v_item JSONB;
BEGIN
    -- Extract mess_id for RLS/Security check if needed, though usually handled by calling context
    v_mess_id := (p_expense_data->>'mess_id')::UUID;

    -- 1. Insert Expense Header
    INSERT INTO bazaar_expenses (
        mess_id,
        cycle_id,
        shopper_id,
        expense_date,
        notes,
        total_amount,
        approval_status,
        approved_by,
        created_by
    )
    VALUES (
        v_mess_id,
        (p_expense_data->>'cycle_id')::UUID,
        (p_expense_data->>'shopper_id')::UUID,
        (p_expense_data->>'expense_date')::DATE,
        NULLIF(p_expense_data->>'notes', ''),
        (p_expense_data->>'total_amount')::NUMERIC,
        (p_expense_data->>'approval_status')::expense_approval_status,
        (p_expense_data->>'approved_by')::UUID,
        (p_expense_data->>'created_by')::UUID
    )
    RETURNING id INTO v_expense_id;

    -- 2. Insert Items (Loop through JSON array)
    -- Postgres JSON handling allows bulk insert via json_populate_recordset, 
    -- but looping is clearer for transformation if needed. 
    -- For bulk:
    INSERT INTO bazaar_items (
        expense_id,
        item_name,
        quantity,
        unit,
        unit_price
    )
    SELECT 
        v_expense_id,
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

    -- 3. Log Activity
    INSERT INTO activity_log (mess_id, actor_id, action, details)
    VALUES (
        v_mess_id,
        (p_expense_data->>'created_by')::UUID,
        'bazaar_added',
        jsonb_build_object(
            'expense_id', v_expense_id,
            'item_count', jsonb_array_length(p_items_data),
            'total', (p_expense_data->>'total_amount')::NUMERIC
        )
    );

    RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
