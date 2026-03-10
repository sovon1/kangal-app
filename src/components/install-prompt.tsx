'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Monitor, Zap, Wifi, Bell } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'kangal-install-dismissed';
const DISMISS_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if recently dismissed
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) {
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay for better UX
            setTimeout(() => setIsVisible(true), 2000);
        };

        const installedHandler = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        setIsInstalling(true);

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
        } catch {
            // silently handle
        }

        setIsInstalling(false);
        setIsVisible(false);
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    if (!isVisible || isInstalled || !deferredPrompt) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleDismiss}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end sm:justify-center pointer-events-none sm:p-4">
                <div className="pointer-events-auto w-full sm:max-w-md relative overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border/50 bg-background shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 ease-out">
                    {/* Decorative header gradient */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-transparent pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="relative px-6 pt-8 pb-6">
                        {/* App Icon + Title */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10">
                                <span className="text-4xl">🐐</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight mb-1">
                                KANGAL ইনস্টল করুন
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-[280px]">
                                অ্যাপটি ইনস্টল করে আরও ভালো এক্সপেরিয়েন্স পান!
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                                { icon: Zap, label: '২x ফাস্ট', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                { icon: Wifi, label: 'অফলাইন', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { icon: Bell, label: 'নোটিফিকেশন', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            ].map((f, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
                                    <div className={`p-2 rounded-lg ${f.bg}`}>
                                        <f.icon className={`h-4 w-4 ${f.color}`} />
                                    </div>
                                    <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Device indicator */}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                            <div className="hidden sm:flex items-center gap-1.5">
                                <Monitor className="h-3.5 w-3.5" />
                                <span>Desktop App হিসেবে ইনস্টল হবে</span>
                            </div>
                            <div className="flex sm:hidden items-center gap-1.5">
                                <Smartphone className="h-3.5 w-3.5" />
                                <span>Phone App হিসেবে ইনস্টল হবে</span>
                            </div>
                        </div>

                        {/* Install Button */}
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {isInstalling ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Installing...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    এখনই ইনস্টল করুন — Free
                                </>
                            )}
                        </button>

                        {/* Not now link */}
                        <button
                            onClick={handleDismiss}
                            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            এখন না, পরে করবো
                        </button>
                    </div>

                    {/* Bottom safe area on mobile */}
                    <div className="sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
                </div>
            </div>
        </>
    );
}
