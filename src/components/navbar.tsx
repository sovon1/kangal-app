'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Utensils,
    LayoutDashboard,
    CalendarDays,
    ShoppingCart,
    Wallet,
    DollarSign,
    UserCog,
    Sun,
    Moon,
    LogOut,
    Menu,
    Settings,
    BarChart3,
    X,
} from 'lucide-react';

interface NavbarProps {
    userName?: string;
    userRole?: 'manager' | 'member' | 'cook';
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/meals', label: 'Meals', icon: CalendarDays },
    { href: '/dashboard/bazaar', label: 'Bazaar', icon: ShoppingCart },
    { href: '/dashboard/deposits', label: 'Deposits', icon: Wallet },
];

const adminItems = [
    { href: '/dashboard/admin/costs', label: 'Costs', icon: DollarSign },
    { href: '/dashboard/admin/members', label: 'Members', icon: UserCog },
    { href: '/dashboard/admin/month-close', label: 'Close Month', icon: BarChart3 },
];

export function Navbar({ userName = 'User', userRole = 'member' }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const supabase = getSupabaseBrowserClient();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isManager = userRole === 'manager';
    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
        const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
        return (
            <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
            >
                <Icon className="h-4 w-4" />
                {label}
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto flex h-14 items-center px-4 gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                        <Utensils className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline tracking-tight">KANGAL</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {navItems.map((item) => (
                        <NavLink key={item.href} {...item} />
                    ))}
                    {isManager && (
                        <>
                            <div className="w-px h-6 bg-border mx-1" />
                            {adminItems.map((item) => (
                                <NavLink key={item.href} {...item} />
                            ))}
                        </>
                    )}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-9 w-9"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 gap-2 px-2">
                                <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                                    {userName}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                {userRole === 'manager' ? '👑 Manager' : userRole === 'cook' ? '👨‍🍳 Cook' : '👤 Member'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 p-0">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center gap-2 font-bold">
                                        <Utensils className="h-5 w-5 text-primary" />
                                        KANGAL
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <nav className="flex-1 p-3 space-y-1">
                                    {navItems.map((item) => (
                                        <NavLink key={item.href} {...item} />
                                    ))}
                                    {isManager && (
                                        <>
                                            <div className="my-2 border-t" />
                                            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Admin
                                            </p>
                                            {adminItems.map((item) => (
                                                <NavLink key={item.href} {...item} />
                                            ))}
                                        </>
                                    )}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
