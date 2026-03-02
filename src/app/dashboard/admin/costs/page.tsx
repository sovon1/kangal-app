'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { addFixedCost, addIndividualCost, getMemberBalance } from '@/lib/actions/finance';
import { exportSingleMemberPDF, exportAllMembersPDF } from '@/lib/pdf-export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Plus, Loader2, Zap, Wifi, Flame, Droplets, Home, Wrench, ChefHat, Layers, FileDown, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useMessContext } from '@/components/mess-context';

const COST_ICONS: Record<string, typeof DollarSign> = {
    cook_salary: ChefHat, wifi: Wifi, gas: Flame, electricity: Zap,
    water: Droplets, rent: Home, maintenance: Wrench, other: Layers,
    cleaning: Layers,
};

const COST_TYPES = ['cook_salary', 'wifi', 'gas', 'electricity', 'water', 'rent', 'cleaning', 'maintenance', 'other'];

export default function CostsPage() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const messCtx = useMessContext();
    const ctx = messCtx ? { memberId: messCtx.memberId, messId: messCtx.messId, cycleId: messCtx.cycleId } : null;
    const [cycleMeta, setCycleMeta] = useState<{ messName: string; cycleName: string; startDate: string; endDate: string } | null>(null);
    const [fixedOpen, setFixedOpen] = useState(false);
    const [indOpen, setIndOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportMember, setExportMember] = useState('all');
    const [exporting, setExporting] = useState(false);
    const [costType, setCostType] = useState('cook_salary');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [indDesc, setIndDesc] = useState('');
    const [indAmount, setIndAmount] = useState('');
    const [indMember, setIndMember] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Only fetch extra cycle metadata (name, dates) that the context doesn't provide
    useEffect(() => {
        if (!ctx) return;
        async function loadMeta() {
            const [cycleRes, messRes] = await Promise.all([
                supabase.from('mess_cycles').select('name, start_date, end_date').eq('id', ctx!.cycleId).single(),
                supabase.from('messes').select('name').eq('id', ctx!.messId).single(),
            ]);
            setCycleMeta({
                messName: messRes.data?.name || 'Mess',
                cycleName: cycleRes.data?.name || 'Current Cycle',
                startDate: new Date(cycleRes.data?.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                endDate: new Date(cycleRes.data?.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            });
        }
        loadMeta();
    }, [ctx?.cycleId, ctx?.messId, supabase]);

    const fixedQuery = useQuery({
        queryKey: ['fixed-costs', ctx?.cycleId],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase.from('fixed_costs').select('*').eq('cycle_id', ctx.cycleId).order('created_at', { ascending: false });
            return data || [];
        },
        enabled: !!ctx,
        staleTime: 30000,
    });

    const indQuery = useQuery({
        queryKey: ['individual-costs', ctx?.cycleId],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase.from('individual_costs').select('*, member:mess_members(*, profile:profiles(full_name))').eq('cycle_id', ctx.cycleId).order('created_at', { ascending: false });
            return data || [];
        },
        enabled: !!ctx,
        staleTime: 30000,
    });

    const membersQuery = useQuery({
        queryKey: ['members-list', ctx?.messId],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase.from('mess_members').select('id, role, profile:profiles(full_name)').eq('mess_id', ctx.messId).eq('status', 'active');
            return data || [];
        },
        enabled: !!ctx,
        staleTime: 60000,
    });

    const handleAddFixed = async () => {
        if (!ctx || !amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
        setSubmitting(true);
        const result = await addFixedCost({
            cycleId: ctx.cycleId, messId: ctx.messId, costType,
            amount: Number(amount), description: description || undefined,
        });
        setSubmitting(false);
        if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Failed'); return; }
        toast.success('Fixed cost added!');
        setFixedOpen(false); setAmount(''); setDescription('');
        queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
    };

    const handleAddIndividual = async () => {
        if (!ctx || !indAmount || Number(indAmount) <= 0 || !indDesc || !indMember) { toast.error('Fill all fields'); return; }
        setSubmitting(true);
        const result = await addIndividualCost({
            cycleId: ctx.cycleId, messId: ctx.messId, memberId: indMember,
            description: indDesc, amount: Number(indAmount),
        });
        setSubmitting(false);
        if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Failed'); return; }
        toast.success('Individual cost added!');
        setIndOpen(false); setIndAmount(''); setIndDesc(''); setIndMember('');
        queryClient.invalidateQueries({ queryKey: ['individual-costs'] });
    };

    // ==================== PDF EXPORT ====================
    const handleExport = async () => {
        if (!ctx || !cycleMeta) return;

        setExporting(true);
        try {
            const members = membersQuery.data || [];

            if (exportMember === 'all') {
                // All members report
                const memberData = await Promise.all(
                    members.map(async (m: Record<string, unknown>) => {
                        const balance = await getMemberBalance(m.id as string, ctx.cycleId);
                        const profile = m.profile as Record<string, unknown>;

                        // Get bazaar for this member
                        const { data: bazaarData } = await supabase
                            .from('bazaar_expenses')
                            .select('total_amount')
                            .eq('cycle_id', ctx.cycleId)
                            .eq('shopper_id', m.id as string);

                        const bazaarSpent = (bazaarData || []).reduce((s, e) => s + Number(e.total_amount), 0);

                        const bal = balance as Record<string, unknown>;
                        return {
                            memberName: (profile?.full_name as string) || 'Unknown',
                            totalMeals: Number(bal.totalMeals) || 0,
                            mealRate: Number(bal.mealRate) || 0,
                            mealCost: Number(bal.mealCost) || 0,
                            bazaarSpent,
                            deposits: Number(bal.totalDeposits) || 0,
                            fixedCostShare: Number(bal.fixedCostShare) || 0,
                            individualCosts: Number(bal.individualCostTotal) || 0,
                            balance: Number(bal.currentBalance) || 0,
                        };
                    })
                );

                const fixedCostsData = (fixedQuery.data || []).map((c: Record<string, unknown>) => ({
                    type: (c.cost_type as string) || 'other',
                    amount: Number(c.amount),
                }));

                const { data: allDeposits } = await supabase.from('transactions').select('amount').eq('cycle_id', ctx.cycleId);
                const { data: allBazaar } = await supabase.from('bazaar_expenses').select('total_amount').eq('cycle_id', ctx.cycleId);

                exportAllMembersPDF(
                    memberData,
                    cycleMeta,
                    fixedCostsData,
                    (allBazaar || []).reduce((s, e) => s + Number(e.total_amount), 0),
                    (allDeposits || []).reduce((s, d) => s + Number(d.amount), 0)
                );

                toast.success('All members report downloaded!');
            } else {
                // Single member report
                const member = members.find((m: Record<string, unknown>) => m.id === exportMember);
                if (!member) { toast.error('Member not found'); return; }

                const profile = (member as Record<string, unknown>).profile as Record<string, unknown>;
                const balance = await getMemberBalance(exportMember, ctx.cycleId);

                // Fetch deposits for this member
                const { data: depositData } = await supabase
                    .from('transactions')
                    .select('*, member:mess_members(id)')
                    .eq('cycle_id', ctx.cycleId)
                    .eq('member_id', exportMember)
                    .order('created_at', { ascending: false });

                const deposits = (depositData || []).map((d: Record<string, unknown>) => ({
                    date: new Date(d.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    amount: Number(d.amount),
                    method: (d.payment_method as string) || 'cash',
                }));

                // Fetch bazaar trips for this member
                const { data: bazaarData } = await supabase
                    .from('bazaar_expenses')
                    .select('*')
                    .eq('cycle_id', ctx.cycleId)
                    .eq('shopper_id', exportMember)
                    .order('expense_date', { ascending: false });

                const bazaarTrips = (bazaarData || []).map((b: Record<string, unknown>) => ({
                    date: new Date((b.expense_date || b.created_at) as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    amount: Number(b.total_amount),
                    items: (b.notes as string) || '-',
                }));

                const bazaarSpent = bazaarTrips.reduce((s, b) => s + b.amount, 0);

                // Fetch individual costs for this member
                const { data: indCostData } = await supabase
                    .from('individual_costs')
                    .select('*')
                    .eq('cycle_id', ctx.cycleId)
                    .eq('member_id', exportMember)
                    .order('created_at', { ascending: false });

                const individualCosts = (indCostData || []).map((c: Record<string, unknown>) => ({
                    description: (c.description as string) || '-',
                    amount: Number(c.amount),
                    status: (c.approval_status as string) || 'pending',
                }));

                const bal = balance as Record<string, unknown>;
                const memberCostData = {
                    memberName: (profile?.full_name as string) || 'Unknown',
                    totalMeals: Number(bal.totalMeals) || 0,
                    mealRate: Number(bal.mealRate) || 0,
                    mealCost: Number(bal.mealCost) || 0,
                    bazaarSpent,
                    deposits: Number(bal.totalDeposits) || 0,
                    fixedCostShare: Number(bal.fixedCostShare) || 0,
                    individualCosts: Number(bal.individualCostTotal) || 0,
                    balance: Number(bal.currentBalance) || 0,
                };

                exportSingleMemberPDF(memberCostData, cycleMeta, deposits, bazaarTrips, individualCosts);
                toast.success(`${memberCostData.memberName}'s report downloaded!`);
            }
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to generate PDF');
        } finally {
            setExporting(false);
            setExportOpen(false);
        }
    };

    const totalFixed = (fixedQuery.data || []).reduce((s: number, c: Record<string, unknown>) => s + Number(c.amount || 0), 0);
    const approvalColors: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-600', approved: 'bg-emerald-500/10 text-emerald-600', rejected: 'bg-red-500/10 text-red-600' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cost Management</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage fixed and individual costs</p>
                </div>
                <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-2">
                    <FileDown className="h-4 w-4" /> Export PDF
                </Button>
            </div>

            <Tabs defaultValue="fixed">
                <TabsList className="w-full">
                    <TabsTrigger value="fixed" className="flex-1">Fixed Costs</TabsTrigger>
                    <TabsTrigger value="individual" className="flex-1">Individual Costs</TabsTrigger>
                </TabsList>

                {/* ====== FIXED COSTS TAB ====== */}
                <TabsContent value="fixed" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                        <Card className="flex-1 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Fixed</p>
                                <p className="text-2xl font-bold mt-1">৳{totalFixed.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        <Button onClick={() => setFixedOpen(true)} className="gap-2 ml-3">
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    </div>

                    {fixedQuery.isLoading ? (
                        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                    ) : !fixedQuery.data?.length ? (
                        <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground text-sm">No fixed costs yet</CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {fixedQuery.data.map((c: Record<string, unknown>) => {
                                const Icon = COST_ICONS[(c.cost_type as string) || 'other'] || DollarSign;
                                return (
                                    <Card key={c.id as string}>
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                                                <div>
                                                    <p className="font-medium text-sm capitalize">{(c.cost_type as string).replace('_', ' ')}</p>
                                                    {c.description ? <p className="text-xs text-muted-foreground">{c.description as string}</p> : null}
                                                </div>
                                            </div>
                                            <span className="font-semibold">৳{Number(c.amount).toLocaleString()}</span>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ====== INDIVIDUAL COSTS TAB ====== */}
                <TabsContent value="individual" className="space-y-4 mt-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setIndOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
                    </div>

                    {indQuery.isLoading ? (
                        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                    ) : !indQuery.data?.length ? (
                        <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground text-sm">No individual costs yet</CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {indQuery.data.map((c: Record<string, unknown>) => (
                                <Card key={c.id as string}>
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{c.description as string}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {((c.member as Record<string, unknown>)?.profile as Record<string, unknown>)?.full_name as string || 'Member'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-xs ${approvalColors[(c.approval_status as string) || 'pending']}`}>
                                                {c.approval_status as string}
                                            </Badge>
                                            <span className="font-semibold text-sm">৳{Number(c.amount).toLocaleString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Fixed Cost Dialog */}
            <Dialog open={fixedOpen} onOpenChange={setFixedOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Fixed Cost</DialogTitle>
                        <DialogDescription>Add a shared cost that will be split equally among all members.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cost Type</Label>
                            <Select value={costType} onValueChange={setCostType}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {COST_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (৳)</Label>
                            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} className="h-11" />
                        </div>
                        <Button className="w-full h-11" onClick={handleAddFixed} disabled={submitting}>
                            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Add Cost'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Individual Cost Dialog */}
            <Dialog open={indOpen} onOpenChange={setIndOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Individual Cost</DialogTitle>
                        <DialogDescription>Add a cost charged to a specific member.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Member</Label>
                            <Select value={indMember} onValueChange={setIndMember}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Select member" /></SelectTrigger>
                                <SelectContent>
                                    {(membersQuery.data || []).map((m: Record<string, unknown>) => (
                                        <SelectItem key={m.id as string} value={m.id as string}>
                                            {(m.profile as Record<string, unknown>)?.full_name as string || 'Unknown'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={indDesc} onChange={e => setIndDesc(e.target.value)} className="h-11" placeholder="e.g. Extra snacks" />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (৳)</Label>
                            <Input type="number" value={indAmount} onChange={e => setIndAmount(e.target.value)} className="h-11" />
                        </div>
                        <Button className="w-full h-11" onClick={handleAddIndividual} disabled={submitting}>
                            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Add Cost'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Export PDF Dialog */}
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileDown className="h-5 w-5" /> Export Cost Report
                        </DialogTitle>
                        <DialogDescription>
                            Generate a PDF report for one or all members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Select Member</Label>
                            <Select value={exportMember} onValueChange={setExportMember}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <span className="flex items-center gap-2">
                                            <Users className="h-4 w-4" /> All Members
                                        </span>
                                    </SelectItem>
                                    {(membersQuery.data || []).map((m: Record<string, unknown>) => (
                                        <SelectItem key={m.id as string} value={m.id as string}>
                                            {(m.profile as Record<string, unknown>)?.full_name as string || 'Unknown'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {cycleMeta && (
                            <div className="rounded-lg border p-3 bg-muted/30 text-sm space-y-1">
                                <p className="font-medium">{cycleMeta.messName}</p>
                                <p className="text-muted-foreground">{cycleMeta.cycleName}</p>
                                <p className="text-muted-foreground text-xs">{cycleMeta.startDate} — {cycleMeta.endDate}</p>
                            </div>
                        )}

                        <Button className="w-full h-11" onClick={handleExport} disabled={exporting}>
                            {exporting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...</>
                            ) : (
                                <><FileDown className="mr-2 h-4 w-4" /> Download PDF</>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
