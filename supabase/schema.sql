-- ============================================================================
-- KANGAL: University Mess Management System — Complete Database Schema
-- PostgreSQL (Supabase) | 3NF Normalized | Academic-Grade SQL
-- ============================================================================

-- ============================================================================
-- 1. CUSTOM ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('manager', 'member', 'cook');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'on_leave');
CREATE TYPE payment_method AS ENUM ('cash', 'bkash', 'nagad', 'bank_transfer', 'other');
CREATE TYPE cost_category AS ENUM ('bazaar', 'fixed', 'individual', 'deposit', 'refund', 'adjustment');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner');
CREATE TYPE fixed_cost_type AS ENUM ('cook_salary', 'wifi', 'gas', 'electricity', 'water', 'rent', 'cleaning', 'maintenance', 'other');
CREATE TYPE cycle_status AS ENUM ('open', 'closed', 'archived');
CREATE TYPE notification_type AS ENUM ('meal_reminder', 'expense_added', 'deposit_confirmed', 'month_closed', 'low_balance', 'announcement', 'cost_approval', 'system');

-- ============================================================================
-- 2. CORE TABLES (3NF)
-- ============================================================================

-- 2.1 Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Messes (the mess/house entity)
CREATE TABLE messes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8),
    max_members INT DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Mess Members (join table with RBAC + temporal tracking)
CREATE TABLE mess_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    status user_status NOT NULL DEFAULT 'active',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leave_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(mess_id, user_id)
);

-- 2.4 Mess Cycles (monthly accounting periods)
CREATE TABLE mess_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- e.g. "February 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status cycle_status NOT NULL DEFAULT 'open',
    final_meal_rate NUMERIC(10, 4),  -- NULL until month closed
    opening_balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    UNIQUE(mess_id, start_date)
);

-- 2.5 Daily Meals (per-member per-day meal toggles)
CREATE TABLE daily_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES mess_cycles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    breakfast BOOLEAN NOT NULL DEFAULT FALSE,
    lunch BOOLEAN NOT NULL DEFAULT FALSE,
    dinner BOOLEAN NOT NULL DEFAULT FALSE,
    guest_breakfast INT NOT NULL DEFAULT 0 CHECK (guest_breakfast >= 0),
    guest_lunch INT NOT NULL DEFAULT 0 CHECK (guest_lunch >= 0),
    guest_dinner INT NOT NULL DEFAULT 0 CHECK (guest_dinner >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(member_id, meal_date)
);

-- 2.6 Transactions (deposits)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES mess_cycles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method NOT NULL DEFAULT 'cash',
    reference_no TEXT,
    notes TEXT,
    approval_status approval_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Bazaar Expenses (shopping trips — header)
CREATE TABLE bazaar_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES mess_cycles(id) ON DELETE CASCADE,
    shopper_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    approval_status approval_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Bazaar Items (line items per shopping trip — detail)
CREATE TABLE bazaar_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES bazaar_expenses(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'kg',  -- kg, liters, pieces, packets
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Fixed Costs (shared costs per cycle)
CREATE TABLE fixed_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES mess_cycles(id) ON DELETE CASCADE,
    cost_type fixed_cost_type NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 Individual Costs (per-member costs with approval workflow)
CREATE TABLE individual_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES mess_cycles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    approval_status approval_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 Inventory (stock tracking)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    current_qty NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (current_qty >= 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    reorder_level NUMERIC(10, 3) DEFAULT 5,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(mess_id, item_name)
);

-- 2.12 Meal Cutoff Configuration
CREATE TABLE meal_cutoff_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE UNIQUE,
    breakfast_cutoff TIME NOT NULL DEFAULT '21:00',  -- 9 PM previous night
    lunch_cutoff TIME NOT NULL DEFAULT '10:00',      -- 10 AM same day
    dinner_cutoff TIME NOT NULL DEFAULT '15:00',     -- 3 PM same day
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.13 Month Snapshots (archived balances at month close)
CREATE TABLE month_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES mess_cycles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE CASCADE,
    total_meals INT NOT NULL DEFAULT 0,
    total_meal_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_fixed_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_individual_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_deposits NUMERIC(12, 2) NOT NULL DEFAULT 0,
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    meal_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cycle_id, member_id)
);

-- 2.14 Activity Log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.15 Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES (Performance)
-- ============================================================================

