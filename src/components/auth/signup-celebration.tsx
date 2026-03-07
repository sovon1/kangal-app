'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    emoji: string;
    velocityX: number;
    velocityY: number;
    delay: number;
}

const CELEBRATION_EMOJIS = ['🎉', '🥳', '🎊', '✨', '🍛', '🥘', '🍚', '🐐', '⭐', '💚'];
const CONFETTI_COLORS = [
    '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

export function SignupCelebration({
    userName,
    onComplete,
}: {
    userName: string;
    onComplete: () => void;
}) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [showContent, setShowContent] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const particlesGenerated = useRef(false);

    useEffect(() => {
        if (particlesGenerated.current) return;
        particlesGenerated.current = true;

        // Generate confetti particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 60; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: -10 - Math.random() * 20,
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random() * 1,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                emoji: CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)],
                velocityX: (Math.random() - 0.5) * 3,
                velocityY: 2 + Math.random() * 4,
                delay: Math.random() * 1.5,
            });
        }
        setParticles(newParticles);

        // Show main content after a moment
        const contentTimer = setTimeout(() => setShowContent(true), 400);
        // Auto-continue after 4 seconds
        const autoTimer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onComplete, 500);
        }, 4000);

        return () => {
            clearTimeout(contentTimer);
            clearTimeout(autoTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100'}`}
            style={{ background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0.85) 100%)' }}
            onClick={() => { setFadeOut(true); setTimeout(onComplete, 500); }}
        >
            {/* Confetti particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute pointer-events-none animate-confetti-fall"
                    style={{
                        left: `${p.x}%`,
                        fontSize: `${p.scale * 1.5}rem`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${2 + p.velocityY * 0.5}s`,
                        '--confetti-x': `${p.velocityX * 40}px`,
                        '--confetti-rotation': `${p.rotation + 720}deg`,
                    } as React.CSSProperties}
                >
                    {p.emoji}
                </div>
            ))}

            {/* Main celebration content */}
            <div
                className={`relative text-center px-8 py-12 transition-all duration-700 ${showContent
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-90'
                    }`}
            >
                {/* Large emoji burst */}
                <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: '1s' }}>
                    🎉
                </div>

                {/* Welcome text */}
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                    স্বাগতম, {userName}!
                </h1>
                <p className="text-xl text-emerald-300 font-medium mb-2">
                    Welcome to KANGAL 🐐
                </p>
                <p className="text-white/60 text-sm mb-8">
                    বাংলাদেশের #1 মেস ম্যানেজমেন্ট অ্যাপে আপনাকে স্বাগত
                </p>

                {/* Pulsing ring */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                    <div className="w-64 h-64 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute w-80 h-80 rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                {/* Tap to continue */}
                <p className="text-white/40 text-xs animate-pulse">
                    tap anywhere to continue
                </p>
            </div>

            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-20vh) translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) translateX(var(--confetti-x)) rotate(var(--confetti-rotation));
                        opacity: 0;
                    }
                }
                .animate-confetti-fall {
                    animation: confetti-fall linear forwards;
                }
            `}</style>
        </div>
    );
}
