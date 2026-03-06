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
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 p-4 w-full">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-56 lg:h-56 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                        <div className="w-3/4 h-3/4 rounded-full border-4 border-slate-200/50 dark:border-slate-700/50"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!balance) return null;

    const totalCost = balance.mealCost + balance.fixedCostShare + balance.individualCostTotal;
    const isNegativeBalance = balance.currentBalance < 0;

    const stats = [
        {
            id: 'meals',
            label: 'মোট মিল',
            value: balance.totalMeals.toString(),
            icon: UtensilsCrossed,
            color: 'text-slate-700 dark:text-slate-300',
            ringColor: 'stroke-slate-400 dark:stroke-slate-500',
            prefix: '',
            suffix: ' মিল'
        },
        {
            id: 'deposit',
            label: 'মোট জমা',
            value: formatCurrency(Math.abs(balance.totalDeposits)),
            icon: Wallet,
            color: 'text-blue-600 dark:text-blue-400',
            ringColor: 'stroke-blue-500',
            prefix: balance.totalDeposits < 0 ? '-' : '',
            suffix: ''
        },
        {
            id: 'cost',
            label: 'মোট খরচ',
            value: formatCurrency(totalCost),
            icon: ShoppingCart,
            color: 'text-amber-600 dark:text-amber-400',
            ringColor: 'stroke-amber-500',
            prefix: '',
            suffix: ''
        },
        {
            id: 'balance',
            label: 'বর্তমান ব্যালেন্স',
            value: formatCurrency(Math.abs(balance.currentBalance)),
            icon: Scale,
            color: isNegativeBalance ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
            ringColor: isNegativeBalance ? 'stroke-red-500' : 'stroke-emerald-500',
            prefix: isNegativeBalance ? '-' : '+',
            suffix: '',
            trending: true
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full font-sans">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.id} className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-current to-transparent opacity-[0.03] rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 ${stat.color}`} />
                        <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-xl bg-background/80 shadow-sm border border-border/50 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-5 h-5" strokeWidth={2} />
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1 truncate">
                                    {stat.label}
                                </h4>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                                        {stat.prefix}{stat.value}
                                    </span>
                                    {stat.suffix && (
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {stat.suffix}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
