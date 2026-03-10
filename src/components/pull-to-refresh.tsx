'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

const FOOD_EMOJIS = ['🍚', '🥘', '🍛', '🥗', '🍲'];

export function PullToRefresh({ children }: { children: ReactNode }) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentEmoji, setCurrentEmoji] = useState(0);
    const startY = useRef(0);
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only activate when scrolled to top
        if (window.scrollY > 5 || isRefreshing) return;
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
    }, [isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && window.scrollY <= 0) {
            // Rubber band effect — diminishing returns
            const dampened = Math.min(diff * 0.5, MAX_PULL);
            setPullDistance(dampened);
            setCurrentEmoji(Math.floor((dampened / MAX_PULL) * FOOD_EMOJIS.length) % FOOD_EMOJIS.length);

            if (dampened > 10) {
                e.preventDefault();
            }
        }
    }, [isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (pullDistance >= PULL_THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(PULL_THRESHOLD * 0.6);

            // Perform refresh
            try {
                await queryClient.invalidateQueries();
                router.refresh();
            } catch {
                // Silently handle errors
            }

            // Minimum visible refresh time
            await new Promise((r) => setTimeout(r, 800));
            setIsRefreshing(false);
        }

        setPullDistance(0);
    }, [pullDistance, queryClient, router]);

    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const readyToRefresh = pullDistance >= PULL_THRESHOLD;

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
            style={{ touchAction: pullDistance > 10 ? 'none' : 'auto' }}
        >
            {/* Pull indicator */}
            <div
                className="absolute left-0 right-0 flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out z-10"
                style={{
                    height: pullDistance > 0 || isRefreshing ? `${Math.max(pullDistance, isRefreshing ? 48 : 0)}px` : '0px',
                    top: 0,
                }}
            >
                <div className="flex flex-col items-center gap-1">
                    <span
                        className={`text-2xl transition-transform duration-200 ${isRefreshing ? 'animate-bounce' : ''}`}
                        style={{
                            transform: `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
                        }}
                    >
                        {isRefreshing ? '🔄' : readyToRefresh ? '🍛' : FOOD_EMOJIS[currentEmoji]}
                    </span>
                    {pullDistance > 30 && !isRefreshing && (
                        <span className="text-[10px] text-muted-foreground font-medium animate-in fade-in duration-200">
                            {readyToRefresh ? 'Release to refresh!' : 'Pull down to refresh'}
                        </span>
                    )}
                    {isRefreshing && (
                        <span className="text-[10px] text-primary font-medium animate-pulse">
                            Refreshing...
                        </span>
                    )}
                </div>
            </div>

            {/* Content with translate */}
            <div
                className="transition-transform duration-200 ease-out"
                style={{
                    transform: pullDistance > 0 || isRefreshing
                        ? `translateY(${Math.max(pullDistance, isRefreshing ? 48 : 0)}px)`
                        : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
}
