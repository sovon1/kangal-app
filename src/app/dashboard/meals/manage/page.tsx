'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAllMealsForDate, managerBulkUpdateMeals } from '@/lib/actions/meals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CalendarDays, Loader2, Save, Users, User, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface MemberMeal {
    memberId: string;
    name: string;
    avatarUrl: string | null;
    breakfast: number;
    lunch: number;
    dinner: number;
    guestBreakfast: number;
    guestLunch: number;
    guestDinner: number;
}

export default function ManageMealsPage() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const [ctx, setCtx] = useState<{ messId: string; cycleId: string; role: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealData, setMealData] = useState<Record<string, { breakfast: number; lunch: number; dinner: number }>>({});
    const [submitting, setSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: m } = await supabase.from('mess_members').select('id, mess_id, role').eq('user_id', user.id).eq('status', 'active').limit(1).single();
            if (!m) return;
            const { data: c } = await supabase.from('mess_cycles').select('id').eq('mess_id', m.mess_id).eq('status', 'open').limit(1).single();
            if (!c) return;
            setCtx({ messId: m.mess_id, cycleId: c.id, role: m.role });
        }
        load();
    }, [supabase]);

    const isManager = ctx?.role === 'manager';

    const mealsQuery = useQuery({
        queryKey: ['manage-meals', ctx?.messId, ctx?.cycleId, selectedDate],
        queryFn: async () => {
            if (!ctx) return null;
            const result = await getAllMealsForDate(ctx.messId, ctx.cycleId, selectedDate);
            if ('error' in result) return null;
            return result.data;
        },
        enabled: !!ctx && isManager,
    });

    // Initialize meal data when query results come in  
    useEffect(() => {
        if (mealsQuery.data) {
            const initial: Record<string, { breakfast: number; lunch: number; dinner: number }> = {};
            mealsQuery.data.forEach((m: MemberMeal) => {
                initial[m.memberId] = {
                    breakfast: m.breakfast + m.guestBreakfast,
                    lunch: m.lunch + m.guestLunch,
                    dinner: m.dinner + m.guestDinner,
                };
            });
            setMealData(initial);
            setHasChanges(false);
        }
    }, [mealsQuery.data]);

    const updateMeal = useCallback((memberId: string, field: 'breakfast' | 'lunch' | 'dinner', value: number) => {
        setMealData(prev => ({
            ...prev,
            [memberId]: {
                ...prev[memberId],
                [field]: Math.max(0, value),
            },
        }));
        setHasChanges(true);
    }, []);

    const handleSubmit = async () => {
        if (!ctx || !mealsQuery.data) return;

        setSubmitting(true);
        const updates = mealsQuery.data.map((m: MemberMeal) => ({
            memberId: m.memberId,
            breakfast: mealData[m.memberId]?.breakfast ?? 0,
            lunch: mealData[m.memberId]?.lunch ?? 0,
            dinner: mealData[m.memberId]?.dinner ?? 0,
        }));

        const result = await managerBulkUpdateMeals(ctx.messId, ctx.cycleId, selectedDate, updates);
        setSubmitting(false);

        if (result.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to update');
            return;
        }

        toast.success('Meals updated successfully!');
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: ['manage-meals'] });
        queryClient.invalidateQueries({ queryKey: ['member-balance'] });
        queryClient.invalidateQueries({ queryKey: ['all-member-balances'] });
    };

    if (!isManager && ctx) {
        return (
            <div className="text-center py-16">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <h2 className="text-lg font-semibold">Manager Access Only</h2>
                <p className="text-sm text-muted-foreground mt-1">Only managers can edit meals for all members.</p>
                <Link href="/dashboard/meals">
                    <Button variant="outline" className="mt-4 gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Meals
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/meals">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manage Meals</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Edit meals for all members (bypass cutoff)</p>
                    </div>
                </div>
                <Badge variant="outline" className="gap-1 text-xs">
                    <Users className="h-3 w-3" /> Manager
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all" className="gap-2"><Users className="h-3.5 w-3.5" /> For All Members</TabsTrigger>
                    <TabsTrigger value="single" className="gap-2"><User className="h-3.5 w-3.5" /> For Single Member</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4 space-y-4">
                    {/* Date Picker */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Select Date</label>
                        <div className="relative">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-11 text-base"
                            />
                        </div>
                    </div>

                    {/* Members Grid */}
                    {mealsQuery.isLoading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                        </div>
                    ) : !mealsQuery.data?.length ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p className="font-medium">No members found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {mealsQuery.data.map((member: MemberMeal) => {
                                    const meals = mealData[member.memberId] || { breakfast: 0, lunch: 0, dinner: 0 };
                                    const total = meals.breakfast + meals.lunch + meals.dinner;

                                    return (
                                        <Card key={member.memberId} className="hover:shadow-sm transition-shadow">
                                            <CardContent className="p-4">
                                                {/* Member Header */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-sm">{member.name}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        Total: <span className="font-bold text-foreground">{total}</span>
                                                    </span>
                                                </div>

                                                {/* Meal Inputs */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                                                        <div key={meal}>
                                                            <label className="text-xs text-muted-foreground mb-1 block">{meal}</label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={meals[meal]}
                                                                onChange={(e) => updateMeal(member.memberId, meal, parseInt(e.target.value) || 0)}
                                                                className="h-10 text-center text-base font-medium"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="w-full h-12 text-base gap-2 bg-gradient-to-r from-primary to-primary/80"
                                onClick={handleSubmit}
                                disabled={submitting || !hasChanges}
                            >
                                {submitting ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="h-5 w-5" /> Submit</>
                                )}
                            </Button>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="single" className="mt-4">
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">Coming soon</p>
                            <p className="text-sm mt-1">Edit meals for a single member with full flexibility</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
