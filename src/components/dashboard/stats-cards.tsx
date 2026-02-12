'use client';

import { TrendingUp, TrendingDown, Users, UtensilsCrossed, Wallet, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
    stats: DashboardStats | null;
    balance: number | null;
    loading?: boolean;
}

function formatCurrency(amount: number): string {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface StatCardConfig {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    getValue: (stats: DashboardStats, balance: number | null) => string;
    subtitle: (stats: DashboardStats) => string;
    gradient: string;
    iconColor: string;
    borderColor: string;
    dynamic?: boolean;
}

const statCards: StatCardConfig[] = [
    {
        key: 'mealRate',
        label: 'Meal Rate',
        icon: UtensilsCrossed,
        getValue: (stats) => formatCurrency(stats.currentMealRate),
        subtitle: (stats) => `${stats.daysRemaining}d remaining`,
        gradient: 'from-violet-500/10 to-purple-500/10',
        iconColor: 'text-violet-500',
        borderColor: 'border-violet-500/20',
    },
    {
        key: 'balance',
        label: 'Your Balance',
        icon: Wallet,
        getValue: (_stats, balance) => formatCurrency(balance ?? 0),
        subtitle: () => 'Current cycle',
        gradient: 'from-emerald-500/10 to-green-500/10',
        iconColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/20',
        dynamic: true,
    },
    {
        key: 'members',
        label: 'Active Members',
        icon: Users,
        getValue: (stats) => `${stats.activeMembers}`,
        subtitle: (stats) => `of ${stats.totalMembers} total`,
        gradient: 'from-blue-500/10 to-cyan-500/10',
        iconColor: 'text-blue-500',
        borderColor: 'border-blue-500/20',
    },
    {
        key: 'bazaar',
        label: 'Bazaar Spent',
        icon: ShoppingCart,
        getValue: (stats) => formatCurrency(stats.totalBazaarExpense),
        subtitle: (stats) => `${stats.cycleProgress}% cycle progress`,
        gradient: 'from-amber-500/10 to-orange-500/10',
        iconColor: 'text-amber-500',
        borderColor: 'border-amber-500/20',
    },
];

export function StatsCards({ stats, balance, loading }: StatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-4">
                            <Skeleton className="h-4 w-20 mb-3" />
                            <Skeleton className="h-7 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ key, label, icon: Icon, getValue, subtitle, gradient, iconColor, borderColor, dynamic }) => {
                const value = getValue(stats, balance);
                const isNegative = dynamic && (balance ?? 0) < 0;

                return (
                    <Card
                        key={key}
                        className={`overflow-hidden border ${borderColor} bg-gradient-to-br ${gradient} transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {label}
                                </span>
                                <div className={`p-1.5 rounded-lg bg-background/50 ${iconColor}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-xl font-bold tracking-tight ${isNegative ? 'text-destructive' : ''}`}>
                                    {value}
                                </span>
                                {dynamic && (
                                    (balance ?? 0) >= 0
                                        ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                        : <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {subtitle(stats)}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
