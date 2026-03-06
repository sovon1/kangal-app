'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trophy } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface MemberMealData {
    name: string;
    meals: number;
}

interface MealComparisonProps {
    cycleId: string;
    messId: string;
}

const RANK_BADGES = ['🥇', '🥈', '🥉'];

const GRADIENT_COLORS = [
    'from-emerald-500 to-green-400',
    'from-blue-500 to-cyan-400',
    'from-violet-500 to-purple-400',
    'from-amber-500 to-orange-400',
    'from-pink-500 to-rose-400',
    'from-teal-500 to-emerald-400',
    'from-indigo-500 to-blue-400',
    'from-red-500 to-orange-400',
];

const AVATAR_COLORS = [
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    'bg-pink-500/15 text-pink-600 dark:text-pink-400',
    'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    'bg-red-500/15 text-red-600 dark:text-red-400',
];

async function fetchMealComparison(cycleId: string, messId: string): Promise<MemberMealData[]> {
    const supabase = getSupabaseBrowserClient();

    const [membersRes, mealsRes] = await Promise.all([
        supabase
            .from('mess_members')
            .select('id, is_manual, manual_name, profile:profiles(full_name)')
            .eq('mess_id', messId)
            .eq('status', 'active'),
        supabase
            .from('daily_meals')
            .select('member_id, breakfast, lunch, dinner, guest_breakfast, guest_lunch, guest_dinner')
            .eq('cycle_id', cycleId),
    ]);

    const members = membersRes.data;
    const meals = mealsRes.data;

    if (!members || members.length === 0) return [];

    const memberMeals: Record<string, number> = {};
    (meals || []).forEach((m) => {
        const id = m.member_id as string;
        const count =
            (m.breakfast ? 1 : 0) +
            (m.lunch ? 1 : 0) +
            (m.dinner ? 1 : 0) +
            ((m.guest_breakfast as number) || 0) +
            ((m.guest_lunch as number) || 0) +
            ((m.guest_dinner as number) || 0);
        memberMeals[id] = (memberMeals[id] || 0) + count;
    });

    const chartData: MemberMealData[] = members.map((member) => {
        const profile = member.profile as unknown as { full_name: string } | null;
        const isManual = Boolean(member.is_manual);
        const name = isManual ? (member.manual_name as string) : (profile?.full_name || 'Unknown');
        return {
            name,
            meals: memberMeals[member.id] || 0,
        };
    });

    chartData.sort((a, b) => b.meals - a.meals);
    return chartData;
}

export function MealComparison({ cycleId, messId }: MealComparisonProps) {
    const { data, isLoading } = useQuery<MemberMealData[]>({
        queryKey: ['meal-comparison', cycleId, messId],
        queryFn: () => fetchMealComparison(cycleId, messId),
        enabled: !!cycleId && !!messId,
        staleTime: 60000,
    });

    if (isLoading) {
        return (
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Member Meal Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Member Meal Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                        No meal data recorded yet this cycle.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxMeals = Math.max(...data.map((d) => d.meals));
    const totalMeals = data.reduce((s, d) => s + d.meals, 0);
    const avgMeals = data.length > 0 ? Math.round(totalMeals / data.length) : 0;

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        😬
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                            <p className="text-xs font-bold">{totalMeals}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] tracking-wider border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold">SN</th>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold text-right">Meals</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.map((stat, i) => (
                                <tr key={stat.name} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-muted-foreground w-12">{i + 1}.</td>
                                    <td className="px-4 py-3 font-semibold">{stat.name}</td>
                                    <td className="px-4 py-3 font-bold text-right text-emerald-600 dark:text-emerald-500 w-20">{stat.meals}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
