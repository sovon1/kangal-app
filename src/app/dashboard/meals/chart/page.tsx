'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAllMealsForMonth } from '@/lib/actions/meals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Settings, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

interface MealCell {
    breakfast: number;
    lunch: number;
    dinner: number;
    guestBreakfast: number;
    guestLunch: number;
    guestDinner: number;
}

export default function MealChartPage() {
    const supabase = getSupabaseBrowserClient();
    const [ctx, setCtx] = useState<{ messId: string; cycleId: string; role: string } | null>(null);

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

    const chartQuery = useQuery({
        queryKey: ['meal-chart-month', ctx?.messId, ctx?.cycleId],
        queryFn: async () => {
            if (!ctx) return null;
            const result = await getAllMealsForMonth(ctx.messId, ctx.cycleId);
            if ('error' in result) return null;
            return result.data;
        },
        enabled: !!ctx,
    });

    const data = chartQuery.data;
    const members = data?.members || [];
    const dates = data?.dates || [];
    const mealsMap = data?.meals || {};

    const getMeal = (date: string, memberId: string): MealCell => {
        return mealsMap[date]?.[memberId] || { breakfast: 0, lunch: 0, dinner: 0, guestBreakfast: 0, guestLunch: 0, guestDinner: 0 };
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    };

    const isToday = (dateStr: string) => dateStr === new Date().toISOString().split('T')[0];

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
                        <h1 className="text-2xl font-bold tracking-tight">Meal Chart</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Scroll to see all dates & members</p>
                    </div>
                </div>
                {isManager && (
                    <Link href="/dashboard/meals/manage">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Settings className="h-3.5 w-3.5" /> Edit Meals
                        </Button>
                    </Link>
                )}
            </div>

            {/* Chart Table */}
            {chartQuery.isLoading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
            ) : !members.length ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No meal data available</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="border border-border/50 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse" style={{ minWidth: `${120 + members.length * 140}px` }}>
                            {/* Header: Date | member1 | member2 | ... */}
                            <thead>
                                <tr className="bg-muted/50 border-b border-border/50">
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[90px]">
                                        Date
                                    </th>
                                    {members.map((m) => (
                                        <th key={m.id} className="text-left px-3 py-3 font-bold text-foreground min-w-[140px]">
                                            {m.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* Body: One row per date */}
                            <tbody>
                                {dates.map((date, idx) => {
                                    const today = isToday(date);
                                    return (
                                        <tr
                                            key={date}
                                            className={`border-b border-border/20 transition-colors ${today ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                } hover:bg-muted/30`}
                                        >
                                            {/* Date cell */}
                                            <td className={`px-4 py-3 font-medium sticky left-0 z-10 ${today ? 'bg-primary/5 text-primary font-bold' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                }`}>
                                                {formatDate(date)}
                                                {today && <span className="ml-1 text-[9px] text-primary">(Today)</span>}
                                            </td>

                                            {/* Member cells */}
                                            {members.map((m) => {
                                                const meal = getMeal(date, m.id);
                                                const b = meal.breakfast + meal.guestBreakfast;
                                                const l = meal.lunch + meal.guestLunch;
                                                const d = meal.dinner + meal.guestDinner;
                                                const total = b + l + d;

                                                return (
                                                    <td key={m.id} className="px-3 py-2.5">
                                                        {total === 0 ? (
                                                            <span className="text-muted-foreground/30 text-[10px]">No meal</span>
                                                        ) : (
                                                            <div className="space-y-0.5 text-[11px] text-muted-foreground">
                                                                <div>Breakfast: <span className="text-foreground font-medium">{b.toFixed(2)}</span></div>
                                                                <div>Lunch: <span className="text-foreground font-medium">{l.toFixed(2)}</span></div>
                                                                <div>Dinner: <span className="text-foreground font-medium">{d.toFixed(2)}</span></div>
                                                                <div className="pt-0.5 border-t border-border/20 font-semibold text-foreground">
                                                                    Total: {total.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer notice */}
            {!isManager && (
                <p className="text-xs text-center text-muted-foreground">
                    📋 This chart is read-only. Only managers can update meal records.
                </p>
            )}
        </div>
    );
}
