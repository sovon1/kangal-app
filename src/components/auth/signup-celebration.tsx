'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
    id: number;
    x: number;
    scale: number;
    emoji: string;
    velocityX: number;
    velocityY: number;
    delay: number;
    rotation: number;
}

const CELEBRATION_EMOJIS = ['🎉', '🥳', '🎊', '✨', '🍛', '🥘', '🍚', '🐐', '⭐', '💚'];

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

        const newParticles: Particle[] = [];
        for (let i = 0; i < 80; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                scale: 0.6 + Math.random() * 1.2,
                emoji: CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)],
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: 2 + Math.random() * 5,
                delay: Math.random() * 2,
                rotation: Math.random() * 360,
            });
        }
        setParticles(newParticles);

        const contentTimer = setTimeout(() => setShowContent(true), 300);
        const autoTimer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onComplete, 600);
        }, 3500);

        return () => {
            clearTimeout(contentTimer);
            clearTimeout(autoTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-600 ${fadeOut ? 'opacity-0 scale-110' : 'opacity-100'}`}
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #064e3b 100%)',
            }}
            onClick={() => { setFadeOut(true); setTimeout(onComplete, 600); }}
        >
            {/* Subtle gradient orbs in background */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

            {/* Confetti particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute pointer-events-none animate-confetti-fall"
                    style={{
                        left: `${p.x}%`,
                        fontSize: `${p.scale * 1.4}rem`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${2.5 + p.velocityY * 0.4}s`,
                        '--confetti-x': `${p.velocityX * 50}px`,
                        '--confetti-rotation': `${p.rotation + 720}deg`,
                    } as React.CSSProperties}
                >
                    {p.emoji}
                </div>
            ))}

            {/* Main celebration content */}
            <div
                className={`relative text-center px-8 py-12 max-w-md transition-all duration-700 ${showContent
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-10 scale-90'
                    }`}
            >
                {/* Large emoji */}
                <div className="text-7xl md:text-8xl mb-8 animate-bounce" style={{ animationDuration: '0.8s' }}>
                    🎉
                </div>

                {/* Welcome text */}
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                    স্বাগতম, <span className="text-emerald-400">{userName}</span>!
                </h1>
                <p className="text-lg md:text-xl text-emerald-300/90 font-semibold mb-3">
                    Welcome to KANGAL 🐐
                </p>
                <p className="text-white/50 text-sm mb-10">
                    Make your messy life easier
                </p>

                {/* Glowing rings */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                    <div className="w-56 h-56 rounded-full border-2 border-emerald-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                    <div className="absolute w-72 h-72 rounded-full border border-emerald-400/10 animate-ping" style={{ animationDuration: '3.5s' }} />
                </div>

                {/* Tap to continue */}
                <p className="text-white/30 text-xs animate-pulse tracking-wide">
                    TAP ANYWHERE TO CONTINUE
                </p>
            </div>

            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-20vh) translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                    80% {
                        opacity: 0.8;
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
