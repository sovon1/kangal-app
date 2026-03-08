'use client';

import { useEffect, useRef } from 'react';
import { initializePushNotifications } from '@/lib/capacitor/push-notifications';
import { isNativePlatform } from '@/lib/capacitor';

/**
 * Provider component that initializes Capacitor push notifications.
 * Only runs on native platforms (Android/iOS), no-ops on web.
 * 
 * Place this inside the Providers component so it has access to the app context.
 */
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
    const initialized = useRef(false);

    useEffect(() => {
        // Only initialize once and only on native platforms
        if (initialized.current) return;

        // Dynamically check if we're on a native platform
        // This prevents any Capacitor code from running in the browser
        const setupPush = async () => {
            try {
                if (isNativePlatform()) {
                    await initializePushNotifications();
                    console.log('[PushProvider] Push notifications initialized');
                }
            } catch (error) {
                console.error('[PushProvider] Failed to initialize push notifications:', error);
            }
        };

        initialized.current = true;
        setupPush();
    }, []);

    return <>{children}</>;
}
