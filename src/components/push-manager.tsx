'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check if Push is supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            setIsLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
            setPermission(Notification.permission);
        } catch (error) {
            console.error('Error checking push subscription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const subscribeToPush = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            // Request browser permission
            const currentPerm = await Notification.requestPermission();
            setPermission(currentPerm);

            if (currentPerm !== 'granted') {
                toast.error('Permission Denied', {
                    description: 'Please enable notifications in your browser settings to receive updates.',
                });
                setIsLoading(false);
                return;
            }

            // Subscribe to Push Manager using our public VAPID key
            const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string);
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            // Send subscription to our backend
            const response = await fetch('/api/web-push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub),
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription on server');
            }

            setSubscription(sub);
            toast.success('Notifications Enabled! 🎉', {
                description: 'You will now receive automatic updates on your native device.',
            });
        } catch (error) {
            console.error('Push subscription failed:', error);
            toast.error('Failed to enable notifications. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setIsLoading(true);
        try {
            if (subscription) {
                await subscription.unsubscribe();
                // We should also delete from database, but for now just removing local sub works
            }
            setSubscription(null);
            toast.info('Notifications Disabled', {
                description: 'You will no longer receive automatic updates.',
            });
        } catch (error) {
            console.error('Error unsubscribing:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border opacity-50">
                <BellOff className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                    <span className="text-sm font-medium">Notifications Not Supported</span>
                    <span className="text-xs text-muted-foreground">Your browser does not support Web Push.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-4 p-4 bg-background border rounded-xl shadow-sm">
            <div className="flex items-start gap-4 flex-1">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${subscription ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {subscription ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm">
                        Push Notifications
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                        {subscription
                            ? "Active. You will receive real-time alerts for meals and costs."
                            : permission === 'denied'
                                ? "Blocked by browser. Please enable site permissions."
                                : "Enable native alerts for important updates and mess activity."}
                    </span>
                </div>
            </div>

            <Button
                variant={subscription ? "outline" : "default"}
                size="sm"
                onClick={subscription ? unsubscribeFromPush : subscribeToPush}
                disabled={isLoading || permission === 'denied'}
                className="w-[110px]"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : subscription ? (
                    'Disable'
                ) : (
                    'Enable'
                )}
            </Button>
        </div>
    );
}
