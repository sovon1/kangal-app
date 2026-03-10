'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Smartphone, Bug, TerminalSquare } from 'lucide-react';

const updates = [
    {
        id: 1,
        icon: Smartphone,
        title: "KANGAL অ্যাপ এখন ইনস্টলেবল! 🔥",
        short: "App Install",
        desc: "ফোন বা কম্পিউটারে KANGAL অ্যাপ হিসেবে ইনস্টল করুন। ওয়েবসাইট থেকে সরাসরি ওয়ান-ক্লিক ইনস্টল, একদম নেটিভ এক্সপেরিয়েন্স।",
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-500/20 border-amber-500/30",
        glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-500/40",
        isExclusive: true,
    },
    {
        id: 2,
        icon: Sparkles,
        title: "নতুন অফলাইন এক্সপেরিয়েন্স 📡",
        short: "Offline Mode",
        desc: "অ্যানিমেটেড অফলাইন মোড যুক্ত করা হয়েছে।",
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
        glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/30",
        isExclusive: false,
    },
    {
        id: 3,
        icon: Bug,
        title: "ডিজাইন ও বাগ ফিক্স",
        short: "UX Fixes",
        desc: "ম্যানেজারদের জন্য নিচের বারে Options এর বদলে Costs আনা হয়েছে, এবং Landing Page-এর ডিজাইন আরও সুন্দর করা হয়েছে।",
        iconColor: "text-purple-500 dark:text-purple-400",
        iconBg: "bg-purple-500/10 border-purple-500/20",
        glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:border-purple-500/30",
        isExclusive: false,
    },
];

interface UpdatesModalProps {
    trigger?: React.ReactNode;
}

export function UpdatesModal({ trigger }: UpdatesModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="gap-2 text-sm font-medium text-muted-foreground hover:text-foreground relative hidden sm:flex">
                        What's New
                        <span className="absolute top-1.5 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                            <TerminalSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">New Updates (10 March 2026)</DialogTitle>
                            <DialogDescription className="text-sm">
                                what we are doing to make your life easier
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 pb-6 pt-2 space-y-3">
                    {updates.map((update) => {
                        const Icon = update.icon;
                        return (
                            <div
                                key={update.id}
                                className={`group relative flex gap-4 p-4 rounded-3xl backdrop-blur-md transition-all duration-300 ${update.glow} cursor-default overflow-hidden ${update.isExclusive
                                    ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                    : 'bg-background/60 border border-border/50 shadow-sm'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center ${update.iconBg} border transition-transform duration-300 group-hover:scale-110 shadow-sm relative z-10`}>
                                    <Icon className={`h-6 w-6 ${update.iconColor}`} />
                                </div>

                                <div className="flex-1 relative z-10 pt-1">
                                    <div className="flex items-center justify-between mb-1 gap-2">
                                        <h4 className={`text-base font-bold ${update.isExclusive ? 'text-amber-500' : 'text-foreground'}`}>
                                            {update.title}
                                        </h4>
                                        {update.isExclusive && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 animate-pulse whitespace-nowrap hidden sm:inline-block">
                                                Exclusive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        {update.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
