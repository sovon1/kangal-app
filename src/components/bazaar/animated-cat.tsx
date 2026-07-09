'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type CatState = 'idle' | 'walking' | 'smiling' | 'crying' | 'playing';

export interface AnimatedCatProps {
    inModal?: boolean;
}

export default function AnimatedCat({ inModal = false }: AnimatedCatProps) {
    const [state, setState] = useState<CatState>('idle');
    const [position, setPosition] = useState({ x: 100, y: 0 });
    const [facingLeft, setFacingLeft] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [boundary, setBoundary] = useState({ minX: 20, maxX: 300 });

    // Reaction timers
    const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track boundaries of the container
    useEffect(() => {
        const updateBoundaries = () => {
            if (inModal) {
                // Constrained area near the modal title (e.g. top right corner)
                setBoundary({ minX: 10, maxX: 120 });
            } else {
                if (typeof window !== 'undefined') {
                    const width = window.innerWidth;
                    setBoundary({
                        minX: 20,
                        maxX: Math.min(width - 100, 600)
                    });
                }
            }
        };
        updateBoundaries();
        window.addEventListener('resize', updateBoundaries);
        return () => window.removeEventListener('resize', updateBoundaries);
    }, [inModal]);

    // Helper to set temporary state and return to idle
    const triggerState = (newState: CatState, duration = 3000) => {
        if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
        setState(newState);
        actionTimeoutRef.current = setTimeout(() => {
            setState('idle');
        }, duration);
    };

    // Listen to global events triggered by page actions
    useEffect(() => {
        const handleAdd = () => triggerState('smiling', 4000);
        const handleDelete = () => triggerState('crying', 4000);

        window.addEventListener('bazaar-expense-added', handleAdd);
        window.addEventListener('bazaar-expense-deleted', handleDelete);

        return () => {
            window.removeEventListener('bazaar-expense-added', handleAdd);
            window.removeEventListener('bazaar-expense-deleted', handleDelete);
            if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
        };
    }, []);

    // Random movement logic (roaming)
    useEffect(() => {
        if (state !== 'idle' && state !== 'walking') return;

        const interval = setInterval(() => {
            if (Math.random() > 0.4) {
                const targetX = Math.floor(
                    boundary.minX + Math.random() * (boundary.maxX - boundary.minX)
                );
                
                setFacingLeft(targetX < position.x);
                setState('walking');
                setPosition(prev => ({ ...prev, x: targetX }));
                
                setTimeout(() => {
                    setState(current => current === 'walking' ? 'idle' : current);
                }, 2000);
            }
        }, inModal ? 4000 : 6000);

        return () => clearInterval(interval);
    }, [state, boundary, position.x, inModal]);

    // Custom play action when clicked
    const handleCatClick = () => {
        triggerState('playing', 2500);
    };

    const containerClasses = inModal 
        ? "absolute -top-3 sm:-top-4 right-4 sm:right-6 pointer-events-none z-0 w-32 h-16" 
        : "fixed bottom-16 left-0 right-0 pointer-events-none z-[9999] mx-auto max-w-2xl h-20";

    const catSize = inModal ? "w-12 h-12" : "w-20 h-20";
    const svgSize = inModal ? "w-10 h-10" : "w-16 h-16";

    return (
        <div 
            ref={containerRef}
            className={containerClasses}
        >
            <motion.div
                animate={{
                    x: position.x,
                    y: position.y,
                    scaleX: facingLeft ? -1 : 1
                }}
                transition={{
                    type: 'spring',
                    stiffness: 40,
                    damping: 12
                }}
                onClick={handleCatClick}
                className={`absolute bottom-0 ${catSize} cursor-pointer pointer-events-auto flex items-end justify-center select-none`}
            >
                {/* Speech Bubble */}
                <AnimatePresence>
                    {state !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.8 }}
                            className="absolute -top-8 bg-white dark:bg-zinc-800 text-[10px] font-bold px-2 py-1 rounded-lg shadow-md border dark:border-zinc-700 flex items-center gap-1 whitespace-nowrap text-zinc-800 dark:text-zinc-200"
                            style={{ scaleX: facingLeft ? -1 : 1 }}
                        >
                            {state === 'walking' && '🐾 Meow...'}
                            {state === 'smiling' && '🌟 Purr! (৳)'}
                            {state === 'crying' && '😭 Meww...'}
                            {state === 'playing' && '⚽ Wheee!'}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SVG Animated Cat */}
                <svg
                    viewBox="0 0 100 100"
                    className={`${svgSize} overflow-visible`}
                >
                    {/* Tail */}
                    <motion.path
                        d="M 30,75 C 20,70 10,80 15,60 C 18,48 25,52 28,65"
                        fill="none"
                        stroke="#F59E0B" /* Amber coat */
                        strokeWidth="7"
                        strokeLinecap="round"
                        animate={
                            state === 'playing' 
                                ? { rotate: [0, 40, -40, 0] } 
                                : state === 'crying'
                                ? { y: [0, 2, 0] }
                                : { rotate: [0, 10, -10, 0] }
                        }
                        transition={{
                            repeat: Infinity,
                            duration: state === 'playing' ? 0.4 : 1.5,
                            ease: 'easeInOut'
                        }}
                        style={{ originX: '30px', originY: '75px' }}
                    />

                    {/* Legs (Back) */}
                    <motion.ellipse
                        cx="42" cy="80" rx="5" ry="8"
                        fill="#D97706"
                        animate={state === 'walking' ? { y: [0, -4, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 0.4 }}
                    />
                    <motion.ellipse
                        cx="58" cy="80" rx="5" ry="8"
                        fill="#D97706"
                        animate={state === 'walking' ? { y: [-4, 0, -4] } : {}}
                        transition={{ repeat: Infinity, duration: 0.4 }}
                    />

                    {/* Body */}
                    <motion.ellipse
                        cx="50" cy="65" rx="18" ry="15"
                        fill="#F59E0B"
                        animate={
                            state === 'smiling' 
                                ? { y: [0, -3, 0] } 
                                : state === 'crying'
                                ? { y: [0, 1, 0] }
                                : {}
                        }
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />

                    {/* White belly patch */}
                    <ellipse cx="50" cy="67" rx="10" ry="8" fill="#FFF" opacity="0.9" />

                    {/* Legs (Front) */}
                    <motion.ellipse
                        cx="48" cy="81" rx="4.5" ry="9"
                        fill="#F59E0B"
                        animate={state === 'walking' ? { y: [-3, 0, -3] } : {}}
                        transition={{ repeat: Infinity, duration: 0.4 }}
                    />
                    <motion.ellipse
                        cx="54" cy="81" rx="4.5" ry="9"
                        fill="#F59E0B"
                        animate={state === 'walking' ? { y: [0, -3, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 0.4 }}
                    />

                    {/* Head group */}
                    <motion.g
                        animate={
                            state === 'playing'
                                ? { rotate: [0, 8, -8, 0] }
                                : state === 'crying'
                                ? { y: [0, 1.5, 0] }
                                : { y: [0, -1, 0] }
                        }
                        transition={{
                            repeat: Infinity,
                            duration: state === 'playing' ? 0.5 : 2,
                            ease: 'easeInOut'
                        }}
                        style={{ originX: '50px', originY: '45px' }}
                    >
                        {/* Ears */}
                        <path d="M 36,35 L 26,15 L 42,27 Z" fill="#F59E0B" />
                        <path d="M 38,32 L 30,18 L 42,26 Z" fill="#FCA5A5" /> {/* Inner ear */}

                        <path d="M 64,35 L 74,15 L 58,27 Z" fill="#F59E0B" />
                        <path d="M 62,32 L 70,18 L 58,26 Z" fill="#FCA5A5" /> {/* Inner ear */}

                        {/* Head Circle */}
                        <circle cx="50" cy="40" r="16" fill="#F59E0B" />

                        {/* Cheeks blush */}
                        <ellipse cx="39" cy="44" rx="3" ry="1.5" fill="#FCA5A5" opacity="0.6" />
                        <ellipse cx="61" cy="44" rx="3" ry="1.5" fill="#FCA5A5" opacity="0.6" />

                        {/* Eyes */}
                        {state === 'idle' && (
                            <>
                                {/* Blinking animation for normal state */}
                                <motion.ellipse
                                    cx="42" cy="38" rx="2" ry="3" fill="#000"
                                    animate={{ scaleY: [1, 0.1, 1] }}
                                    transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.2 }}
                                />
                                <motion.ellipse
                                    cx="58" cy="38" rx="2" ry="3" fill="#000"
                                    animate={{ scaleY: [1, 0.1, 1] }}
                                    transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.2 }}
                                />
                            </>
                        )}

                        {state === 'walking' && (
                            <>
                                <circle cx="42" cy="38" r="2" fill="#000" />
                                <circle cx="58" cy="38" r="2" fill="#000" />
                            </>
                        )}

                        {state === 'smiling' && (
                            <>
                                {/* Happy closed curved eyes */}
                                <path d="M 39,39 Q 42,35 45,39" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M 55,39 Q 58,35 61,39" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                            </>
                        )}

                        {state === 'crying' && (
                            <>
                                {/* Sad eyes */}
                                <path d="M 39,37 Q 42,40 45,37" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M 55,37 Q 58,40 61,37" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                                {/* Blue tears dropping */}
                                <motion.circle
                                    cx="40" cy="42" r="1.5" fill="#60A5FA"
                                    animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.2 }}
                                />
                                <motion.circle
                                    cx="60" cy="42" r="1.5" fill="#60A5FA"
                                    animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                                />
                            </>
                        )}

                        {state === 'playing' && (
                            <>
                                {/* Excited eyes */}
                                <ellipse cx="42" cy="38" rx="3.5" ry="3.5" fill="#000" />
                                <circle cx="41" cy="37" r="1" fill="#FFF" />
                                <ellipse cx="58" cy="38" rx="3.5" ry="3.5" fill="#000" />
                                <circle cx="57" cy="37" r="1" fill="#FFF" />
                            </>
                        )}

                        {/* Snout / Nose */}
                        <polygon points="49,43 51,43 50,44.5" fill="#000" />
                        <path d="M 48,46 Q 50,48 50,46 Q 50,48 52,46" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Whiskers */}
                        <line x1="32" y1="44" x2="22" y2="42" stroke="#000" strokeWidth="1" />
                        <line x1="32" y1="46" x2="20" y2="47" stroke="#000" strokeWidth="1" />

                        <line x1="68" y1="44" x2="78" y2="42" stroke="#000" strokeWidth="1" />
                        <line x1="68" y1="46" x2="80" y2="47" stroke="#000" strokeWidth="1" />
                    </motion.g>
                </svg>
            </motion.div>
        </div>
    );
}
