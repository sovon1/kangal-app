'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Utensils, ArrowRight } from 'lucide-react';
import { MobileUpdatesMarquee } from './mobile-updates-marquee';
import { AppManualModal } from './app-manual-modal';

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
            ease: [0.22, 1, 0.36, 1], // custom ease-out curve
        },
    },
};

/* ── component ───────────────────────────────────────────── */

interface HeroSectionProps {
    isLoggedIn: boolean;
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
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

            {/* Heading — curved cute Bengali text with Galada font */}
            <h1
                className="text-5xl lg:text-7xl leading-snug mb-7"
                style={{ fontFamily: 'var(--font-display), cursive' }}
            >
                <motion.span variants={blurUp} className="block text-foreground">
                    মেসের হিসাব করুন
                </motion.span>
                <motion.span
                    variants={blurUp}
                    className="block text-emerald-500 dark:text-emerald-400"
                >
                    ঝামেলা ছাড়া
                </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
                variants={blurUp}
                className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
            >
                KANGAL automates your entire mess — meals, bazaar, deposits,
                dues — so month-end doesn&apos;t end friendships.
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
            </motion.div>

            {/* Mobile Updates Marquee */}
            <MobileUpdatesMarquee />
        </motion.div>
    );
}