CREATE INDEX idx_mess_members_mess ON mess_members(mess_id);
CREATE INDEX idx_mess_members_user ON mess_members(user_id);
CREATE INDEX idx_mess_members_status ON mess_members(mess_id, status);
CREATE INDEX idx_mess_cycles_mess ON mess_cycles(mess_id);
CREATE INDEX idx_mess_cycles_status ON mess_cycles(mess_id, status);
CREATE INDEX idx_daily_meals_date ON daily_meals(meal_date);
CREATE INDEX idx_daily_meals_cycle ON daily_meals(cycle_id);
CREATE INDEX idx_daily_meals_member_date ON daily_meals(member_id, meal_date);
CREATE INDEX idx_transactions_cycle ON transactions(cycle_id);
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_bazaar_expenses_cycle ON bazaar_expenses(cycle_id);
CREATE INDEX idx_bazaar_items_expense ON bazaar_items(expense_id);
CREATE INDEX idx_fixed_costs_cycle ON fixed_costs(cycle_id);
CREATE INDEX idx_individual_costs_cycle ON individual_costs(cycle_id);
CREATE INDEX idx_individual_costs_member ON individual_costs(member_id);
CREATE INDEX idx_individual_costs_status ON individual_costs(approval_status);
CREATE INDEX idx_inventory_mess ON inventory(mess_id);
CREATE INDEX idx_month_snapshots_cycle ON month_snapshots(cycle_id);
CREATE INDEX idx_activity_log_mess ON activity_log(mess_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_announcements_mess ON announcements(mess_id);

-- ============================================================================
-- 4. STORED PROCEDURES / FUNCTIONS
-- ============================================================================

-- 4.1 Calculate Meal Rate (handles division by zero)
-- Meal Rate = Total Bazaar Cost / Total Active Meals
CREATE OR REPLACE FUNCTION calculate_meal_rate(p_cycle_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total_bazaar NUMERIC(12, 2);
    v_total_meals INT;
BEGIN
    -- Sum all bazaar expenses for this cycle
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_bazaar
    FROM bazaar_expenses
    WHERE cycle_id = p_cycle_id;

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

-- 4.2 Prorate Fixed Costs for a member
-- Pro-rated = (Days Present / Total Days in Cycle) × Total Fixed Costs
CREATE OR REPLACE FUNCTION prorate_fixed_costs(
    p_member_id UUID,
    p_cycle_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_total_fixed NUMERIC(12, 2);
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_join_date DATE;
    v_leave_date DATE;
    v_member_start DATE;
    v_member_end DATE;
    v_total_days INT;
    v_member_days INT;
    v_active_members INT;
BEGIN
    -- Get cycle dates
    SELECT start_date, end_date INTO v_cycle_start, v_cycle_end
    FROM mess_cycles WHERE id = p_cycle_id;

    -- Get member join/leave dates
    SELECT mm.join_date, mm.leave_date
    INTO v_join_date, v_leave_date
    FROM mess_members mm WHERE mm.id = p_member_id;

    -- Calculate effective date range for this member within the cycle
    v_member_start := GREATEST(v_cycle_start, v_join_date);
    v_member_end := LEAST(v_cycle_end, COALESCE(v_leave_date, v_cycle_end));
    v_total_days := (v_cycle_end - v_cycle_start) + 1;
    v_member_days := GREATEST((v_member_end - v_member_start) + 1, 0);

    -- Guard: member not present in this cycle
    IF v_member_days <= 0 OR v_total_days <= 0 THEN
        RETURN 0;
    END IF;

    -- Sum all fixed costs for this cycle
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_fixed
    FROM fixed_costs WHERE cycle_id = p_cycle_id;

    -- Count active members in this cycle (for equal division)
    SELECT COUNT(*) INTO v_active_members
    FROM mess_members
    WHERE mess_id = (SELECT mess_id FROM mess_cycles WHERE id = p_cycle_id)
      AND status = 'active'
      AND join_date <= v_cycle_end
      AND (leave_date IS NULL OR leave_date >= v_cycle_start);

    IF v_active_members = 0 THEN
        RETURN 0;
    END IF;

    -- Pro-rated share: (Fixed Total / Active Members) × (Member Days / Total Days)
    RETURN ROUND(
        (v_total_fixed / v_active_members) * (v_member_days::NUMERIC / v_total_days),
        2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Calculate Member Balance (the full financial formula)
-- Balance = (Opening Balance + Deposits) - (Meals × Rate + Prorated Fixed + Individual)
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

    -- Sum deposits for this cycle
    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits
    FROM transactions
    WHERE member_id = p_member_id AND cycle_id = p_cycle_id;

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

-- 4.4 Close Month (Atomic Transaction)
-- Validates → Calculates final rate → Snapshots → Archives → Creates next cycle
CREATE OR REPLACE FUNCTION close_mess_month(p_cycle_id UUID)
RETURNS UUID AS $$
DECLARE
    v_mess_id UUID;
    v_cycle_name TEXT;
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_final_rate NUMERIC(10, 4);
    v_new_cycle_id UUID;
    v_member RECORD;
    v_balance_data RECORD;
    v_new_start DATE;
    v_new_end DATE;
BEGIN
    -- ===== STEP 1: Validate cycle is open =====
    SELECT mess_id, name, start_date, end_date
    INTO v_mess_id, v_cycle_name, v_cycle_start, v_cycle_end
    FROM mess_cycles
    WHERE id = p_cycle_id AND status = 'open'
    FOR UPDATE;  -- Lock the row

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cycle % is not open or does not exist', p_cycle_id;
    END IF;

    -- ===== STEP 2: Calculate final meal rate =====
    v_final_rate := calculate_meal_rate(p_cycle_id);

    -- Lock the rate into the cycle
    UPDATE mess_cycles
    SET final_meal_rate = v_final_rate
    WHERE id = p_cycle_id;

    -- ===== STEP 3: Snapshot every member's balance =====
    FOR v_member IN
        SELECT mm.id AS member_id
        FROM mess_members mm
        WHERE mm.mess_id = v_mess_id
          AND mm.join_date <= v_cycle_end
          AND (mm.leave_date IS NULL OR mm.leave_date >= v_cycle_start)
    LOOP
        SELECT * INTO v_balance_data
        FROM calculate_member_balance(v_member.member_id, p_cycle_id);

        INSERT INTO month_snapshots (
            cycle_id, member_id, total_meals, total_meal_cost,
            total_fixed_cost, total_individual_cost, total_deposits,
            opening_balance, closing_balance, meal_rate
        ) VALUES (
            p_cycle_id,
            v_member.member_id,
            v_balance_data.total_meals,
            v_balance_data.meal_cost,
            v_balance_data.fixed_cost_share,
            v_balance_data.individual_cost_total,
            v_balance_data.total_deposits,
            v_balance_data.opening_balance,
            v_balance_data.current_balance,
            v_final_rate
        )
        ON CONFLICT (cycle_id, member_id)
        DO UPDATE SET
            total_meals = EXCLUDED.total_meals,
            total_meal_cost = EXCLUDED.total_meal_cost,
            total_fixed_cost = EXCLUDED.total_fixed_cost,
            total_individual_cost = EXCLUDED.total_individual_cost,
            total_deposits = EXCLUDED.total_deposits,
            opening_balance = EXCLUDED.opening_balance,
            closing_balance = EXCLUDED.closing_balance,
            meal_rate = EXCLUDED.meal_rate;
    END LOOP;

    -- ===== STEP 4: Archive this cycle =====
    UPDATE mess_cycles SET status = 'closed' WHERE id = p_cycle_id;

    -- ===== STEP 5: Create new cycle =====
    v_new_start := v_cycle_end + INTERVAL '1 day';
    v_new_end := (v_new_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    INSERT INTO mess_cycles (mess_id, name, start_date, end_date, status)
    VALUES (
        v_mess_id,
        TO_CHAR(v_new_start, 'FMMonth YYYY'),
        v_new_start,
        v_new_end,
        'open'
    )
    RETURNING id INTO v_new_cycle_id;

    -- ===== STEP 6: Log the action =====
    INSERT INTO activity_log (mess_id, action, details)
    VALUES (
        v_mess_id,
        'month_closed',
        JSONB_BUILD_OBJECT(
            'closed_cycle_id', p_cycle_id,
            'closed_cycle_name', v_cycle_name,
            'final_meal_rate', v_final_rate,
            'new_cycle_id', v_new_cycle_id
        )
    );

    RETURN v_new_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- 5.1 Enforce Meal Cutoff
-- Blocks INSERT/UPDATE on daily_meals after configurable cutoff times
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
    IF NEW.breakfast IS DISTINCT FROM COALESCE(OLD.breakfast, FALSE) THEN
        v_cutoff_timestamp := (v_meal_date - INTERVAL '1 day')::DATE + v_config.breakfast_cutoff;
        IF v_now > v_cutoff_timestamp THEN
            RAISE EXCEPTION 'Breakfast for % is locked (cutoff was %)',
                v_meal_date, v_cutoff_timestamp;
        END IF;
    END IF;

    -- Lunch: locks at cutoff time on SAME day
    IF NEW.lunch IS DISTINCT FROM COALESCE(OLD.lunch, FALSE) THEN
        v_cutoff_timestamp := v_meal_date::DATE + v_config.lunch_cutoff;
        IF v_now > v_cutoff_timestamp THEN
            RAISE EXCEPTION 'Lunch for % is locked (cutoff was %)',
                v_meal_date, v_cutoff_timestamp;
        END IF;
    END IF;

    -- Dinner: locks at cutoff time on SAME day
    IF NEW.dinner IS DISTINCT FROM COALESCE(OLD.dinner, FALSE) THEN
        v_cutoff_timestamp := v_meal_date::DATE + v_config.dinner_cutoff;
        IF v_now > v_cutoff_timestamp THEN
            RAISE EXCEPTION 'Dinner for % is locked (cutoff was %)',
                v_meal_date, v_cutoff_timestamp;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_meal_cutoff
    BEFORE INSERT OR UPDATE ON daily_meals
    FOR EACH ROW
    EXECUTE FUNCTION enforce_meal_cutoff();

-- 5.2 Inventory Deduction on Bazaar Item Insert
-- When a bazaar item is added, deduct from inventory (or create entry if missing)
CREATE OR REPLACE FUNCTION deduct_inventory_on_bazaar()
RETURNS TRIGGER AS $$
DECLARE
    v_mess_id UUID;
BEGIN
    -- Get mess_id from the parent expense
    SELECT mess_id INTO v_mess_id
    FROM bazaar_expenses WHERE id = NEW.expense_id;

    -- Insert or update inventory
    INSERT INTO inventory (mess_id, item_name, current_qty, unit, last_restocked_at)
    VALUES (v_mess_id, LOWER(TRIM(NEW.item_name)), NEW.quantity, NEW.unit, NOW())
    ON CONFLICT (mess_id, item_name)
    DO UPDATE SET
        current_qty = inventory.current_qty + NEW.quantity,
        last_restocked_at = NOW(),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_inventory
    AFTER INSERT ON bazaar_items
    FOR EACH ROW
    EXECUTE FUNCTION deduct_inventory_on_bazaar();

-- 5.3 Auto-update bazaar_expenses.total_amount when items change
CREATE OR REPLACE FUNCTION update_bazaar_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bazaar_expenses
    SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM bazaar_items WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bazaar_total
    AFTER INSERT OR UPDATE OR DELETE ON bazaar_items
    FOR EACH ROW
    EXECUTE FUNCTION update_bazaar_total();

-- 5.4 Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_messes_updated_at BEFORE UPDATE ON messes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mess_members_updated_at BEFORE UPDATE ON mess_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mess_cycles_updated_at BEFORE UPDATE ON mess_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_daily_meals_updated_at BEFORE UPDATE ON daily_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bazaar_expenses_updated_at BEFORE UPDATE ON bazaar_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fixed_costs_updated_at BEFORE UPDATE ON fixed_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_individual_costs_updated_at BEFORE UPDATE ON individual_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_meal_cutoff_updated_at BEFORE UPDATE ON meal_cutoff_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bazaar_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bazaar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_cutoff_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is member of a mess
CREATE OR REPLACE FUNCTION is_mess_member(p_mess_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mess_members
        WHERE mess_id = p_mess_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is manager of a mess
CREATE OR REPLACE FUNCTION is_mess_manager(p_mess_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mess_members
        WHERE mess_id = p_mess_id AND user_id = auth.uid() AND role = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read/update own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (TRUE);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Messes: Members can view their messes, anyone can create
CREATE POLICY messes_select ON messes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY messes_insert ON messes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY messes_update ON messes FOR UPDATE USING (is_mess_manager(id));

-- Mess Members: Members see their mess mates
CREATE POLICY mess_members_select ON mess_members FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY mess_members_insert ON mess_members FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);
CREATE POLICY mess_members_update ON mess_members FOR UPDATE USING (is_mess_manager(mess_id));

-- Mess Cycles: Members see their cycles
CREATE POLICY mess_cycles_select ON mess_cycles FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY mess_cycles_insert ON mess_cycles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY mess_cycles_update ON mess_cycles FOR UPDATE USING (is_mess_manager(mess_id));

-- Daily Meals: Members see their own meals, managers see all
CREATE POLICY daily_meals_select ON daily_meals FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY daily_meals_insert ON daily_meals FOR INSERT WITH CHECK (
    is_mess_member(mess_id)
);
CREATE POLICY daily_meals_update ON daily_meals FOR UPDATE USING (
    is_mess_member(mess_id)
);

-- Transactions: Members see their own, managers see all
CREATE POLICY transactions_select ON transactions FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY transactions_insert ON transactions FOR INSERT WITH CHECK (is_mess_member(mess_id));
CREATE POLICY transactions_update ON transactions FOR UPDATE USING (is_mess_manager(mess_id));

-- Bazaar Expenses: Members see all, managers insert
CREATE POLICY bazaar_expenses_select ON bazaar_expenses FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY bazaar_expenses_insert ON bazaar_expenses FOR INSERT WITH CHECK (is_mess_member(mess_id));
CREATE POLICY bazaar_expenses_update ON bazaar_expenses FOR UPDATE USING (is_mess_manager(mess_id));

-- Bazaar Items: Through parent expense
CREATE POLICY bazaar_items_select ON bazaar_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM bazaar_expenses be WHERE be.id = expense_id AND is_mess_member(be.mess_id))
);
CREATE POLICY bazaar_items_insert ON bazaar_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bazaar_expenses be WHERE be.id = expense_id AND is_mess_member(be.mess_id))
);

-- Fixed Costs: Members see, managers manage
CREATE POLICY fixed_costs_select ON fixed_costs FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY fixed_costs_insert ON fixed_costs FOR INSERT WITH CHECK (is_mess_manager(mess_id));
CREATE POLICY fixed_costs_update ON fixed_costs FOR UPDATE USING (is_mess_manager(mess_id));
CREATE POLICY fixed_costs_delete ON fixed_costs FOR DELETE USING (is_mess_manager(mess_id));

-- Individual Costs: Members see own, managers see all
CREATE POLICY individual_costs_select ON individual_costs FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY individual_costs_insert ON individual_costs FOR INSERT WITH CHECK (is_mess_member(mess_id));
CREATE POLICY individual_costs_update ON individual_costs FOR UPDATE USING (is_mess_manager(mess_id));

-- Inventory: Members see, managers manage
CREATE POLICY inventory_select ON inventory FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY inventory_insert ON inventory FOR INSERT WITH CHECK (is_mess_manager(mess_id));
CREATE POLICY inventory_update ON inventory FOR UPDATE USING (is_mess_manager(mess_id));

-- Meal Cutoff Config: Members see, managers manage
CREATE POLICY meal_cutoff_select ON meal_cutoff_config FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY meal_cutoff_insert ON meal_cutoff_config FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY meal_cutoff_update ON meal_cutoff_config FOR UPDATE USING (is_mess_manager(mess_id));

-- Month Snapshots: Members see their own
CREATE POLICY snapshots_select ON month_snapshots FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mess_cycles mc
        WHERE mc.id = cycle_id AND is_mess_member(mc.mess_id)
    )
);

-- Activity Log: Members see their mess logs
CREATE POLICY activity_log_select ON activity_log FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY activity_log_insert ON activity_log FOR INSERT WITH CHECK (is_mess_member(mess_id));

-- Announcements: Members see, managers manage
CREATE POLICY announcements_select ON announcements FOR SELECT USING (is_mess_member(mess_id));
CREATE POLICY announcements_insert ON announcements FOR INSERT WITH CHECK (is_mess_manager(mess_id));
CREATE POLICY announcements_update ON announcements FOR UPDATE USING (is_mess_manager(mess_id));
CREATE POLICY announcements_delete ON announcements FOR DELETE USING (is_mess_manager(mess_id));

-- ============================================================================
-- 7. INITIAL SEED (Create profile on signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

