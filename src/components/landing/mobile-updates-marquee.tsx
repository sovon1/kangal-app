'use client';

import { Sparkles, Smartphone, Bug, TerminalSquare } from 'lucide-react';
import React from 'react';

const updates = [
    {
        id: 1,
        icon: Smartphone,
        title: "শীঘ্রই আসছে কাঙ্গাল অ্যান্ড্রয়েড অ্যাপ!🔥",
        isExclusive: true,
    },
    {
        id: 2,
        icon: Sparkles,
        title: "ইনভাইট কোড শেয়ার করার সুবিধা! ✨",
        isExclusive: false,
    },
    {
        id: 3,
        icon: Bug,
        title: "পিডিএফ ও চার্টের সমস্যা সমাধান! 🐛",
        isExclusive: false,
    },
];

export function MobileUpdatesMarquee() {
    return (
        <div className="w-full max-w-[100vw] overflow-hidden sm:hidden -mx-6 px-6 relative mt-6 mb-2">
            <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center gap-2 justify-center">
                    <TerminalSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold tracking-tight text-foreground">নতুন কি আপডেট</h3>
                    <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                </div>

                {/* Marquee Container */}
                <div className="relative flex overflow-x-hidden group">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                    {/* Scrolling Content - Animate twice for seamless loop */}
                    <div className="flex animate-[marquee_20s_linear_infinite] group-hover:[animation-play-state:paused] whitespace-nowrap">
                        {[...updates, ...updates].map((update, idx) => {
                            const Icon = update.icon;
                            return (
                                <div
                                    key={`${update.id}-${idx}`}
                                    className={`mx-2 inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all duration-300 ${update.isExclusive
                                        ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                        : 'bg-background/60 backdrop-blur-md border border-border/50 shadow-sm'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border ${update.isExclusive
                                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                        : 'bg-primary/10 border-primary/20 text-primary'
                                        }`}>
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="flex flex-col">
                                        {update.isExclusive && (
                                            <span className="text-[9px] font-bold text-amber-500 tracking-wider uppercase mb-0.5 animate-pulse">
                                                Exclusive
                                            </span>
                                        )}
                                        <span className={`text-sm font-semibold whitespace-nowrap ${update.isExclusive ? 'text-foreground' : 'text-foreground/80'
                                            }`}>
                                            {update.title}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
