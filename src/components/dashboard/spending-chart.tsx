'use client';

import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface MemberMealData {
    name: string;
    meals: number;
}

interface MealComparisonProps {
    cycleId: string;
    messId: string;
}

const BAR_COLORS = [
    'hsl(142, 76%, 36%)',
    'hsl(199, 89%, 48%)',
    'hsl(262, 83%, 58%)',
    'hsl(24, 95%, 53%)',
    'hsl(340, 82%, 52%)',
    'hsl(47, 96%, 53%)',
    'hsl(173, 80%, 40%)',
    'hsl(291, 64%, 42%)',
];

async function fetchMealComparison(cycleId: string, messId: string): Promise<MemberMealData[]> {
    const supabase = getSupabaseBrowserClient();

    // Parallel fetches for members and meals
    const [membersRes, mealsRes] = await Promise.all([
        supabase
            .from('mess_members')
            .select('id, profile:profiles(full_name)')
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

    // Count meals per member
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

    // Map to chart data
    const chartData: MemberMealData[] = members.map((member) => {
        const profile = member.profile as unknown as { full_name: string } | null;
        const firstName = (profile?.full_name || 'Unknown').split(' ')[0];
        return {
            name: firstName,
            meals: memberMeals[member.id] || 0,
        };
    });

    // Sort by meal count descending
    chartData.sort((a, b) => b.meals - a.meals);
    return chartData;
}

export function MealComparison({ cycleId, messId }: MealComparisonProps) {
    const { data, isLoading } = useQuery<MemberMealData[]>({
        queryKey: ['meal-comparison', cycleId, messId],
        queryFn: () => fetchMealComparison(cycleId, messId),
        enabled: !!cycleId && !!messId,
        staleTime: 60000, // Cache for 60 seconds
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
                <CardContent>
                    <Skeleton className="h-[200px] w-full rounded-lg" />
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
                    <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                        No meal data recorded yet this cycle.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxMeals = Math.max(...data.map((d) => d.meals));
    const totalMeals = data.reduce((s, d) => s + d.meals, 0);

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Member Meal Comparison
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total meals</p>
                        <p className="text-sm font-semibold">{totalMeals}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div style={{ height: Math.max(200, data.length * 44) }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                opacity={0.3}
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, maxMeals + 2]}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                width={70}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                formatter={(value: number | undefined) => [`${value ?? 0} meals`, 'Total']}
                            />
                            <Bar
                                dataKey="meals"
                                radius={[0, 6, 6, 0]}
                                barSize={24}
                            >
                                {data.map((_entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                                        opacity={0.85}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
