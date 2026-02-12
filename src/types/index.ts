// ============================================================================
// KANGAL: Complete TypeScript Type Definitions
// Mirrors the PostgreSQL schema + frontend utility types
// ============================================================================

// ============================================================================
// ENUM TYPES
// ============================================================================

export type UserRole = 'manager' | 'member' | 'cook';
export type UserStatus = 'active' | 'inactive' | 'on_leave';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank_transfer' | 'other';
export type CostCategory = 'bazaar' | 'fixed' | 'individual' | 'deposit' | 'refund' | 'adjustment';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type FixedCostType = 'cook_salary' | 'wifi' | 'gas' | 'electricity' | 'water' | 'rent' | 'cleaning' | 'maintenance' | 'other';
export type CycleStatus = 'open' | 'closed' | 'archived';
export type NotificationType = 'meal_reminder' | 'expense_added' | 'deposit_confirmed' | 'month_closed' | 'low_balance' | 'announcement' | 'cost_approval' | 'system';

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mess {
  id: string;
  name: string;
  address: string | null;
  created_by: string;
  invite_code: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface MessMember {
  id: string;
  mess_id: string;
  user_id: string;
  role: UserRole;
  status: UserStatus;
  join_date: string;
  leave_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessCycle {
  id: string;
  mess_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  final_meal_rate: number | null;
  opening_balance: number;
  created_at: string;
  updated_at: string;
}

export interface DailyMeal {
  id: string;
  mess_id: string;
  cycle_id: string;
  member_id: string;
  meal_date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  guest_breakfast: number;
  guest_lunch: number;
  guest_dinner: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  mess_id: string;
  cycle_id: string;
  member_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_no: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface BazaarExpense {
  id: string;
  mess_id: string;
  cycle_id: string;
  shopper_id: string;
  expense_date: string;
  total_amount: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BazaarItem {
  id: string;
  expense_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface FixedCost {
  id: string;
  mess_id: string;
  cycle_id: string;
  cost_type: FixedCostType;
  description: string | null;
  amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IndividualCost {
  id: string;
  mess_id: string;
  cycle_id: string;
  member_id: string;
  description: string;
  amount: number;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  mess_id: string;
  item_name: string;
  current_qty: number;
  unit: string;
  reorder_level: number;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealCutoffConfig {
  id: string;
  mess_id: string;
  breakfast_cutoff: string;
  lunch_cutoff: string;
  dinner_cutoff: string;
  created_at: string;
  updated_at: string;
}

export interface MonthSnapshot {
  id: string;
  cycle_id: string;
  member_id: string;
  total_meals: number;
  total_meal_cost: number;
  total_fixed_cost: number;
  total_individual_cost: number;
  total_deposits: number;
  opening_balance: number;
  closing_balance: number;
  meal_rate: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  mess_id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  mess_id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INSERT / UPDATE TYPES (Omit auto-generated fields)
// ============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type MessInsert = Omit<Mess, 'id' | 'invite_code' | 'created_at' | 'updated_at'>;
export type MessUpdate = Partial<Omit<Mess, 'id' | 'created_by' | 'created_at' | 'updated_at'>>;

export type MessMemberInsert = Omit<MessMember, 'id' | 'created_at' | 'updated_at'>;
export type MessMemberUpdate = Partial<Pick<MessMember, 'role' | 'status' | 'leave_date'>>;

export type MessCycleInsert = Omit<MessCycle, 'id' | 'final_meal_rate' | 'created_at' | 'updated_at'>;

export type DailyMealInsert = Omit<DailyMeal, 'id' | 'created_at' | 'updated_at'>;
export type DailyMealUpdate = Partial<Pick<DailyMeal, 'breakfast' | 'lunch' | 'dinner' | 'guest_breakfast' | 'guest_lunch' | 'guest_dinner'>>;

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>;

export type BazaarExpenseInsert = Omit<BazaarExpense, 'id' | 'total_amount' | 'created_at' | 'updated_at'>;

export type BazaarItemInsert = Omit<BazaarItem, 'id' | 'total_price' | 'created_at'>;

export type FixedCostInsert = Omit<FixedCost, 'id' | 'created_at' | 'updated_at'>;

export type IndividualCostInsert = Omit<IndividualCost, 'id' | 'approval_status' | 'approved_by' | 'rejection_reason' | 'created_at' | 'updated_at'>;

// ============================================================================
// EXTENDED / JOIN TYPES (Frontend utility)
// ============================================================================

export interface MessMemberWithProfile extends MessMember {
  profile: Profile;
}

export interface BazaarExpenseWithItems extends BazaarExpense {
  items: BazaarItem[];
  shopper: MessMemberWithProfile;
}

export interface IndividualCostWithMember extends IndividualCost {
  member: MessMemberWithProfile;
}

// ============================================================================
// FRONTEND UTILITY TYPES
// ============================================================================

export interface DashboardStats {
  currentMealRate: number;
  provisionalMealRate: number;
  totalMembers: number;
  activeMembers: number;
  totalMealsToday: number;
  totalBazaarExpense: number;
  totalDeposits: number;
  cycleProgress: number; // 0-100%
  daysRemaining: number;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  openingBalance: number;
  totalDeposits: number;
  totalMeals: number;
  mealCost: number;
  fixedCostShare: number;
  individualCostTotal: number;
  currentBalance: number;
}

export interface MealToggleState {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  guestBreakfast: number;
  guestLunch: number;
  guestDinner: number;
  breakfastLocked: boolean;
  lunchLocked: boolean;
  dinnerLocked: boolean;
}

export interface FinancialSummary {
  cycleId: string;
  cycleName: string;
  mealRate: number;
  totalBazaar: number;
  totalFixed: number;
  totalDeposits: number;
  totalMeals: number;
  members: MemberBalance[];
}

export interface MonthClosePreview {
  cycleId: string;
  cycleName: string;
  finalMealRate: number;
  memberSummaries: MemberBalance[];
  warnings: string[];
}
