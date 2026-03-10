'use client';

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
    Settings,
    SlidersHorizontal,
    Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
    userName?: string;
    userRole?: 'manager' | 'member' | 'cook';
    hasMess?: boolean;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/meals', label: 'Meals', icon: CalendarDays },
    { href: '/dashboard/bazaar', label: 'Bazaar', icon: ShoppingCart },
    { href: '/dashboard/deposits', label: 'Deposits', icon: Wallet },
    { href: '/dashboard/options', label: 'Options', icon: SlidersHorizontal },
];

const adminItems = [
    { href: '/dashboard/admin/costs', label: 'Costs', icon: DollarSign },
    { href: '/dashboard/admin/members', label: 'Members', icon: UserCog },
];

export function Navbar({ userName = 'User', userRole = 'member', hasMess = true }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const supabase = getSupabaseBrowserClient();

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

    const handleLockedNavClick = (e: React.MouseEvent) => {
        e.preventDefault();
        toast.error('⚠️ আগে একটি মেসে জয়েন করুন অথবা নতুন মেস তৈরি করুন!', {
            description: 'এই ফিচার ব্যবহার করতে আপনাকে অবশ্যই একটি মেসের সদস্য হতে হবে।',
            duration: 4000,
        });
    };

    const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
        const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
        const isDashboard = href === '/dashboard';
        const isLocked = !hasMess && !isDashboard;

        if (isLocked) {
            return (
                <button
                    onClick={handleLockedNavClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground/50 hover:text-muted-foreground cursor-not-allowed relative group"
                >
                    <Icon className="h-4 w-4" />
                    {label}
                    <Lock className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            );
        }

        return (
            <Link
                href={href}
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
                    <span className="tracking-tight">KANGAL</span>
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 gap-2 px-2 hover:bg-accent/50 transition-colors">
                                <Avatar className="h-7 w-7 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-sm font-semibold max-w-[120px] truncate">
                                        {userName}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-500 to-amber-300 text-amber-950 shadow-sm shadow-amber-500/20">
                                        PRO
                                    </span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="flex flex-col space-y-1 p-2">
                                <p className="text-sm font-medium leading-none">{userName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">
                                        {userRole === 'manager' ? '👑 Manager' : userRole === 'cook' ? '👨‍🍳 Cook' : '👤 Member'}
                                    </p>
                                    <span className="px-1 py-0 rounded-[3px] text-[8px] font-bold bg-gradient-to-r from-amber-500 to-amber-300 text-amber-950 uppercase tracking-wider">
                                        Pro Member
                                    </span>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            {/* Manager-specific links + Options (since Costs replaced Options in bottom tabs for managers) */}
                            {isManager && (
                                <>
                                    <DropdownMenuItem onClick={() => router.push('/dashboard/options')}>
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Options
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/dashboard/admin/members')}>
                                        <UserCog className="mr-2 h-4 w-4" />
                                        Members
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
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
                </div>
            </div>
        </header>
    );
}
