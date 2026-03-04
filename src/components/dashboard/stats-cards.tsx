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
            label: 'Total Meals',
            value: balance.totalMeals.toString(),
            icon: UtensilsCrossed,
            color: 'text-slate-700 dark:text-slate-300',
            ringColor: 'stroke-slate-400 dark:stroke-slate-500',
            prefix: '',
            suffix: ' plts'
        },
        {
            id: 'deposit',
            label: 'Net Deposit',
            value: formatCurrency(Math.abs(balance.totalDeposits)),
            icon: Wallet,
            color: 'text-blue-600 dark:text-blue-400',
            ringColor: 'stroke-blue-500',
            prefix: balance.totalDeposits < 0 ? '-' : '',
            suffix: ''
        },
        {
            id: 'cost',
            label: 'Total Cost',
            value: formatCurrency(totalCost),
            icon: ShoppingCart,
            color: 'text-amber-600 dark:text-amber-400',
            ringColor: 'stroke-amber-500',
            prefix: '',
            suffix: ''
        },
        {
            id: 'balance',
            label: 'Net Balance',
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
        <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-4 sm:gap-6 md:gap-8 w-full font-sans">
            <style>{`
                .circle-stat-group:hover .animated-ring {
                    stroke-dashoffset: 0 !important;
                }
            `}</style>

            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.id}
                        className="circle-stat-group relative w-36 h-36 sm:w-44 sm:h-44 lg:w-56 lg:h-56 flex items-center justify-center transition-transform duration-500 hover:-translate-y-2 cursor-default"
                    >
                        {/* Background Base */}
                        <div className="absolute inset-0 rounded-full bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 transition-shadow duration-300 circle-stat-group-hover:shadow-2xl"></div>

                        {/* SVG Ring Animation */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="48"
                                fill="none"
                                className="stroke-slate-100 dark:stroke-slate-800"
                                strokeWidth="1"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="48"
                                fill="none"
                                className={`animated-ring stroke-transparent transition-all duration-700 ease-in-out stroke-[2px] ${stat.ringColor}`}
                                strokeDasharray="300"
                                strokeDashoffset="300"
                            />
                        </svg>

                        {/* Inner Content */}
                        <div className="relative z-10 flex flex-col items-center text-center p-2 sm:p-4 w-full">
                            <div className={`p-2 lg:p-3 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-1 lg:mb-2 shadow-inner ${stat.color} transition-transform duration-300 circle-stat-group-hover:scale-110`}>
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" strokeWidth={2} />
                            </div>

                            <h4 className="text-[0.6rem] sm:text-[0.65rem] lg:text-xs uppercase tracking-[0.1em] lg:tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold mb-0.5 lg:mb-1 w-full truncate px-2">
                                {stat.label}
                            </h4>

                            <div className="flex items-baseline justify-center gap-0.5 lg:gap-1">
                                <span className={`text-[0.8rem] sm:text-lg lg:text-2xl font-bold tracking-tight ${stat.color}`}>
                                    {stat.prefix}{stat.value}
                                </span>
                                {stat.suffix && (
                                    <span className="text-[0.55rem] sm:text-xs lg:text-sm font-medium text-slate-400 dark:text-slate-500">
                                        {stat.suffix}
                                    </span>
                                )}
                            </div>

                            {/* Minimalist trending indicator for balance */}
                            {stat.trending && (
                                <div className={`mt-1.5 lg:mt-3 flex items-center gap-1 text-[9px] sm:text-[10px] lg:text-xs font-medium px-2 lg:px-2.5 py-0.5 rounded-full ${isNegativeBalance ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    }`}>
                                    {isNegativeBalance ? <TrendingDown className="w-2.5 h-2.5 lg:w-3 lg:h-3" /> : <TrendingUp className="w-2.5 h-2.5 lg:w-3 lg:h-3" />}
                                    <span className="hidden sm:inline">{isNegativeBalance ? 'Deficit' : 'Surplus'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
