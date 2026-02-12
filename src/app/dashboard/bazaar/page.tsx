'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { bazaarExpenseSchema, type BazaarExpenseInput } from '@/lib/validations';
import { addBazaarExpense, getBazaarExpenses } from '@/lib/actions/bazaar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Plus, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function BazaarPage() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const [ctx, setCtx] = useState<{ memberId: string; messId: string; cycleId: string } | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [items, setItems] = useState([{ itemName: '', quantity: 1, unit: 'kg', unitPrice: 0 }]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: m } = await supabase.from('mess_members').select('id, mess_id').eq('user_id', user.id).eq('status', 'active').limit(1).single();
            if (!m) return;
            const { data: c } = await supabase.from('mess_cycles').select('id').eq('mess_id', m.mess_id).eq('status', 'open').limit(1).single();
            if (!c) return;
            setCtx({ memberId: m.id, messId: m.mess_id, cycleId: c.id });
        }
        load();
    }, [supabase]);

    const expensesQuery = useQuery({
        queryKey: ['bazaar-expenses', ctx?.cycleId],
        queryFn: async () => {
            if (!ctx) return null;
            const result = await getBazaarExpenses(ctx.cycleId);
            if ('error' in result) return null;
            return result.data;
        },
        enabled: !!ctx,
    });

    const addItem = () => setItems([...items, { itemName: '', quantity: 1, unit: 'kg', unitPrice: 0 }]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: string, value: string | number) => {
        const updated = [...items];
        (updated[i] as Record<string, unknown>)[field] = value;
        setItems(updated);
    };

    const handleSubmit = async () => {
        if (!ctx) return;
        const validItems = items.filter(i => i.itemName.trim() && i.quantity > 0 && i.unitPrice > 0);
        if (validItems.length === 0) { toast.error('Add at least one valid item'); return; }

        setSubmitting(true);
        const result = await addBazaarExpense({
            cycleId: ctx.cycleId, messId: ctx.messId, shopperId: ctx.memberId,
            expenseDate: new Date().toISOString().split('T')[0],
            items: validItems,
        });
        setSubmitting(false);

        if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Failed'); return; }
        toast.success('Bazaar expense added!');
        setAddOpen(false);
        setItems([{ itemName: '', quantity: 1, unit: 'kg', unitPrice: 0 }]);
        queryClient.invalidateQueries({ queryKey: ['bazaar-expenses'] });
    };

    const totalSpent = (expensesQuery.data || []).reduce((s: number, e: Record<string, unknown>) => s + Number(e.total_amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bazaar Expenses</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Track shopping trips and items</p>
                </div>
                <Button onClick={() => setAddOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Expense
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Spent</p>
                        <p className="text-2xl font-bold mt-1">৳{totalSpent.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Trips</p>
                        <p className="text-2xl font-bold mt-1">{(expensesQuery.data || []).length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Expense List */}
            {expensesQuery.isLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !expensesQuery.data?.length ? (
                <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No expenses yet</p>
                    <p className="text-sm mt-1">Add your first bazaar expense to get started</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {expensesQuery.data.map((expense: Record<string, unknown>) => (
                        <Card key={expense.id as string} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><ShoppingCart className="h-4 w-4" /></div>
                                        <div>
                                            <p className="font-semibold">৳{Number(expense.total_amount).toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(expense.expense_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {((expense.items as unknown[]) || []).length} items
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {((expense.items as Record<string, unknown>[]) || []).map((item, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {item.item_name as string} · {Number(item.quantity)}{item.unit as string}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Expense Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Bazaar Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {items.map((item, i) => (
                            <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                                    {items.length > 1 && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}>
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                                <Input placeholder="Item name" value={item.itemName} onChange={e => updateItem(i, 'itemName', e.target.value)} className="h-9" />
                                <div className="grid grid-cols-3 gap-2">
                                    <Input type="number" placeholder="Qty" value={item.quantity || ''} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="h-9" />
                                    <Input placeholder="Unit" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="h-9" />
                                    <Input type="number" placeholder="Price" value={item.unitPrice || ''} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="h-9" />
                                </div>
                                <p className="text-xs text-right text-muted-foreground">
                                    Subtotal: ৳{(item.quantity * item.unitPrice).toLocaleString()}
                                </p>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full gap-2" onClick={addItem}>
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                        <div className="border-t pt-3 flex items-center justify-between">
                            <span className="font-semibold">Total: ৳{items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString()}</span>
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Expense'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
