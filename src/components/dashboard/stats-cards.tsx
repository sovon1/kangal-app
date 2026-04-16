'use client';

import { useState } from 'react';
import { UtensilsCrossed, Wallet, ShoppingCart, Scale } from 'lucide-react';
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
    const [activeCardId, setActiveCardId] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-muted/50 animate-pulse h-28" />
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
            dot: 'bg-violet-400',
            accent: 'text-violet-600 dark:text-violet-400',
            glowColor: 'hover:shadow-violet-200/60 dark:hover:shadow-violet-900/40',
            prefix: '',
            suffix: ' মিল',
            animeAvatar: '/avatars/miki2.svg',
            animation: 'group-hover:animate-bounce group-hover:rotate-6'
        },
        {
            id: 'deposit',
            label: 'মোট জমা',
            value: formatCurrency(Math.abs(balance.totalDeposits)),
            icon: Wallet,
            dot: 'bg-sky-400',
            accent: 'text-sky-600 dark:text-sky-400',
            glowColor: 'hover:shadow-sky-200/60 dark:hover:shadow-sky-900/40',
            prefix: balance.totalDeposits < 0 ? '-' : '',
            suffix: '',
            animeAvatar: '/avatars/haru.svg',
            animation: 'group-hover:animate-[spin_3s_linear_infinite] group-hover:scale-125'
        },
        {
            id: 'cost',
            label: 'মোট খরচ',
            value: formatCurrency(totalCost),
            icon: ShoppingCart,
            dot: 'bg-amber-400',
            accent: 'text-amber-600 dark:text-amber-400',
            glowColor: 'hover:shadow-amber-200/60 dark:hover:shadow-amber-900/40',
            prefix: '',
            suffix: '',
            animeAvatar: '/avatars/yuki.svg',
            animation: 'group-hover:animate-[pulse_1s_ease-in-out_infinite] group-hover:-translate-y-3'
        },
        {
            id: 'balance',
            label: 'বর্তমান ব্যালেন্স',
            value: formatCurrency(Math.abs(balance.currentBalance)),
            icon: Scale,
            dot: isNegativeBalance ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400',
            accent: isNegativeBalance ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
            glowColor: isNegativeBalance 
                ? 'hover:shadow-rose-200/60 dark:hover:shadow-rose-900/40' 
                : 'hover:shadow-emerald-200/60 dark:hover:shadow-emerald-900/40',
            prefix: isNegativeBalance ? '-' : '+',
            suffix: '',
            animeAvatar: isNegativeBalance 
                ? '/avatars/sadie.svg' 
                : '/avatars/sora.svg',
            animation: isNegativeBalance 
                ? 'group-hover:animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]' 
                : 'group-hover:animate-[bounce_1s_infinite] group-hover:scale-110'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                const isActive = activeCardId === stat.id;

                return (
                    <div
                        key={stat.id}
                        className="stagger-item"
                    >
                        <div
                            onFocus={() => setActiveCardId(stat.id)}
                            onBlur={() => setActiveCardId(null)}
                            onMouseEnter={() => setActiveCardId(stat.id)}
                            onMouseLeave={() => setActiveCardId(null)}
                            tabIndex={0}
                            className={`
                                group relative flex flex-col justify-between overflow-hidden
                                h-full p-5 rounded-2xl cursor-pointer focus:outline-none [-webkit-tap-highlight-color:transparent]
                                bg-card/80 dark:bg-card/60
                                border border-border/40
                                transition-all duration-500 ease-out
                                hover:-translate-y-1 hover:shadow-xl
                                ${stat.glowColor}
                                ${isActive ? '-translate-y-1 shadow-xl ' + stat.glowColor.replace(/hover:shadow-/g, 'shadow-') : ''}
                            `}
                        >
                            {/* Animated Anime Character */}
                            <div className="absolute right-0 bottom-0 pointer-events-none flex items-end justify-end overflow-hidden w-24 h-24 rounded-br-2xl">
                                <img 
                                    src={stat.animeAvatar} 
                                    alt="Anime Chibi Mascot" 
                                    className={`
                                        w-16 h-16 object-contain 
                                        opacity-30 contrast-75 saturate-50 
                                        transition-all duration-500 ease-spring
                                        transform translate-y-6 translate-x-2 
                                        group-hover:opacity-100 group-hover:contrast-100 group-hover:saturate-100 
                                        group-hover:translate-y-0 group-hover:-translate-x-1
                                        ${stat.animation}
                                        ${isActive ? 'opacity-100 contrast-100 saturate-100 translate-y-0 -translate-x-1 ' + stat.animation.replace(/group-hover:/g, '') : ''}
                                    `}
                                />
                            </div>

                            {/* Top row: soft dot + tiny icon */}
                            <div className="flex items-center gap-2 mb-auto z-10 relative">
                                <span className={`w-2 h-2 rounded-full ${stat.dot} shrink-0`} />
                                <Icon className={`w-3.5 h-3.5 transition-colors duration-300 ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/50'} group-hover:text-muted-foreground`} strokeWidth={2} />
                            </div>

                            {/* Value */}
                            <div className="mt-4 z-10 relative">
                                <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${stat.accent}`}>
                                    {stat.prefix}{stat.value}
                                </span>
                                {stat.suffix && (
                                    <span className="text-xs font-medium text-muted-foreground/60 ml-0.5">
                                        {stat.suffix}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <p className="text-[11px] font-medium text-muted-foreground/70 mt-1 tracking-wide z-10 relative">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
