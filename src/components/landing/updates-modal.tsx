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
import { Sparkles, Smartphone, TerminalSquare, Zap } from 'lucide-react';

const updates = [
    {
        id: 0,
        icon: Smartphone,
        title: "অফিশিয়াল অ্যান্ড্রোয়েড অ্যাপ রিলিজ! 📱",
        date: "10 July 2026",
        short: "Android App",
        desc: "অ্যান্ড্রয়েড ইউজারদের জন্য চলে এলো অফিশিয়াল KANGAL অ্যাপ! ব্রাউজার ছাড়াই সরাসরি ফুল-স্ক্রিন, নতুন অফলাইন মোড এবং ব্যাকগ্রাউন্ড নোটিফিকেশন সুবিধা পেতে এখনই ওয়েবসাইট থেকে ডাউনলোড করুন!",
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-500/20 border-emerald-500/30",
        glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 hover:-translate-y-1",
        isExclusive: true,
    },
    {
        id: 1,
        icon: Sparkles,
        title: "বাজার খরচ এখন সরাসরি ডিপোজিট! 💰",
        date: "10 July 2026",
        short: "Bazaar Deposit",
        desc: "বাজার এন্ট্রি করার সময় নিজের পকেট থেকে খরচ করলে সরাসরি আপনার অথবা অন্য যেকোনো মেম্বারের নামে ডিপোজিট (জমা) হিসেবে যোগ করে নিতে পারবেন এক ক্লিকেই!",
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-500/20 border-rose-500/30",
        glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:border-rose-500/50 hover:-translate-y-1",
        isExclusive: false,
    },
    {
        id: 2,
        icon: Zap,
        title: "PWA 400x ফাস্টার ও সুপার স্ট্যাবল! ⚡",
        date: "09 July 2026",
        short: "Performance",
        desc: "সম্পূর্ণ নতুন আর্কিটেকচার! এখন KANGAL অ্যাপ আরও দ্রুত লোড হবে এবং অফলাইন সাপোর্ট আগের চেয়ে অনেক বেশি স্ট্যাবল। কোনো ল্যাগ নেই!",
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-500/20 border-blue-500/30",
        glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-500/50 hover:-translate-y-1",
        isExclusive: false,
    },
    {
        id: 3,
        icon: Smartphone,
        title: "KANGAL অ্যাপ এখন ইনস্টলেবল! 🔥",
        date: "08 July 2026",
        short: "App Install",
        desc: "ফোন বা কম্পিউটারে KANGAL অ্যাপ হিসেবে ইনস্টল করুন। ওয়েবসাইট থেকে সরাসরি ওয়ান-ক্লিক ইনস্টল, একদম নেটিভ এক্সপেরিয়েন্স।",
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-500/20 border-amber-500/30",
        glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-500/40 hover:-translate-y-1",
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
                        What&apos;s New
                        <span className="absolute top-1.5 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-primary/20 bg-background/95 backdrop-blur-3xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)]">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                            <TerminalSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">New Updates (10 July 2026)</DialogTitle>
                            <DialogDescription className="text-sm font-medium">
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
                                    <div className="flex items-start justify-between mb-1 gap-2">
                                        <div className="flex flex-col">
                                            <h4 className={`text-base font-bold leading-snug ${update.isExclusive ? 'text-amber-500' : 'text-foreground'}`}>
                                                {update.title}
                                            </h4>
                                            <span className="text-[11px] text-muted-foreground/80 font-medium mt-0.5">
                                                {update.date}
                                            </span>
                                        </div>
                                        {update.isExclusive && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 animate-pulse whitespace-nowrap hidden sm:inline-block mt-0.5">
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
