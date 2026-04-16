'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
    hidden: {
        opacity: 0,
        y: 12,
        filter: 'blur(4px)',
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
            staggerChildren: 0.08,
        },
    },
};

export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
        >
            {children}
        </motion.div>
    );
}
