import { z } from 'zod';

// ============================================================================
// MEAL SCHEMAS
// ============================================================================

export const mealToggleSchema = z.object({
    memberId: z.string().uuid(),
    cycleId: z.string().uuid(),
    messId: z.string().uuid(),
    mealDate: z.string().date(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner']),
    value: z.boolean(),
});

export const guestMealSchema = z.object({
    memberId: z.string().uuid(),
    cycleId: z.string().uuid(),
    messId: z.string().uuid(),
    mealDate: z.string().date(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner']),
    count: z.number().int().min(0).max(10),
});

// ============================================================================
// BAZAAR SCHEMAS
// ============================================================================

export const bazaarItemSchema = z.object({
    itemName: z.string().min(1, 'Item name is required').max(100),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1).default('kg'),
    unitPrice: z.number().min(0, 'Price cannot be negative'),
});

export const bazaarExpenseSchema = z.object({
    cycleId: z.string().uuid(),
    messId: z.string().uuid(),
    shopperId: z.string().uuid(),
    expenseDate: z.string().date(),
    notes: z.string().max(500).optional(),
    items: z.array(bazaarItemSchema).min(1, 'At least one item is required'),
});

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const depositSchema = z.object({
    cycleId: z.string().uuid(),
    messId: z.string().uuid(),
    memberId: z.string().uuid(),
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'bank_transfer', 'other']),
    referenceNo: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
});

// ============================================================================
// COST SCHEMAS
// ============================================================================

export const fixedCostSchema = z.object({
    cycleId: z.string().uuid(),
    messId: z.string().uuid(),
    costType: z.enum(['cook_salary', 'wifi', 'gas', 'electricity', 'water', 'rent', 'cleaning', 'maintenance', 'other']),
    description: z.string().max(200).optional(),
    amount: z.number().positive('Amount must be positive'),
});

export const individualCostSchema = z.object({
    cycleId: z.string().uuid(),
    messId: z.string().uuid(),
    memberId: z.string().uuid(),
    description: z.string().min(1, 'Description is required').max(200),
    amount: z.number().positive('Amount must be positive'),
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// ============================================================================
// MESS SCHEMAS
// ============================================================================

export const createMessSchema = z.object({
    name: z.string().min(2, 'Mess name must be at least 2 characters').max(100),
    address: z.string().max(200).optional(),
});

export const joinMessSchema = z.object({
    inviteCode: z.string().min(4, 'Invalid invite code').max(20),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type MealToggleInput = z.infer<typeof mealToggleSchema>;
export type GuestMealInput = z.infer<typeof guestMealSchema>;
export type BazaarExpenseInput = z.infer<typeof bazaarExpenseSchema>;
export type BazaarItemInput = z.infer<typeof bazaarItemSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type FixedCostInput = z.infer<typeof fixedCostSchema>;
export type IndividualCostInput = z.infer<typeof individualCostSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateMessInput = z.infer<typeof createMessSchema>;
export type JoinMessInput = z.infer<typeof joinMessSchema>;
