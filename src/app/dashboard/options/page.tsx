'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAllMonths, renameCycle, deleteMess, resetMess } from '@/lib/actions/options';
import { closeMonth, getMemberBalance } from '@/lib/actions/finance';
import { exportAllMembersPDF } from '@/lib/pdf-export';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CalendarSearch,
    Trash2,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Pencil,
    X,
    Check,
    Lock,
    BarChart3,
    FileDown,
    ArrowRight,
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMessContext } from '@/components/mess-context';

export default function OptionsPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const messCtx = useMessContext();

    // Derived from context
    const role = messCtx?.role || null;
    const messId = messCtx?.messId || null;
    const activeCycleId = messCtx?.cycleId || null;
    const [loading, setLoading] = useState(!messCtx);

    // Data State
    const [months, setMonths] = useState<{ id: string; name: string; status: string }[]>([]);
    const [messName, setMessName] = useState('');
    const [cycleName, setCycleName] = useState('');

    // Delete Mess States
    const [deleteMessName, setDeleteMessName] = useState('');

    // Editing State
    const [editingCycle, setEditingCycle] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Close Month Dialog
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [closeStats, setCloseStats] = useState<{ members: number; meals: number; bazaar: number; deposits: number } | null>(null);
    const [closing, setClosing] = useState(false);
    const [closed, setClosed] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Reset Mess Dialog
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [submittingReset, setSubmittingReset] = useState(false);

    // Loading States
    const [submittingDelete, setSubmittingDelete] = useState(false);
    const [refreshingMonths, setRefreshingMonths] = useState(false);

    useEffect(() => {
        if (!messCtx) return;
        async function loadExtra() {
            // Fetch mess name for delete confirmation
            const [messRes, cycleRes] = await Promise.all([
                supabase.from('messes').select('name').eq('id', messCtx!.messId).single(),
                supabase.from('mess_cycles').select('name').eq('id', messCtx!.cycleId).single(),
            ]);
            if (messRes.data) setMessName(messRes.data.name || '');
            if (cycleRes.data) setCycleName(cycleRes.data.name || '');

            // Load months
            loadMonths(messCtx!.messId);
            setLoading(false);
        }
        loadExtra();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messCtx?.messId, messCtx?.cycleId]);

    async function loadMonths(mId: string) {
        setRefreshingMonths(true);
        const result = await getAllMonths(mId);
        if (result.data) {
            setMonths(result.data);
        }
        setRefreshingMonths(false);
    }

    // ====================== CLOSE MONTH ======================
    async function openCloseDialog() {
        if (!messId || !activeCycleId) return;
        setCloseDialogOpen(true);
        setClosed(false);

        // Fetch summary stats
        const [membersRes, mealsRes, bazaarRes, depositsRes] = await Promise.all([
            supabase.from('mess_members').select('id', { count: 'exact' }).eq('mess_id', messId).eq('status', 'active'),
            supabase.from('daily_meals').select('id', { count: 'exact' }).eq('cycle_id', activeCycleId),
            supabase.from('bazaar_expenses').select('total_amount').eq('cycle_id', activeCycleId).eq('approval_status', 'approved'),
            supabase.from('transactions').select('amount').eq('cycle_id', activeCycleId).eq('approval_status', 'approved'),
        ]);

        setCloseStats({
            members: membersRes.count || 0,
            meals: mealsRes.count || 0,
            bazaar: (bazaarRes.data || []).reduce((s, e) => s + Number(e.total_amount), 0),
            deposits: (depositsRes.data || []).reduce((s, d) => s + Number(d.amount), 0),
        });
    }

    async function handleExportPDF() {
        if (!messId || !activeCycleId) return;
        setExporting(true);
        try {
            // Fetch all data needed for PDF
            const [membersRes, cycleRes, messRes, fixedRes] = await Promise.all([
                supabase.from('mess_members').select('id, role, profile:profiles(full_name)').eq('mess_id', messId).eq('status', 'active'),
                supabase.from('mess_cycles').select('name, start_date, end_date').eq('id', activeCycleId).single(),
                supabase.from('messes').select('name').eq('id', messId).single(),
                supabase.from('fixed_costs').select('*').eq('cycle_id', activeCycleId),
            ]);

            const members = membersRes.data || [];
            const cycleMeta = {
                messName: messRes.data?.name || 'Mess',
                cycleName: cycleRes.data?.name || 'Cycle',
                startDate: new Date(cycleRes.data?.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                endDate: new Date(cycleRes.data?.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            };

            // Get balances for all members
            const memberData = await Promise.all(
                members.map(async (m) => {
                    const balance = await getMemberBalance(m.id, activeCycleId);
                    const profile = m.profile as unknown as { full_name: string };

                    const { data: bazaarData } = await supabase
                        .from('bazaar_expenses')
                        .select('total_amount')
                        .eq('cycle_id', activeCycleId)
                        .eq('shopper_id', m.id);

                    const bazaarSpent = (bazaarData || []).reduce((s, e) => s + Number(e.total_amount), 0);
                    const bal = balance as Record<string, unknown>;

                    return {
                        memberName: profile?.full_name || 'Unknown',
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

            const fixedCostsData = (fixedRes.data || []).map((c: Record<string, unknown>) => ({
                type: (c.cost_type as string) || 'other',
                amount: Number(c.amount),
            }));

            const { data: allDeposits } = await supabase.from('transactions').select('amount').eq('cycle_id', activeCycleId);
            const { data: allBazaar } = await supabase.from('bazaar_expenses').select('total_amount').eq('cycle_id', activeCycleId);

            exportAllMembersPDF(
                memberData,
                cycleMeta,
                fixedCostsData,
                (allBazaar || []).reduce((s, e) => s + Number(e.total_amount), 0),
                (allDeposits || []).reduce((s, d) => s + Number(d.amount), 0)
            );

            toast.success('PDF report downloaded!');
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to generate PDF');
        } finally {
            setExporting(false);
        }
    }

    async function handleCloseMonth() {
        if (!activeCycleId) return;

        const confirmed = window.confirm(
            `Are you sure you want to close "${cycleName}"?\n\nThis will:\n• Lock the final meal rate\n• Snapshot all member balances\n• Create the next month's cycle\n\nThis action cannot be undone.`
        );
        if (!confirmed) return;

        setClosing(true);
        const result = await closeMonth(activeCycleId);
        setClosing(false);

        if ('error' in result) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to close month');
            return;
        }

        setClosed(true);
        toast.success('Month closed successfully!');
        router.refresh();
    }

    // ====================== RENAME CYCLE ======================
    async function handleRenameCycle(cycleId: string) {
        if (!editName.trim()) return;

        const result = await renameCycle(cycleId, editName);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Month renamed successfully");
            setEditingCycle(null);
            loadMonths(messId!);
        }
    }

    // ====================== DELETE MESS ======================
    async function handleDeleteMess(e: React.FormEvent) {
        e.preventDefault();
        if (!messId) return;

        if (role === 'manager' && deleteMessName !== messName) {
            toast.error("Mess name does not match. Please type the exact mess name to confirm.");
            return;
        }

        const confirmText = role === 'manager'
            ? "Permanent Delete: Are you absolutely sure?"
            : "Request Delete: Are you sure you want to request this?";

        if (!window.confirm(confirmText)) return;

        setSubmittingDelete(true);
        const result = await deleteMess(messId);
        setSubmittingDelete(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            if (role === 'manager') {
                toast.success("Mess deleted. Redirecting...");
                router.push('/');
            } else {
                toast.success(result.message);
            }
        }
    }

    // ====================== RESET MESS ======================
    async function handleResetMess(e: React.FormEvent) {
        e.preventDefault();
        if (!messId) return;

        if (resetConfirmText !== 'RESET MY MESS') {
            toast.error("Please type exactly RESET MY MESS to confirm.");
            return;
        }

        setSubmittingReset(true);
        const result = await resetMess(messId);
        setSubmittingReset(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Mess has been reset successfully!");
            setResetDialogOpen(false);
            router.push('/dashboard');
            router.refresh();
        }
    }

    if (loading) {
        return <div className="p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        </div>;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Options</h1>
                <p className="text-muted-foreground text-sm">Manage mess cycles and settings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* 1. CLOSE MONTH */}
                <Card className="border-border/50 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-2">
                            <BarChart3 className="h-6 w-6 text-orange-500" />
                        </div>
                        <CardTitle className="text-xl font-bold">Close Month</CardTitle>
                        <CardDescription>Finalize current cycle and start a new one</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cycleName && (
                            <div className="text-center">
                                <Badge variant="outline" className="text-orange-500 border-orange-500/30 gap-1">
                                    <Lock className="h-3 w-3" />
                                    Active: {cycleName}
                                </Badge>
                            </div>
                        )}

                        <div className="text-center text-sm text-muted-foreground">
                            (মাস বন্ধ করার পর, এই মাসের হিসাব লক হয়ে যাবে এবং নতুন মাস শুরু হবে। ⚠ সাবধান — এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না)
                        </div>

                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 gap-2"
                            onClick={openCloseDialog}
                            disabled={!activeCycleId || role !== 'manager'}
                        >
                            <Lock className="h-4 w-4" />
                            {role === 'manager' ? 'Close This Month' : 'Only Manager Can Close'}
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. RESET MESS */}
                <Card className="border-border/50 border-red-500/20 bg-red-500/5">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
                            <RotateCcw className="h-6 w-6 text-red-500" />
                        </div>
                        <CardTitle className="text-xl font-bold text-red-500">Reset Mess</CardTitle>
                        <CardDescription className="text-red-500/80">Wipe all balances & history</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-muted-foreground">
                            (মেস রিসেট করলে সকল মাসের হিসাব জিরো (0) হয়ে যাবে এবং নতুন মাস শুরু হবে, মেম্বাররা থাকবে। ⚠ সাবধান — অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না)
                        </div>

                        <Button
                            className="w-full bg-red-500 hover:bg-red-600 text-white h-11 gap-2 mt-auto"
                            onClick={() => { setResetDialogOpen(true); setResetConfirmText(''); }}
                            disabled={role !== 'manager'}
                        >
                            <RotateCcw className="h-4 w-4" />
                            {role === 'manager' ? 'Reset Mess to 0' : 'Only Manager'}
                        </Button>
                    </CardContent>
                </Card>

                {/* 3. DELETE MESS */}
                <Card className="border-border/50">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
                            <Trash2 className="h-6 w-6 text-red-500" />
                        </div>
                        <CardTitle className="text-xl font-bold text-red-500">Delete Mess</CardTitle>
                        <CardDescription>Delete your current mess permanently</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex flex-col justify-between h-[calc(100%-80px)]">
                        <div className="text-center text-xs text-muted-foreground px-2">
                            (মেস ডিলিট করলে সকল হিসাব এবং সকল মেম্বার চিরতরে রিমুভ হয়ে যাবে, এই অ্যাকশন আর কোনদিন পূর্বাবস্থায় ফেরানো যাবে না)
                        </div>

                        <form onSubmit={handleDeleteMess} className="space-y-4 mt-auto">
                            {role === 'manager' && (
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="deleteMessName" className="text-xs">Type <span className="font-bold">{messName}</span> to Confirm:</Label>
                                    <Input
                                        id="deleteMessName"
                                        placeholder={messName}
                                        value={deleteMessName}
                                        onChange={(e) => setDeleteMessName(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                            )}
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                                disabled={submittingDelete || (role === 'manager' && deleteMessName !== messName)}
                            >
                                {submittingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {role === 'manager' ? 'Delete Mess' : 'Request Delete'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* 4. ALL MONTH LIST (Full width) */}
                <Card className="border-border/50 md:col-span-2 lg:col-span-3">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                            <CalendarSearch className="h-5 w-5 text-primary" />
                            Mess Month List
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {refreshingMonths ? (
                            <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                        ) : months.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No months found</div>
                        ) : (
                            months.map((month) => (
                                <div key={month.id} className="flex items-center justify-between p-4 bg-card border rounded-xl hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                                            <CalendarSearch className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            {editingCycle === month.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 w-48"
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleRenameCycle(month.id)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingCycle(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <h3 className="font-semibold">{month.name}</h3>
                                            )}

                                            {month.status === 'open' ? (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-white text-xs px-2 py-0 h-5">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground border-border text-xs px-2 py-0 h-5">Closed</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {role === 'manager' && editingCycle !== month.id && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setEditingCycle(month.id);
                                                setEditName(month.name);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* ======== CLOSE MONTH DIALOG ======== */}
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-orange-500" />
                            {closed ? 'Month Closed!' : `Close "${cycleName}"`}
                        </DialogTitle>
                        <DialogDescription>
                            {closed
                                ? 'All balances have been snapshotted and a new cycle has been created.'
                                : 'Review the summary and download the PDF report before closing.'}
                        </DialogDescription>
                    </DialogHeader>

                    {closed ? (
                        /* ── Success State ── */
                        <div className="space-y-4 pt-2">
                            <div className="text-center py-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    You can download the PDF report of the closed month below.
                                </p>
                            </div>
                            <Button variant="outline" className="w-full gap-2" onClick={handleExportPDF} disabled={exporting}>
                                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                                {exporting ? 'Generating PDF...' : 'Download Month Report (PDF)'}
                            </Button>
                            <Button className="w-full gap-2" onClick={() => { setCloseDialogOpen(false); router.push('/dashboard'); router.refresh(); }}>
                                <ArrowRight className="h-4 w-4" /> Go to Dashboard
                            </Button>
                        </div>
                    ) : (
                        /* ── Pre-Close State ── */
                        <div className="space-y-4 pt-2">
                            {/* Summary Stats */}
                            {closeStats ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="text-xs text-muted-foreground">Members</p>
                                        <p className="text-lg font-bold">{closeStats.members}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="text-xs text-muted-foreground">Meal Records</p>
                                        <p className="text-lg font-bold">{closeStats.meals}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="text-xs text-muted-foreground">Total Bazaar</p>
                                        <p className="text-lg font-bold">৳{closeStats.bazaar.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="text-xs text-muted-foreground">Total Deposits</p>
                                        <p className="text-lg font-bold">৳{closeStats.deposits.toLocaleString()}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                                </div>
                            )}

                            {/* Warning */}
                            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-lg border border-orange-200 dark:border-orange-500/20 text-xs text-orange-700 dark:text-orange-400 flex items-start gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <div>
                                    This will <strong>lock the meal rate</strong>, snapshot all member balances, and archive this cycle. A new cycle will be created automatically. <strong>This action cannot be undone.</strong>
                                </div>
                            </div>

                            {/* Download PDF FIRST */}
                            <Button variant="outline" className="w-full gap-2 h-11" onClick={handleExportPDF} disabled={exporting}>
                                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                                {exporting ? 'Generating PDF...' : 'Download Month Report (PDF)'}
                            </Button>

                            {/* Close Month Button */}
                            <Button
                                variant="destructive"
                                className="w-full h-11 gap-2"
                                onClick={handleCloseMonth}
                                disabled={closing}
                            >
                                {closing ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Closing Month...</>
                                ) : (
                                    <><Lock className="h-4 w-4" /> Confirm Close Month</>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ======== RESET MESS DIALOG ======== */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            Reset Entire Mess
                        </DialogTitle>
                        <DialogDescription>
                            This is a destructive action that will wipe all records.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {/* Warning */}
                        <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <div>
                                <strong>Warning:</strong> This will delete ALL months, meals, deposits, and costs. Members will remain in the mess, but all balances will become 0. A fresh cycle will start today. <strong>This cannot be undone.</strong>
                            </div>
                        </div>

                        {/* Download PDF FIRST */}
                        <Button variant="outline" className="w-full gap-2 h-11 mb-2" onClick={handleExportPDF} disabled={exporting}>
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            {exporting ? 'Generating PDF...' : 'Download Final Backup (PDF)'}
                        </Button>

                        <form onSubmit={handleResetMess} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="resetConfirmText">Type <span className="font-bold select-none text-foreground">RESET MY MESS</span> to confirm:</Label>
                                <Input
                                    id="resetConfirmText"
                                    placeholder="RESET MY MESS"
                                    value={resetConfirmText}
                                    onChange={(e) => setResetConfirmText(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="w-full h-11 gap-2"
                                disabled={submittingReset || resetConfirmText !== 'RESET MY MESS'}
                            >
                                {submittingReset ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</>
                                ) : (
                                    <><Trash2 className="h-4 w-4" /> Permanently Reset Mess</>
                                )}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
