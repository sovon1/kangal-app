'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Utensils } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface Props {
    location: 'header' | 'cta';
}

export function LandingAuthButtons({ location }: Props) {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        const supabase = getSupabaseBrowserClient();
        
        // Initial check
        supabase.auth.getSession().then(({ data }) => {
            setIsLoggedIn(!!data.session);
        });

        // Listen for live auth changes (e.g., cross-tab login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // While checking auth, show default (logged-out) buttons — no layout shift
    const loggedIn = isLoggedIn === true;

    if (location === 'header') {
        if (loggedIn) {
            return (
                <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
            );
        }
        return (
            <>
                <Link href="/login">
                    <Button variant="ghost" className="text-base">Log in</Button>
                </Link>
                <Link href="/signup">
                    <Button className="font-semibold">Get Started</Button>
                </Link>
            </>
        );
    }

    // CTA section
    if (loggedIn) {
        return (
            <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-lg gap-2">
                    <Utensils className="h-5 w-5" />
                    Open Dashboard
                </Button>
            </Link>
        );
    }
    return (
        <>
            <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/20">
                    Sign Up
                </Button>
            </Link>
            <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    Log In
                </Button>
            </Link>
        </>
    );
}
