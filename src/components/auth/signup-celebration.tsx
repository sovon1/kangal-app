'use client';

import { useEffect, useState, useRef } from 'react';

interface ConfettiPiece {
    id: number;
    x: number;
    size: number;
    color: string;
    delay: number;
    duration: number;
    drift: number;
    rotation: number;
    type: 'square' | 'circle' | 'ribbon';
}

const CONFETTI_COLORS = [
    '#10b981', '#34d399', '#6ee7b7', // emerald shades
    '#f59e0b', '#fbbf24', '#fcd34d', // amber shades
    '#3b82f6', '#60a5fa',             // blue
    '#ec4899', '#f472b6',             // pink
    '#8b5cf6', '#a78bfa',             // purple
];

export function SignupCelebration({
    userName,
    onComplete,
}: {
    userName: string;
    onComplete: () => void;
}) {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
    const generated = useRef(false);

    useEffect(() => {
        if (generated.current) return;
        generated.current = true;

        // Generate confetti pieces
        const pieces: ConfettiPiece[] = [];
        for (let i = 0; i < 50; i++) {
            const types: ConfettiPiece['type'][] = ['square', 'circle', 'ribbon'];
            pieces.push({
                id: i,
                x: Math.random() * 100,
                size: 4 + Math.random() * 8,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                delay: Math.random() * 2.5,
                duration: 3 + Math.random() * 3,
                drift: (Math.random() - 0.5) * 100,
                rotation: Math.random() * 720,
                type: types[Math.floor(Math.random() * types.length)],
            });
        }
        setConfetti(pieces);

        // Animation phases
        const showTimer = setTimeout(() => setPhase('show'), 100);
        const exitTimer = setTimeout(() => {
            setPhase('exit');
            setTimeout(onComplete, 700);
        }, 3800);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(exitTimer);
        };
    }, [onComplete]);

    const handleClick = () => {
        if (phase !== 'exit') {
            setPhase('exit');
            setTimeout(onComplete, 700);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer transition-opacity duration-700 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}
            onClick={handleClick}
            style={{
                background: 'linear-gradient(160deg, #0c1222 0%, #0f1d2e 30%, #0a2a1f 60%, #0c1222 100%)',
            }}
        >
            {/* Ambient glow spots */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)' }}
            />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }}
            />

            {/* CSS Confetti */}
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute top-0 pointer-events-none animate-confetti"
                    style={{
                        left: `${piece.x}%`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                        '--drift': `${piece.drift}px`,
                        '--rotation': `${piece.rotation}deg`,
                    } as React.CSSProperties}
                >
                    <div
                        style={{
                            width: piece.type === 'ribbon' ? piece.size * 0.4 : piece.size,
                            height: piece.type === 'ribbon' ? piece.size * 2.5 : piece.size,
                            backgroundColor: piece.color,
                            borderRadius: piece.type === 'circle' ? '50%' : piece.type === 'ribbon' ? '2px' : '2px',
                            opacity: 0.85,
                        }}
                    />
                </div>
            ))}

            {/* Center card with glassmorphism */}
            <div
                className={`relative z-10 max-w-sm w-full mx-6 transition-all duration-700 ease-out ${phase === 'show' || phase === 'exit'
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-95'
                    }`}
            >
                {/* Glassmorphic card */}
                <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center overflow-hidden shadow-2xl shadow-emerald-500/10">
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-amber-500/5 pointer-events-none" />

                    {/* Sparkle decoration */}
                    <div className="absolute top-4 right-6 text-amber-400/60 animate-pulse text-lg">✦</div>
                    <div className="absolute top-8 left-8 text-emerald-400/40 animate-pulse text-sm" style={{ animationDelay: '0.5s' }}>✦</div>
                    <div className="absolute bottom-6 right-10 text-blue-400/30 animate-pulse text-xs" style={{ animationDelay: '1s' }}>✦</div>

                    {/* Party emoji with glow ring */}
                    <div className="relative mx-auto w-20 h-20 mb-6">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center">
                            <span className="text-4xl">🎉</span>
                        </div>
                    </div>

                    {/* Welcome text */}
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight relative z-10">
                        স্বাগতম!
                    </h1>
                    <p className="text-2xl font-bold text-emerald-400 mb-4 relative z-10">
                        {userName}
                    </p>

                    {/* Divider */}
                    <div className="mx-auto w-16 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

                    <p className="text-white/70 text-sm font-medium mb-1 relative z-10">
                        Welcome to KANGAL 🐐
                    </p>
                    <p className="text-white/40 text-xs relative z-10">
                        Make your messy life easier
                    </p>

                    {/* Bottom tap hint */}
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <div className="w-8 h-0.5 bg-white/10 rounded-full" />
                        <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase font-medium">
                            tap to continue
                        </p>
                        <div className="w-8 h-0.5 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-10vh) translateX(0) rotate(0deg) scale(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                        transform: translateY(0vh) translateX(0) rotate(0deg) scale(1);
                    }
                    100% {
                        transform: translateY(105vh) translateX(var(--drift)) rotate(var(--rotation)) scale(0.6);
                        opacity: 0;
                    }
                }
                .animate-confetti {
                    animation: confetti-fall ease-out forwards;
                }
            `}</style>
        </div>
    );
}
