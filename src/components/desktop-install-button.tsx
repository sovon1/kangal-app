'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function DesktopInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

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

    // Only show button if we have a prompt available and it's not already installed
    if (isInstalled || !deferredPrompt) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleInstall}
            disabled={isInstalling}
            className="hidden md:flex items-center gap-2 h-9 px-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium"
        >
            {isInstalling ? (
                <>
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Installing...</span>
                </>
            ) : (
                <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Install App</span>
                </>
            )}
        </Button>
    );
}
