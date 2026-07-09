'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function HeroMobileInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isInstalled, setIsInstalled] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(display-mode: standalone)').matches;
        }
        return false;
    });
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsAndroid(/android/i.test(navigator.userAgent));
        }

        const checkPrompt = () => {
            if ((window as any).deferredPrompt) {
                setDeferredPrompt((window as any).deferredPrompt as BeforeInstallPromptEvent);
            }
        };

        checkPrompt();

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('pwa-install-prompt-received', checkPrompt);
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('pwa-install-prompt-received', checkPrompt);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

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

    // Only render on mobile when the app is not installed
    if (isInstalled) return null;

    // For Android, we show the direct APK download link immediately
    if (isAndroid) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full sm:hidden mt-2"
            >
                <a href="/kangal.apk" download="kangal.apk" className="block w-full">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full h-12 px-8 text-lg gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 border border-emerald-500/20"
                    >
                        <Download className="h-5 w-5" />
                        Download KANGAL App (APK)
                    </Button>
                </a>
            </motion.div>
        );
    }

    // Fallback to PWA prompt for other mobile OS (if supported)
    if (!deferredPrompt) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full sm:hidden mt-2"
        >
            <Button
                onClick={handleInstall}
                disabled={isInstalling}
                variant="secondary"
                size="lg"
                className="w-full h-12 px-8 text-lg gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 border border-emerald-500/20"
            >
                <Download className="h-5 w-5" />
                {isInstalling ? 'Installing...' : 'Install KANGAL App'}
            </Button>
        </motion.div>
    );
}
