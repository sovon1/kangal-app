'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Utensils,
    ShoppingCart,
    Calculator,
    Users,
    FileText,
    Smartphone,
    type LucideIcon,
} from 'lucide-react';

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
    accent: string; // HSL color
}

const features: Feature[] = [
    {
        icon: Utensils,
        title: 'Meal Tracking',
        description: 'আজকে ক্লাস শেষে বাইরে খাবেন? চিন্তা নাই, মিল অফ করে বের হন। 🍛',
        accent: '142 76% 36%',  // green
    },
    {
        icon: ShoppingCart,
        title: 'Bazaar Logs',
        description: 'বাজার করে ফাঁকি দেওয়ার দিন শেষ। এখানে সব রেকর্ড আছে ভাই 👀',
        accent: '25 95% 53%',   // orange
    },
    {
        icon: Calculator,
        title: 'Auto-Math',
        description: 'মিল রেট নিয়ে গ্যাঞ্জাম? সেই যুগ শেষ, এখন সব অটো। ⚡',
        accent: '217 91% 60%',  // blue
    },
    {
        icon: Users,
        title: 'Manager Powers',
        description: 'ম্যানেজার সাহেব, আর খাতা-কলম লাগবে না। এক ক্লিকেই খেল খতম! 💪',
        accent: '271 91% 65%',  // purple
    },
    {
        icon: FileText,
        title: 'PDF Exports',
        description: "'ম্যানেজার তুমি টাকা মারছো' — এই কথা শুনতে হবে না আর। PDF দিন! 📄",
        accent: '0 84% 60%',    // red
    },
    {
        icon: Smartphone,
        title: 'App-like Feel',
        description: 'ফোনে রাখেন, পকেটেই মেস। চায়ের দোকানেও হিসাব চেক করেন! ☕',
        accent: '188 94% 43%',  // cyan
    },
];

export function FeatureCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
        </div>
    );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const Icon = feature.icon;

    return (
        <div
            ref={ref}
            className="group relative overflow-hidden rounded-2xl border bg-card/30 p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: isVisible ? `hsl(${feature.accent} / 0.2)` : 'transparent',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
                transitionDelay: `${index * 120}ms`,
                ['--card-accent' as string]: feature.accent,
            }}
        >
            {/* Accent glow blob */}
            <div
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150"
                style={{
                    backgroundColor: `hsl(${feature.accent} / 0.08)`,
                }}
            />

            {/* Bottom accent line */}
            <div
                className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
                style={{
                    backgroundColor: `hsl(${feature.accent} / 0.6)`,
                }}
            />

            {/* Icon */}
            <div
                className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                style={{
                    backgroundColor: `hsl(${feature.accent} / 0.1)`,
                    color: `hsl(${feature.accent})`,
                }}
            >
                <Icon className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="mb-3 text-lg font-bold tracking-tight text-foreground">
                {feature.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
            </p>
        </div>
    );
}
