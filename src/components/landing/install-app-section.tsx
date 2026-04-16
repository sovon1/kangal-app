'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppSection() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const SHOW_LIMIT_KEY = 'kangal-banner-last-shown';
        const DISMISS_KEY = 'kangal-banner-dismissed';
        
        // 1. If explicitly dismissed, don't show for 3 days
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && Date.now() - parseInt(dismissedAt) < 3 * 24 * 60 * 60 * 1000) {
            return;
        }

        // 2. Rate limit: Only show once per day overall
        const lastShownAt = localStorage.getItem(SHOW_LIMIT_KEY);
        if (lastShownAt && Date.now() - parseInt(lastShownAt) < 24 * 60 * 60 * 1000) {
            return;
        }

        // We passed the checks, safe to render it. Record the show time.
        localStorage.setItem(SHOW_LIMIT_KEY, Date.now().toString());
        setShouldRender(true);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleDismiss = () => {
        setShouldRender(false);
        localStorage.setItem('kangal-banner-dismissed', Date.now().toString());
    };

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setIsInstalling(true);

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
        } catch {
            // Silently handle errors
        }

        setIsInstalling(false);
        setDeferredPrompt(null);
    };

    // Don't show if already installed or rate-limited
    if (isInstalled || !shouldRender) return null;

    // If no prompt available, show manual install instructions
    const showManualInstructions = !deferredPrompt;

    return (
        <section className="md:hidden px-4 py-3">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/5">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 z-10 p-1 rounded-full bg-background/50 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="px-5 py-6">
                    <div className="flex items-start gap-4">
                        {/* App Icon */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
                            <span className="text-2xl">🐐</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base">KANGAL App ইনস্টল করুন</h3>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 text-white uppercase tracking-wider">
                                    Free
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                ফোনে অ্যাপ হিসেবে ইনস্টল করুন — ফাস্ট, নেটিভ ফিল, অফলাইন সাপোর্ট!
                            </p>
                        </div>
                    </div>

                    {/* Features row */}
                    <div className="flex items-center gap-3 mt-4 mb-4">
                        {[
                            { icon: '⚡', label: 'Fast' },
                            { icon: '📱', label: 'Native Feel' },
                            { icon: '🔔', label: 'Offline' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{f.icon}</span>
                                <span>{f.label}</span>
                            </div>
                        ))}
                    </div>

                    {deferredPrompt ? (
                        <Button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="w-full h-11 text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
                        >
                            {isInstalling ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Installing...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    এখনই ইনস্টল করুন
                                </>
                            )}
                        </Button>
                    ) : showManualInstructions ? (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                <Smartphone className="h-3.5 w-3.5" />
                                ম্যানুয়ালি ইনস্টল করুন:
                            </p>
                            <div className="flex items-start gap-2 text-xs text-muted-foreground/80 bg-muted/30 rounded-lg p-3">
                                <span className="flex-shrink-0 mt-0.5">👉</span>
                                <p>
                                    Chrome-এ <strong>⋮</strong> মেনু &rarr; <strong>&quot;Add to Home screen&quot;</strong> / <strong>&quot;Install app&quot;</strong> ট্যাপ করুন
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
