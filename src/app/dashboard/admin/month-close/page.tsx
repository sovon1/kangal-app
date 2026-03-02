'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { closeMonth } from '@/lib/actions/finance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, AlertTriangle, Lock, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMessContext } from '@/components/mess-context';

export default function MonthClosePage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const messCtx = useMessContext();
    const [cycleName, setCycleName] = useState('');
    const [stats, setStats] = useState<{ members: number; meals: number; bazaar: number; deposits: number } | null>(null);
    const [closing, setClosing] = useState(false);
    const [closed, setClosed] = useState(false);
    const [loading, setLoading] = useState(true);

    const ctx = messCtx ? { cycleId: messCtx.cycleId, cycleName, messId: messCtx.messId } : null;

    useEffect(() => {
        if (!messCtx) { setLoading(false); return; }
        async function load() {
            // Only fetch cycle name + stats (context provides messId/cycleId)
            const { data: c } = await supabase.from('mess_cycles').select('name').eq('id', messCtx!.cycleId).single();
            if (c) setCycleName(c.name);

            // Get summary stats
            const [membersRes, mealsRes, bazaarRes, depositsRes] = await Promise.all([
                supabase.from('mess_members').select('id', { count: 'exact' }).eq('mess_id', messCtx!.messId).eq('status', 'active'),
                supabase.from('daily_meals').select('id', { count: 'exact' }).eq('cycle_id', messCtx!.cycleId),
                supabase.from('bazaar_expenses').select('total_amount').eq('cycle_id', messCtx!.cycleId).eq('approval_status', 'approved'),
                supabase.from('transactions').select('amount').eq('cycle_id', messCtx!.cycleId).eq('approval_status', 'approved'),
            ]);

            setStats({
                members: membersRes.count || 0,
                meals: mealsRes.count || 0,
                bazaar: (bazaarRes.data || []).reduce((s, e) => s + Number(e.total_amount), 0),
                deposits: (depositsRes.data || []).reduce((s, d) => s + Number(d.amount), 0),
            });
            setLoading(false);
        }
        load();
    }, [supabase, messCtx?.cycleId, messCtx?.messId]);

    const handleClose = async () => {
        if (!ctx) return;
        const confirmed = window.confirm(
            `Are you sure you want to close "${ctx.cycleName}"?\n\nThis will:\n• Lock the final meal rate\n• Snapshot all member balances\n• Create the next month's cycle\n\nThis action cannot be undone.`
        );
        if (!confirmed) return;

        setClosing(true);
        const result = await closeMonth(ctx.cycleId);
        setClosing(false);

        if ('error' in result) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to close month');
            return;
        }

        setClosed(true);
        toast.success('Month closed successfully!');
        router.refresh(); // Force layout to re-fetch with new open cycle
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
        );
    }

    if (closed) {
        return (
            <div className="space-y-6">
                <div className="text-center py-16">
                    <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Month Closed!</h1>
                    <p className="text-muted-foreground text-lg mb-6">
                        All balances have been snapshotted and a new cycle has been created.
                    </p>
                    <Button onClick={() => { router.push('/dashboard'); router.refresh(); }} className="gap-2">
                        <ArrowRight className="h-4 w-4" /> Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Close Month</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Finalize the current cycle and start a new one</p>
            </div>

            {ctx && (
                <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-orange-500" />
                                    {ctx.cycleName}
                                </CardTitle>
                                <CardDescription>Current open cycle</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-orange-500 border-orange-500/30">Open</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="p-3 rounded-lg bg-background/80">
                                    <p className="text-xs text-muted-foreground">Members</p>
                                    <p className="text-lg font-bold">{stats.members}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-background/80">
                                    <p className="text-xs text-muted-foreground">Meal Records</p>
                                    <p className="text-lg font-bold">{stats.meals}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-background/80">
                                    <p className="text-xs text-muted-foreground">Total Bazaar</p>
                                    <p className="text-lg font-bold">৳{stats.bazaar.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-background/80">
                                    <p className="text-xs text-muted-foreground">Total Deposits</p>
                                    <p className="text-lg font-bold">৳{stats.deposits.toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Irreversible Action</AlertTitle>
                            <AlertDescription>
                                Closing the month will lock the meal rate, snapshot all member balances, and archive this cycle. A new cycle will be created automatically.
                            </AlertDescription>
                        </Alert>

                        <Button
                            variant="destructive"
                            className="w-full h-11 gap-2"
                            onClick={handleClose}
                            disabled={closing}
                        >
                            {closing ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Closing Month...</>
                            ) : (
                                <><Lock className="h-4 w-4" /> Close {ctx.cycleName}</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
