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
import { Plus, ArrowRight, TrendingUp, CalendarDays, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { toggleMeal, updateGuestMeal, getTodayMeals } from '@/lib/actions/meals';
import { getDashboardStats, getMemberBalance, getRecentActivity, getAllMemberBalances, getMessOverview } from '@/lib/actions/finance';
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
    const handleMealToggle = useCallback(async (mealType: 'breakfast' | 'lunch' | 'dinner', value: boolean) => {
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
        toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${value ? 'added' : 'removed'}`);
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
        return (
            <div className="space-y-6">
                <div className="text-center py-16">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                        <CalendarDays className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to KANGAL</h1>
                    <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                        Join or create a mess to start tracking meals, expenses, and finances.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button size="lg" className="gap-2" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Create a Mess
                        </Button>
                        <Button variant="outline" size="lg" className="gap-2" onClick={() => setJoinOpen(true)}>
                            <ArrowRight className="h-4 w-4" />
                            Join with Code
                        </Button>
                    </div>
                </div>

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
    const overviewQuery = useQuery({
        queryKey: ['mess-overview', messId, cycleId],
        queryFn: () => getMessOverview(messId, cycleId),
        enabled: !!messId && !!cycleId,
        staleTime: 30000,
    });

    return (
        <MessOverview
            data={overviewQuery.data ?? null}
            loading={overviewQuery.isLoading}
        />
    );
}
