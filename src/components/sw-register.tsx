'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator
        ) {
            let refreshing = false;

            // Handle updates
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            // Register SW
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then((registration) => {
                    // Register Background Sync if supported
                    if ('sync' in registration) {
                        (registration as any).sync.register('sync-data').catch((err: any) => {
                            console.log('Background sync registration failed:', err);
                        });
                    }

                    // Register Periodic Background Sync if supported
                    if ('periodicSync' in registration) {
                        navigator.permissions.query({
                            name: 'periodic-background-sync' as PermissionName
                        }).then((status) => {
                            if (status.state === 'granted') {
                                (registration as any).periodicSync.register('sync-updates', {
                                    minInterval: 24 * 60 * 60 * 1000
                                }).catch((err: any) => {
                                    console.log('Periodic sync registration failed:', err);
                                });
                            }
                        }).catch(() => {});
                    }

                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // Let the user know there's an update
                                    toast('Update Available 🚀', {
                                        description: 'A new version of Kangal is ready! Click refresh.',
                                        action: {
                                            label: 'Refresh',
                                            onClick: () => {
                                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                            },
                                        },
                                        duration: 8000,
                                    });
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });

            // Handle online/offline events
            const handleOnline = () => {
                toast.success('You are back online! 🟢', { id: 'network-status' });
            };
            const handleOffline = () => {
                toast.error('You are offline 🔴', {
                    description: 'Using cached data.',
                    id: 'network-status',
                    duration: 5000
                });
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    return null;
}
