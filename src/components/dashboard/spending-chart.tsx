'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface DailySpending {
    date: string;
    label: string;
    amount: number;
}

interface SpendingChartProps {
    cycleId: string;
    messId: string;
}

export function SpendingChart({ cycleId, messId }: SpendingChartProps) {
    const supabase = getSupabaseBrowserClient();
    const [data, setData] = useState<DailySpending[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            // Fetch bazaar expenses for this cycle, grouped by date
            const { data: expenses } = await supabase
                .from('bazaar_expenses')
                .select('expense_date, total_cost')
                .eq('cycle_id', cycleId)
                .order('expense_date', { ascending: true });

            if (!expenses || expenses.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            // Group by date and sum total_cost
            const grouped: Record<string, number> = {};
            expenses.forEach((exp) => {
                const date = exp.expense_date;
                grouped[date] = (grouped[date] || 0) + (exp.total_cost || 0);
            });

            // Convert to chart data with short date labels
            const chartData: DailySpending[] = Object.entries(grouped).map(([date, amount]) => {
                const d = new Date(date + 'T00:00:00');
                return {
                    date,
                    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    amount: Math.round(amount),
                };
            });

            setData(chartData);
            setLoading(false);
        }

        if (cycleId && messId) {
            fetchData();
        }
    }, [cycleId, messId, supabase]);

    if (loading) {
        return (
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Bazaar Spending Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Bazaar Spending Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                        No bazaar expenses recorded yet this cycle.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalSpent = data.reduce((sum, d) => sum + d.amount, 0);
    const avgDaily = Math.round(totalSpent / data.length);

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Bazaar Spending Trend
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Avg/day</p>
                        <p className="text-sm font-semibold">৳{avgDaily.toLocaleString()}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                opacity={0.3}
                            />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `৳${v}`}
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
                                formatter={(value: number | undefined) => [`৳${(value ?? 0).toLocaleString()}`, 'Spent']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="hsl(142, 76%, 36%)"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorSpending)"
                                dot={{ r: 3, fill: 'hsl(142, 76%, 36%)', strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: 'hsl(142, 76%, 36%)', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
