'use client';

import { TrendingUp, TrendingDown, UtensilsCrossed, Wallet, ShoppingCart, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberBalance {
    totalMeals: number;
    totalDeposits: number;
    mealCost: number;
    fixedCostShare: number;
    individualCostTotal: number;
    currentBalance: number;
}

interface StatsCardsProps {
    balance: MemberBalance | null;
    loading?: boolean;
}

function formatCurrency(amount: number): string {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function StatsCards({ balance, loading }: StatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-4">
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!balance) return null;

    const totalCost = balance.mealCost + balance.fixedCostShare + balance.individualCostTotal;
    const isNegativeBalance = balance.currentBalance < 0;
    const isNegativeDeposit = balance.totalDeposits < 0;

    const cards = [
        {
            label: 'My Total Meals',
            value: balance.totalMeals.toString(),
            icon: UtensilsCrossed,
            bgClass: 'bg-gradient-to-br from-emerald-500/15 to-green-500/10 border-emerald-500/20',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-500',
            valueColor: '',
        },
        {
            label: 'My Deposit',
            value: `${balance.totalDeposits < 0 ? '-' : ''}${formatCurrency(Math.abs(balance.totalDeposits))}`,
            icon: Wallet,
            bgClass: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border-blue-500/20',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-500',
            valueColor: isNegativeDeposit ? 'text-destructive' : '',
        },
        {
            label: 'My Cost',
            value: formatCurrency(totalCost),
            icon: ShoppingCart,
            bgClass: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-amber-500/20',
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-500',
            valueColor: '',
        },
        {
            label: 'My Balance',
            value: `${balance.currentBalance < 0 ? '-' : ''}${formatCurrency(Math.abs(balance.currentBalance))}`,
            icon: Scale,
            bgClass: isNegativeBalance
                ? 'bg-gradient-to-br from-red-500/15 to-rose-500/10 border-red-500/20'
                : 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border-emerald-500/20',
            iconBg: isNegativeBalance ? 'bg-red-500/10' : 'bg-emerald-500/10',
            iconColor: isNegativeBalance ? 'text-red-500' : 'text-emerald-500',
            valueColor: isNegativeBalance ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400',
            trending: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(({ label, value, icon: Icon, bgClass, iconBg, iconColor, valueColor, trending }) => (
                <Card
                    key={label}
                    className={`overflow-hidden border ${bgClass} transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {label}
                            </span>
                            <div className={`p-1.5 rounded-lg ${iconBg} ${iconColor}`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-xl font-bold tracking-tight ${valueColor}`}>
                                {value}
                            </span>
                            {trending && (
                                isNegativeBalance
                                    ? <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                    : <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
