'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    ShoppingCart,
    Wallet,
    DollarSign,
    SlidersHorizontal,
    Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface BottomTabsProps {
    hasMess?: boolean;
    isManager?: boolean;
}

const memberTabs = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/meals', label: 'Meals', icon: CalendarDays },
    { href: '/dashboard/bazaar', label: 'Bazaar', icon: ShoppingCart },
    { href: '/dashboard/deposits', label: 'Deposits', icon: Wallet },
    { href: '/dashboard/options', label: 'Options', icon: SlidersHorizontal },
];

const managerTabs = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/meals', label: 'Meals', icon: CalendarDays },
    { href: '/dashboard/bazaar', label: 'Bazaar', icon: ShoppingCart },
    { href: '/dashboard/deposits', label: 'Deposits', icon: Wallet },
    { href: '/dashboard/admin/costs', label: 'Costs', icon: DollarSign },
];

export function BottomTabs({ hasMess = true, isManager = false }: BottomTabsProps) {
    const pathname = usePathname();
    const tabs = isManager ? managerTabs : memberTabs;

    const handleLockedTap = (e: React.MouseEvent) => {
        e.preventDefault();
        toast.error('⚠️ আগে একটি মেসে জয়েন করুন অথবা নতুন মেস তৈরি করুন!', {
            description: 'এই ফিচার ব্যবহার করতে আপনাকে অবশ্যই একটি মেসের সদস্য হতে হবে।',
            duration: 3000,
        });
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />

            {/* Safe area spacer for notched devices */}
            <div className="relative flex items-stretch justify-around px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {tabs.map((tab) => {
                    const isDashboard = tab.href === '/dashboard';
                    const isActive = isDashboard
                        ? pathname === '/dashboard'
                        : pathname.startsWith(tab.href);
                    const isLocked = !hasMess && !isDashboard;
                    const Icon = tab.icon;

                    if (isLocked) {
                        return (
                            <button
                                key={tab.href}
                                onClick={handleLockedTap}
                                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative group active:scale-90 transition-transform duration-150"
                            >
                                <div className="relative">
                                    <Icon className="h-5 w-5 text-muted-foreground/30" />
                                    <Lock className="absolute -top-1 -right-1.5 h-2.5 w-2.5 text-muted-foreground/50" />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground/30">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative active:scale-90 transition-all duration-150 ${isActive ? '' : 'text-muted-foreground'
                                }`}
                        >
                            {/* Active indicator pill */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full bg-primary animate-in fade-in zoom-in-50 duration-300" />
                            )}

                            <div className={`relative transition-all duration-200 ${isActive ? 'text-primary scale-110' : 'hover:text-foreground'}`}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary font-semibold' : ''
                                }`}>
                                {tab.label}
                            </span>

                            {/* Active glow effect */}
                            {isActive && (
                                <div className="absolute inset-0 -top-1 rounded-xl bg-primary/5 animate-in fade-in duration-300" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
