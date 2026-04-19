'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Utensils, ArrowRight } from 'lucide-react';
import { MobileUpdatesMarquee } from './mobile-updates-marquee';
import { AppManualModal } from './app-manual-modal';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { HeroMobileInstallButton } from './hero-mobile-install-button';

/* ── animation variants ─────────────────────────────────── */

const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.13,
            delayChildren: 0.15,
        },
    },
};

/** Each child blurs in from below — the "cinematic reveal" effect */
const blurUp = {
    hidden: {
        opacity: 0,
        y: 24,
        filter: 'blur(8px)',
    },
    show: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const, // custom ease-out curve
        },
    },
};

/* ── component ───────────────────────────────────────────── */

export function HeroSection() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center"
        >
            {/* Badge */}
            <motion.div
                variants={blurUp}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium mb-8 text-emerald-700 dark:text-emerald-400"
            >
                <span className="text-base leading-none">🍛</span>
                For students who eat together
            </motion.div>

            {/* Heading — premium serif Bengali with decorative swoosh */}
            <h1
                className="text-5xl sm:text-6xl lg:text-8xl font-semibold leading-tight mb-8"
                style={{ fontFamily: 'var(--font-display), serif' }}
            >
                <motion.span variants={blurUp} className="block text-foreground">
                    মেসের হিসাব করুন
                </motion.span>
                <motion.span
                    variants={blurUp}
                    className="relative inline-block text-emerald-500 dark:text-emerald-400"
                >
                    ঝামেলা ছাড়া
                    {/* Animated curved swoosh underline */}
                    <motion.svg
                        className="absolute -bottom-2 sm:-bottom-3 left-0 w-full overflow-visible"
                        viewBox="0 0 300 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <motion.path
                            d="M4 12 C60 2, 120 16, 150 8 S240 2, 296 13"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            transition={{ duration: 1.2, delay: 1.0, ease: 'easeOut' }}
                        />
                    </motion.svg>
                </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
                variants={blurUp}
                className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
            >
                মিল থেকে বাজার, জমা থেকে বকেয়া — পুরো মেসের হিসাব এক অ্যাপে।
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                variants={blurUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 lg:mb-16"
            >
                {isLoggedIn ? (
                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full h-12 px-8 text-lg gap-2">
                            <Utensils className="h-5 w-5" />
                            Open Dashboard
                        </Button>
                    </Link>
                ) : (
                    <>
                        <Link href="/signup" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="w-full h-12 px-8 text-lg gap-2 shadow-lg shadow-primary/20"
                            >
                                Start Your Mess
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <AppManualModal
                            trigger={
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto h-12 px-8 text-lg cursor-pointer"
                                >
                                    How it Works
                                </Button>
                            }
                        />
                    </>
                )}
                <HeroMobileInstallButton />
            </motion.div>

            {/* Mobile Updates Marquee */}
            <MobileUpdatesMarquee />
        </motion.div>
    );
}
