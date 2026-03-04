'use client';

import { useEffect, useState } from 'react';

const FOOD_ICONS = ['🍚', '🥘', '🍛', '🥗', '🍲', '🥩', '🧅', '🥕', '🫑', '🍳'];

export function KangalLoader({
    text = 'Loading your mess...',
    subtext = 'Preparing your dashboard',
    fullScreen = false
}: {
    text?: string;
    subtext?: string;
    fullScreen?: boolean;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const iconInterval = setInterval(() => {
            setActiveIndex((i) => (i + 1) % FOOD_ICONS.length);
        }, 300);

        const dotInterval = setInterval(() => {
            setDots((d) => (d.length >= 3 ? '' : d + '.'));
        }, 500);

        return () => {
            clearInterval(iconInterval);
            clearInterval(dotInterval);
        };
    }, []);

    const content = (
        <div className={`flex flex-col items-center justify-center gap-6 ${fullScreen ? '' : 'min-h-[60vh]'}`}>
            {/* Animated Food Circle */}
            <div className="relative w-28 h-28">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/60 border-r-primary/30 animate-spin" />
                <div className="absolute inset-1 rounded-full border-4 border-transparent border-b-orange-500/50 border-l-orange-500/25 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />

                {/* Inner food emoji */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-4xl transition-all duration-300 animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                    >
                        {FOOD_ICONS[activeIndex]}
                    </span>
                </div>
            </div>

            {/* Floating food pills */}
            <div className="flex items-center gap-2">
                {FOOD_ICONS.slice(0, 5).map((icon, i) => (
                    <span
                        key={i}
                        className="text-lg transition-all duration-500"
                        style={{
                            opacity: i === activeIndex % 5 ? 1 : 0.25,
                            transform: i === activeIndex % 5 ? 'scale(1.3) translateY(-4px)' : 'scale(1)',
                            transition: 'all 0.3s ease-out',
                        }}
                    >
                        {icon}
                    </span>
                ))}
            </div>

            {/* Text */}
            <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground/80">
                    {text}{dots}
                </p>
                <p className="text-xs text-muted-foreground">
                    {subtext}
                </p>
            </div>

            {/* Progress bar animation */}
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary via-orange-500 to-primary rounded-full animate-loader-bar"
                />
            </div>

            <style jsx>{`
                @keyframes loader-bar {
                    0% { width: 0%; margin-left: 0%; }
                    50% { width: 60%; margin-left: 20%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-loader-bar {
                    animation: loader-bar 1.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300 animate-in fade-in">
                {content}
            </div>
        );
    }

    return content;
}
