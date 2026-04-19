'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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
}

const features: Feature[] = [
    {
        icon: Utensils,
        title: 'Meal Tracking',
        description: 'আজকে ক্লাস শেষে বাইরে খাবেন? চিন্তা নাই, মিল অফ করে বের হন। 🍛',
    },
    {
        icon: ShoppingCart,
        title: 'Bazaar Logs',
        description: 'বাজার করে ফাঁকি দেওয়ার দিন শেষ। এখানে সব রেকর্ড আছে ভাই 👀',
    },
    {
        icon: Calculator,
        title: 'Auto-Math',
        description: 'মিল রেট নিয়ে গ্যাঞ্জাম? সেই যুগ শেষ, এখন সব অটো। ⚡',
    },
    {
        icon: Users,
        title: 'Manager Tools',
        description: 'ম্যানেজার সাহেব, আর খাতা-কলম লাগবে না। এক ক্লিকেই খেল খতম! 💪',
    },
    {
        icon: FileText,
        title: 'PDF Reports',
        description:
            "'ম্যানেজার তুমি টাকা মারছো' — এই কথা শুনতে হবে না আর। PDF দিন! 📄",
    },
    {
        icon: Smartphone,
        title: 'Mobile App',
        description: 'ফোনে রাখেন, পকেটেই মেস। চায়ের দোকানেও হিসাব চেক করেন! ☕',
    },
];

/* ── animation config ────────────────────────────────────── */

const cellVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97, filter: 'blur(4px)' },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
    },
};

/* ── main component ──────────────────────────────────────── */

export function FeatureCards() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    return (
        <div>
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                className="mb-8"
            >
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mb-3">
                    Features
                </p>
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                    Everything you need,<br className="hidden sm:block" />{' '}
                    nothing you don&apos;t.
                </h2>
            </motion.div>

            {/* Compact 2-col Grid */}
            <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.06 } },
                }}
                className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
                {features.map((feature, i) => (
                    <FeatureCell
                        key={feature.title}
                        feature={feature}
                        isExpanded={expandedIndex === i}
                        onToggle={() =>
                            setExpandedIndex(expandedIndex === i ? null : i)
                        }
                    />
                ))}
            </motion.div>
        </div>
    );
}

/* ── individual cell ─────────────────────────────────────── */

function FeatureCell({
    feature,
    isExpanded,
    onToggle,
}: {
    feature: Feature;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const Icon = feature.icon;

    return (
        <motion.div
            variants={cellVariants}
            onClick={onToggle}
            className={`
                group relative text-left p-4 sm:p-5 rounded-2xl border cursor-pointer
                transition-all duration-300 overflow-hidden
                ${
                    isExpanded
                        ? 'bg-emerald-500/[0.07] border-emerald-500/30 shadow-lg shadow-emerald-500/[0.06]'
                        : 'bg-card/40 border-border/50 hover:border-emerald-500/20 hover:bg-card/60 hover:shadow-md'
                }
            `}
        >
            {/* Icon + Title */}
            <div className="flex items-center gap-3">
                <div
                    className={`
                    shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center
                    transition-colors duration-300
                    ${
                        isExpanded
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-emerald-500/10 text-emerald-600/80 dark:text-emerald-400/80'
                    }
                `}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-foreground flex-1 min-w-0">
                    {feature.title}
                </h3>
                {/* Chevron — mobile only, rotates on expand */}
                <ChevronDown
                    className={`
                        h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-300 lg:hidden
                        ${isExpanded ? 'rotate-180' : ''}
                    `}
                />
            </div>

            {/* Mobile/Tablet: expandable description (animated) */}
            <div className="lg:hidden">
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                        >
                            <p className="pt-3 text-[13px] text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop: always visible description */}
            <p className="hidden lg:block mt-3 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
            </p>
        </motion.div>
    );
}
