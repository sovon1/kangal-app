'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { AllMemberInfo } from '@/components/dashboard/all-member-info';
import { MessOverview } from '@/components/dashboard/mess-overview';
import { MealToggles } from '@/components/dashboard/meal-toggles';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { MealComparison } from '@/components/dashboard/spending-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, ArrowRight, TrendingUp, CalendarDays, Loader2, Copy, Check, BookOpen, Users, Sparkles, Rocket, ShoppingCart, Wallet, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { toggleMeal, updateGuestMeal, getTodayMeals } from '@/lib/actions/meals';
import { getDashboardStats, getMemberBalance, getRecentActivity, getAllMemberBalances, getMessOverview } from '@/lib/actions/finance';
import { downloadFullMessReport } from '@/lib/pdf-export';
import { KangalLoader } from '@/components/kangal-loader';
import { PullToRefresh } from '@/components/pull-to-refresh';
import { PageTransition } from '@/components/page-transition';
import { createMess, joinMess } from '@/lib/actions/mess';
import { useMessContext } from '@/components/mess-context';
import type { DashboardStats, MealToggleState } from '@/types';

export default function DashboardPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const queryClient = useQueryClient();
    const messCtx = useMessContext();
    const userContext = messCtx;
    const contextLoading = false; // Context is provided instantly by layout

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [joinOpen, setJoinOpen] = useState(false);
    const [messName, setMessName] = useState('');
    const [messAddress, setMessAddress] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Reload context by refreshing the page (layout re-fetches)
    const loadContext = useCallback(async () => {
        router.refresh();
    }, [router]);

    // ============ CREATE MESS HANDLER ============
    const handleCreateMess = async () => {
        if (!messName.trim()) {
            toast.error('Please enter a mess name');
            return;
        }
        setSubmitting(true);
        const result = await createMess({ name: messName.trim(), address: messAddress.trim() || undefined });
        setSubmitting(false);

        if (result.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to create mess');
            return;
        }

        if (result.inviteCode) {
            setCreatedInviteCode(result.inviteCode);
        }

        toast.success('Mess created successfully!');
        // Reload context to get the new membership
        await loadContext();
        queryClient.invalidateQueries();
    };

    // ============ JOIN MESS HANDLER ============
    const handleJoinMess = async () => {
        if (!inviteCode.trim()) {
            toast.error('Please enter an invite code');
            return;
        }
        setSubmitting(true);
        const result = await joinMess({ inviteCode: inviteCode.trim() });
        setSubmitting(false);

        if (result.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to join mess');
            return;
        }

        toast.success(`Joined "${result.messName}" successfully!`);
        setJoinOpen(false);
        setInviteCode('');
        // Reload context
        await loadContext();
        queryClient.invalidateQueries();
        router.refresh();
    };

    const handleCopyCode = async () => {
        if (createdInviteCode) {
            await navigator.clipboard.writeText(createdInviteCode);
            setCopied(true);
            toast.success('Invite code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCloseCreateDialog = () => {
        setCreateOpen(false);
        setMessName('');
        setMessAddress('');
        setCreatedInviteCode(null);
        setCopied(false);
        router.refresh();
    };

    // Dashboard Stats Query
    const statsQuery = useQuery<DashboardStats | null>({
        queryKey: ['dashboard-stats', userContext?.messId, userContext?.cycleId],
        queryFn: async () => {
            if (!userContext) return null;
            return await getDashboardStats(userContext.messId, userContext.cycleId);
        },
        enabled: !!userContext,
        staleTime: 30000,
        refetchInterval: 30000,
    });

    // Member Balance Query
    const balanceQuery = useQuery({
        queryKey: ['member-balance', userContext?.memberId, userContext?.cycleId],
        queryFn: async () => {
            if (!userContext) return null;
            const result = await getMemberBalance(userContext.memberId, userContext.cycleId);
            if ('error' in result) return null;
            return result;
        },
        enabled: !!userContext,
        staleTime: 30000,
        refetchInterval: 30000,
    });

    // Today's Meals Query
    const mealsQuery = useQuery<MealToggleState | null>({
        queryKey: ['today-meals', userContext?.memberId, userContext?.messId],
        queryFn: async () => {
            if (!userContext) return null;
            return await getTodayMeals(userContext.memberId, userContext.messId);
        },
        enabled: !!userContext,
        staleTime: 15000,
    });

    // Recent Activity Query
    const activityQuery = useQuery({
        queryKey: ['recent-activity', userContext?.messId],
        queryFn: async () => {
            if (!userContext) return null;
            const result = await getRecentActivity(userContext.messId);
            if ('error' in result) return null;
            return result.data || null;
        },
        enabled: !!userContext,
        staleTime: 30000,
    });

    // Meal toggle handlers
    const handleMealToggle = useCallback(async (mealType: 'breakfast' | 'lunch' | 'dinner', value: number) => {
        if (!userContext) return;
        const today = new Date().toISOString().split('T')[0];
        const result = await toggleMeal({
            memberId: userContext.memberId,
            cycleId: userContext.cycleId,
            messId: userContext.messId,
            mealDate: today,
            mealType,
            value,
        });
        if (result.error) {
            toast.error(result.error);
            throw new Error(result.error);
        }
        toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} set to ${value}`);
    }, [userContext]);

    const handleGuestUpdate = useCallback(async (mealType: 'breakfast' | 'lunch' | 'dinner', count: number) => {
        if (!userContext) return;
        const today = new Date().toISOString().split('T')[0];
        const result = await updateGuestMeal({
            memberId: userContext.memberId,
            cycleId: userContext.cycleId,
            messId: userContext.messId,
            mealDate: today,
            mealType,
            count,
        });
        if (result.error) {
            toast.error(result.error);
            throw new Error(result.error);
        }
    }, [userContext]);

    // ============ WELCOME STATE (no mess) ============
    if (!userContext && !contextLoading) {
        const manualSteps = [
            { icon: Users, title: 'মেস তৈরি করুন বা জয়েন করুন', subtitle: 'Create or Join a Mess', desc: 'একজন ম্যানেজার মেস তৈরি করবেন এবং তারপর বাকি সবাই কোড দিয়ে জয়েন করবেন।', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Wallet, title: 'টাকা জমা দিন', subtitle: 'Deposit Money', desc: 'প্রতিটি সদস্য তাদের মাসিক ডিপোজিট জমা দেবেন। সব হিসাব অটোমেটিক!', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: ShoppingCart, title: 'বাজার করুন', subtitle: 'Daily Bazaar', desc: 'বাজারের খরচ আইটেম বাই আইটেম এড করুন।', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: CalendarDays, title: 'মিল দিন', subtitle: 'Log Your Meals', desc: 'প্রতিদিন সকাল, দুপুর, রাতের মিল ট্র্যাক করুন।', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { icon: Calculator, title: 'অটো হিসাব', subtitle: 'Auto Calculation', desc: 'মাস শেষে কে কত পাবে, কে কত দেবে — সব অটো! 🎉', color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ];

        return (
            <div className="space-y-8">
                {/* ======== HERO WELCOME SECTION ======== */}
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
                    {/* Decorative background elements */}
                    <div className="absolute top-4 right-8 text-6xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🐐</div>
                    <div className="absolute bottom-4 left-8 text-4xl opacity-10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🍛</div>

                    <div className="px-6 py-12 md:px-12 text-center relative z-10">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-300">
                            <span className="text-4xl">🐐</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                            স্বাগতম <span className="text-primary">KANGAL</span>-এ! 🎉
                        </h1>
                        <p className="text-muted-foreground text-lg mb-2 max-w-lg mx-auto">
                            Make your messy life easier
                        </p>
                        <p className="text-muted-foreground/70 text-sm mb-8 max-w-md mx-auto">
                            শুরু করতে একটি মেসে জয়েন করুন অথবা নতুন মেস তৈরি করুন। আপনার ম্যানেজার ইতিমধ্যে এই অ্যাপ ব্যবহার করলে তার কাছ থেকে ইনভাইট কোড নিন।
                        </p>

                        {/* Create / Join Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border border-border/60 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-base">নতুন মেস তৈরি করুন</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">আপনি ম্যানেজার হলে</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setJoinOpen(true)}
                                className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border border-border/60 bg-card/50 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
                            >
                                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ArrowRight className="h-7 w-7 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-base">মেসে জয়েন করুন</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">ইনভাইট কোড দিয়ে</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ======== USER MANUAL SECTION ======== */}
                <Card className="border-border/50 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-amber-500/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">📖 কিভাবে Kangal ব্যবহার করবেন?</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">৫টি সহজ ধাপে আপনার মেসের সব হিসাব গুছিয়ে ফেলুন</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {manualSteps.map((step, i) => {
                                const StepIcon = step.icon;
                                return (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/40 hover:border-border/80 transition-colors">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}>
                                            <StepIcon className={`h-5 w-5 ${step.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-muted-foreground">ধাপ {i + 1}</span>
                                                <span className="text-xs text-muted-foreground/60">•</span>
                                                <span className="text-xs text-muted-foreground/60">{step.subtitle}</span>
                                            </div>
                                            <p className="font-semibold text-sm">{step.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ======== CREATE MESS DIALOG ======== */}
                <Dialog open={createOpen} onOpenChange={(open) => { if (!open) handleCloseCreateDialog(); else setCreateOpen(true); }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create a New Mess</DialogTitle>
                            <DialogDescription>
                                Set up your mess and invite members with a code.
                            </DialogDescription>
                        </DialogHeader>

                        {createdInviteCode ? (
                            // Success state — show invite code
                            <div className="space-y-4 pt-2">
                                <div className="text-center">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                        <Check className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <p className="font-semibold text-lg">Mess Created!</p>
                                    <p className="text-sm text-muted-foreground mt-1">Share this invite code with your members:</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={createdInviteCode}
                                        readOnly
                                        className="font-mono text-center text-lg tracking-widest h-12"
                                    />
                                    <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={handleCopyCode}>
                                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button className="w-full" onClick={handleCloseCreateDialog}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        ) : (
                            // Form state
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="messName">Mess Name</Label>
                                    <Input
                                        id="messName"
                                        placeholder="e.g. Hall-7 Boys Mess"
                                        value={messName}
                                        onChange={(e) => setMessName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="messAddress">Address (optional)</Label>
                                    <Input
                                        id="messAddress"
                                        placeholder="e.g. Room 301, Hall-7"
                                        value={messAddress}
                                        onChange={(e) => setMessAddress(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <Button
                                    className="w-full h-11"
                                    onClick={handleCreateMess}
                                    disabled={submitting || !messName.trim()}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Mess'
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ======== JOIN MESS DIALOG ======== */}
                <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Join a Mess</DialogTitle>
                            <DialogDescription>
                                Enter the invite code shared by your mess manager.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="inviteCode">Invite Code</Label>
                                <Input
                                    id="inviteCode"
                                    placeholder="e.g. a1b2c3d4"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="h-11 font-mono text-center text-lg tracking-widest"
                                />
                            </div>
                            <Button
                                className="w-full h-11"
                                onClick={handleJoinMess}
                                disabled={submitting || !inviteCode.trim()}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    'Join Mess'
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ============ LOADING STATE ============
    if (contextLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    // ============ MAIN DASHBOARD ============
    return (
        <PullToRefresh>
            <PageTransition>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                Overview of your mess finances and meals
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-xs">
                                <TrendingUp className="h-3 w-3" />
                                Live
                            </Badge>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <StatsCards
                        balance={balanceQuery.data ?? null}
                        loading={balanceQuery.isLoading}
                    />

                    {/* Mess Overview + Balance Breakdown (Two Column) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Mess Details */}
                        {userContext && (
                            <MessOverviewSection messId={userContext.messId} cycleId={userContext.cycleId} />
                        )}

                        {/* Right: My Balance Breakdown */}
                        <Card className="border-border/50 h-full">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">My Balance Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {balanceQuery.isLoading ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-4 w-full" />
                                        ))}
                                    </div>
                                ) : balanceQuery.data ? (
                                    <div className="space-y-2.5">
                                        <BalanceRow label="Opening Balance" amount={balanceQuery.data.openingBalance} />
                                        <BalanceRow label="Deposits" amount={balanceQuery.data.totalDeposits} positive />
                                        <div className="border-t border-border/50" />
                                        <BalanceRow label={`Meals (${balanceQuery.data.totalMeals}×)`} amount={-balanceQuery.data.mealCost} />
                                        <BalanceRow label="Fixed Costs" amount={-balanceQuery.data.fixedCostShare} />
                                        <BalanceRow label="Individual Costs" amount={-balanceQuery.data.individualCostTotal} />
                                        <div className="border-t border-border/50 pt-1" />
                                        <div className="flex items-center justify-between font-bold">
                                            <span className="text-sm">Current Balance</span>
                                            <span className={`text-base ${balanceQuery.data.currentBalance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                                ৳{balanceQuery.data.currentBalance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Meal Toggles — Takes 2 columns on desktop */}
                        <div className="lg:col-span-2">
                            <MealToggles
                                meals={mealsQuery.data ?? null}
                                memberId={userContext?.memberId ?? ''}
                                cycleId={userContext?.cycleId ?? ''}
                                messId={userContext?.messId ?? ''}
                                loading={mealsQuery.isLoading}
                                onToggle={handleMealToggle}
                                onGuestUpdate={handleGuestUpdate}
                            />
                        </div>

                        {/* Right Column: Recent Activity */}
                        <div className="space-y-6">
                            <RecentActivity
                                activities={activityQuery.data ?? null}
                                loading={activityQuery.isLoading}
                            />
                        </div>
                    </div>

                    {/* All Member Info */}
                    {userContext && (
                        <AllMemberInfoSection messId={userContext.messId} cycleId={userContext.cycleId} />
                    )}

                    {/* Member Meal Comparison — at the bottom */}
                    {userContext && (
                        <MealComparison cycleId={userContext.cycleId} messId={userContext.messId} />
                    )}
                </div>
            </PageTransition>
        </PullToRefresh>
    );
}

// Helper component for balance rows
function BalanceRow({ label, amount, positive }: { label: string; amount: number; positive?: boolean }) {
    const isNeg = amount < 0;
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={isNeg ? 'text-destructive' : positive ? 'text-emerald-500' : ''}>
                {isNeg ? '-' : positive ? '+' : ''}৳{Math.abs(amount).toLocaleString()}
            </span>
        </div>
    );
}

// All Member Info section with its own query
function AllMemberInfoSection({ messId, cycleId }: { messId: string; cycleId: string }) {
    const allBalancesQuery = useQuery({
        queryKey: ['all-member-balances', messId, cycleId],
        queryFn: async () => {
            const result = await getAllMemberBalances(messId, cycleId);
            if ('error' in result) return null;
            return result.data;
        },
        enabled: !!messId && !!cycleId,
        staleTime: 30000,
    });

    const members = allBalancesQuery.data
        ? (allBalancesQuery.data.filter((m): m is NonNullable<typeof m> => m !== null))
        : null;

    return (
        <AllMemberInfo
            members={members}
            loading={allBalancesQuery.isLoading}
        />
    );
}


// Mess Overview section with its own query
function MessOverviewSection({ messId, cycleId }: { messId: string; cycleId: string }) {
    const supabase = getSupabaseBrowserClient();
    const [exporting, setExporting] = useState(false);

    const overviewQuery = useQuery({
        queryKey: ['mess-overview', messId, cycleId],
        queryFn: () => getMessOverview(messId, cycleId),
        enabled: !!messId && !!cycleId,
        staleTime: 30000,
    });

    const handleExportPDF = async () => {
        if (!messId || !cycleId) return;
        setExporting(true);
        try {
            await downloadFullMessReport(messId, cycleId, supabase);
            toast.success('PDF report downloaded!');
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to generate PDF');
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            {exporting && (
                <KangalLoader
                    fullScreen
                    text="Cooking your PDF report"
                    subtext="Preparing the delicious data for you"
                />
            )}
            <div className="space-y-4">
                <MessOverview
                    data={overviewQuery.data || null}
                    loading={overviewQuery.isLoading}
                    onExport={handleExportPDF}
                    exporting={exporting}
                />
            </div>
        </>
    );
}
