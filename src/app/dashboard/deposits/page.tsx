'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { addDeposit } from '@/lib/actions/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Plus, Loader2, Calendar, Banknote } from 'lucide-react';
import { toast } from 'sonner';

export default function DepositsPage() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const [ctx, setCtx] = useState<{ memberId: string; messId: string; cycleId: string; role: string } | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [refNo, setRefNo] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: m } = await supabase.from('mess_members').select('id, mess_id, role').eq('user_id', user.id).eq('status', 'active').limit(1).single();
            if (!m) return;
            const { data: c } = await supabase.from('mess_cycles').select('id').eq('mess_id', m.mess_id).eq('status', 'open').limit(1).single();
            if (!c) return;
            setCtx({ memberId: m.id, messId: m.mess_id, cycleId: c.id, role: m.role });
            setSelectedMember(m.id);
        }
        load();
    }, [supabase]);

    const isManager = ctx?.role === 'manager';

    // Fetch all members for the selector (managers only)
    const membersQuery = useQuery({
        queryKey: ['deposit-members', ctx?.messId],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase
                .from('mess_members')
                .select('id, role, profile:profiles(full_name)')
                .eq('mess_id', ctx.messId)
                .eq('status', 'active')
                .order('role', { ascending: true });
            return data || [];
        },
        enabled: !!ctx && isManager,
    });

    const depositsQuery = useQuery({
        queryKey: ['deposits', ctx?.cycleId],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase
                .from('transactions')
                .select('*, member:mess_members(*, profile:profiles(full_name))')
                .eq('cycle_id', ctx.cycleId)
                .order('created_at', { ascending: false });
            return data || [];
        },
        enabled: !!ctx,
    });

    const handleSubmit = async () => {
        if (!ctx || !amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
        const targetMember = isManager ? selectedMember : ctx.memberId;
        if (!targetMember) { toast.error('Select a member'); return; }

        setSubmitting(true);
        const result = await addDeposit({
            cycleId: ctx.cycleId, messId: ctx.messId, memberId: targetMember,
            amount: Number(amount), paymentMethod: method,
            referenceNo: refNo || undefined, notes: notes || undefined,
        });
        setSubmitting(false);
        if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Failed'); return; }
        toast.success('Deposit recorded!');
        setAddOpen(false);
        setAmount(''); setRefNo(''); setNotes('');
        queryClient.invalidateQueries({ queryKey: ['deposits'] });
    };

    const totalDeposits = (depositsQuery.data || []).reduce((s: number, d: Record<string, unknown>) => s + Number(d.amount || 0), 0);
    const methodLabels: Record<string, string> = { cash: 'Cash', bkash: 'bKash', nagad: 'Nagad', bank_transfer: 'Bank', other: 'Other' };
    const methodColors: Record<string, string> = { cash: 'bg-green-500/10 text-green-500', bkash: 'bg-pink-500/10 text-pink-500', nagad: 'bg-orange-500/10 text-orange-500', bank_transfer: 'bg-blue-500/10 text-blue-500', other: 'bg-gray-500/10 text-gray-500' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Deposits</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Track member deposits and payments</p>
                </div>
                <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Deposit</Button>
            </div>

            {/* Summary */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Deposits This Cycle</p>
                        <p className="text-2xl font-bold mt-1">৳{totalDeposits.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10"><Wallet className="h-6 w-6 text-emerald-500" /></div>
                </CardContent>
            </Card>

            {/* Deposits List */}
            {depositsQuery.isLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : !depositsQuery.data?.length ? (
                <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No deposits yet</p>
                    <p className="text-sm mt-1">Add your first deposit to start tracking</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {depositsQuery.data.map((d: Record<string, unknown>) => (
                        <Card key={d.id as string} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${methodColors[(d.payment_method as string) || 'cash']}`}>
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">৳{Number(d.amount).toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {((d.member as Record<string, unknown>)?.profile as Record<string, unknown>)?.full_name as string || 'Member'} · {new Date(d.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className={`text-xs ${methodColors[(d.payment_method as string) || 'cash']}`}>
                                    {methodLabels[(d.payment_method as string) || 'cash']}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Record Deposit</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                        {/* Member Selector — only shown to managers */}
                        {isManager && (
                            <div className="space-y-2">
                                <Label>Member</Label>
                                <Select value={selectedMember} onValueChange={setSelectedMember}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select member" /></SelectTrigger>
                                    <SelectContent>
                                        {(membersQuery.data || []).map((m: Record<string, unknown>) => (
                                            <SelectItem key={m.id as string} value={m.id as string}>
                                                {(m.profile as Record<string, unknown>)?.full_name as string || 'Unknown'}
                                                {m.id === ctx?.memberId ? ' (You)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Amount (৳)</Label>
                            <Input type="number" placeholder="e.g. 3000" value={amount} onChange={e => setAmount(e.target.value)} className="h-11 text-lg" />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bkash">bKash</SelectItem>
                                    <SelectItem value="nagad">Nagad</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reference No. (optional)</Label>
                            <Input placeholder="TrxID" value={refNo} onChange={e => setRefNo(e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Input placeholder="Any notes" value={notes} onChange={e => setNotes(e.target.value)} className="h-11" />
                        </div>
                        <Button className="w-full h-11" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Record Deposit'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
