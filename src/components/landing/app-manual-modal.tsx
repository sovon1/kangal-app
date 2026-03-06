'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Users,
    Wallet,
    ShoppingCart,
    CalendarDays,
    Calculator,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    BookOpen,
} from 'lucide-react';

const steps = [
    {
        id: 1,
        title: 'মেস তৈরি করুন বা জয়েন করুন',
        subtitle: 'Create or Join a Mess',
        description:
            'একজন ম্যানেজার মেস তৈরি করবেন এবং একটি ইনভাইট কোড পাবেন। বাকি সবাই সেই কোড দিয়ে মেসে জয়েন করবেন। সবকিছু শুরু হয় এখান থেকেই!',
        icon: Users,
        color: 'from-blue-500 to-cyan-400',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    {
        id: 2,
        title: 'টাকা জমা দিন',
        subtitle: 'Deposit Money',
        description:
            'প্রতিটি সদস্য তাদের মাসিক ডিপোজিট জমা দেবেন। ম্যানেজার অ্যাপে ডিপোজিট এড করবেন। সব হিসাব অটোমেটিক আপডেট হবে।',
        icon: Wallet,
        color: 'from-emerald-500 to-green-400',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-500',
    },
    {
        id: 3,
        title: 'বাজার করুন',
        subtitle: 'Daily Bazaar',
        description:
            'যেকেউ বাজার করে এসে অ্যাপে বাজারের খরচ এড করবেন। আইটেম বাই আইটেম অথবা একসাথে মোট খরচ — দুইভাবেই এড করা যায়!',
        icon: ShoppingCart,
        color: 'from-amber-500 to-orange-400',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-500',
    },
    {
        id: 4,
        title: 'মিল দিন',
        subtitle: 'Log Your Meals',
        description:
            'প্রতিদিন যতগুলো মিল খাবেন ততগুলো মিল সিলেক্ট করুন। সকাল, দুপুর, রাত — সব মিল ট্র্যাক করুন। মিল রেট অটো ক্যালকুলেট হবে।',
        icon: CalendarDays,
        color: 'from-purple-500 to-violet-400',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
    },
    {
        id: 5,
        title: 'অটো হিসাব',
        subtitle: 'Auto Calculation',
        description:
            'মাস শেষে কে কত টাকা পাবে, কে কত দেবে — সব Kangal নিজে হিসাব করে দেবে। আর কোনো এক্সেল শিট বা ঝগড়া না! 🎉',
        icon: Calculator,
        color: 'from-rose-500 to-pink-400',
        bgColor: 'bg-rose-500/10',
        textColor: 'text-rose-500',
    },
];

interface AppManualModalProps {
    trigger?: React.ReactNode;
}

export function AppManualModal({ trigger }: AppManualModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const step = steps[currentStep];
    const StepIcon = step.icon;
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    return (
        <Dialog onOpenChange={() => setCurrentStep(0)}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="lg" className="gap-2">
                        <BookOpen className="h-5 w-5" /> How it Works
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>How Kangal Works</DialogTitle>
                    <DialogDescription>A step-by-step guide to managing your mess with Kangal.</DialogDescription>
                </DialogHeader>

                {/* Top progress bar */}
                <div className="flex w-full">
                    {steps.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentStep(i)}
                            className={`flex-1 h-1.5 transition-all duration-500 cursor-pointer ${i <= currentStep
                                    ? `bg-gradient-to-r ${step.color}`
                                    : 'bg-muted'
                                } ${i === 0 ? 'rounded-tl-lg' : ''} ${i === steps.length - 1 ? 'rounded-tr-lg' : ''}`}
                        />
                    ))}
                </div>

                <div className="px-8 pt-6 pb-8">
                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${step.bgColor} transition-colors duration-500`}>
                                <StepIcon className={`w-7 h-7 ${step.textColor} transition-colors duration-500`} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Step {step.id} of {steps.length}
                                </p>
                                <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
                            </div>
                        </div>
                        <Sparkles className={`w-5 h-5 ${step.textColor} animate-pulse transition-colors duration-500`} />
                    </div>

                    {/* Step Content */}
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-muted-foreground mb-3">{step.subtitle}</p>
                        <p className="text-base text-foreground/80 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Step dots */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {steps.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => setCurrentStep(i)}
                                className={`rounded-full transition-all duration-300 cursor-pointer ${i === currentStep
                                        ? `w-8 h-2.5 bg-gradient-to-r ${step.color}`
                                        : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep((p) => p - 1)}
                            disabled={isFirst}
                            className="gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> আগের ধাপ
                        </Button>
                        {isLast ? (
                            <DialogTrigger asChild>
                                <Button className={`gap-2 bg-gradient-to-r ${step.color} text-white border-none shadow-lg hover:opacity-90`}>
                                    শুরু করুন! <Sparkles className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                        ) : (
                            <Button
                                onClick={() => setCurrentStep((p) => p + 1)}
                                className={`gap-2 bg-gradient-to-r ${step.color} text-white border-none shadow-lg hover:opacity-90`}
                            >
                                পরের ধাপ <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
