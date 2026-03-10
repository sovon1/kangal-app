'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                // Check for updates periodically
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available
                            toast('🔄 Update available!', {
                                description: 'Tap to refresh and get the latest version.',
                                action: {
                                    label: 'Refresh',
                                    onClick: () => {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload();
                                    },
                                },
                                duration: 10000,
                            });
                        }
                    });
                });
            } catch (error) {
                console.error('SW registration failed:', error);
            }
        };

        registerSW();

        // Online/offline status toasts
        const handleOnline = () => {
            toast.success('🟢 Back online!', {
                description: 'Your connection has been restored.',
                duration: 3000,
            });
        };

        const handleOffline = () => {
            toast.error('🔴 Offline', {
                description: 'You\'re currently offline. Some features may be limited.',
                duration: 5000,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return null;
}
