'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { processOfflineQueue } from '@/lib/offline-queue';

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
    sync?: {
        register(tag: string): Promise<void>;
    };
    periodicSync?: {
        register(tag: string, options?: { minInterval: number }): Promise<void>;
    };
}

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
                    const reg = registration as ServiceWorkerRegistrationWithSync;

                    // Register Background Sync if supported
                    if (reg.sync) {
                        reg.sync.register('sync-data').catch((err: unknown) => {
                            console.log('Background sync registration failed:', err);
                        });
                    }

                    // Register Periodic Background Sync if supported
                    if (reg.periodicSync) {
                        navigator.permissions.query({
                            name: 'periodic-background-sync' as PermissionName
                        }).then((status) => {
                            if (status.state === 'granted' && reg.periodicSync) {
                                reg.periodicSync.register('sync-updates', {
                                    minInterval: 24 * 60 * 60 * 1000
                                }).catch((err: unknown) => {
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
                processOfflineQueue();
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

            // Initial check on mount
            if (navigator.onLine) {
                processOfflineQueue();
            }

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    return null;
}
