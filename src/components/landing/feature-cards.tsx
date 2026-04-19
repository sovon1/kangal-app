'use client';

import { motion } from 'framer-motion';
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
        title: 'Manager Powers',
        description: 'ম্যানেজার সাহেব, আর খাতা-কলম লাগবে না। এক ক্লিকেই খেল খতম! 💪',
    },
    {
        icon: FileText,
        title: 'PDF Exports',
        description: "'ম্যানেজার তুমি টাকা মারছো' — এই কথা শুনতে হবে না আর। PDF দিন! 📄",
    },
    {
        icon: Smartphone,
        title: 'App-like Feel',
        description: 'ফোনে রাখেন, পকেটেই মেস। চায়ের দোকানেও হিসাব চেক করেন! ☕',
    },
];

/* ── animation variants ─────────────────────────────────── */

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)' },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

/* ── components ──────────────────────────────────────────── */

export function FeatureCards() {
    return (
        <div>
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-12"
            >
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mb-3">
                    Features
                </p>
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                    Everything you need,<br className="hidden sm:block" />{' '}
                    nothing you don&apos;t.
                </h2>
            </motion.div>

            {/* Cards Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {features.map((feature) => (
                    <FeatureCard key={feature.title} feature={feature} />
                ))}
            </motion.div>
        </div>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    const Icon = feature.icon;

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 transition-shadow duration-300 hover:shadow-xl"
        >
            {/* Subtle hover glow — unified emerald */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 bg-emerald-500/10" />

            {/* Bottom accent line on hover */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out bg-emerald-500/40" />

            {/* Icon — unified emerald tint */}
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110">
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
        </motion.div>
    );
}
