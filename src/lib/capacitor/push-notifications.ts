import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { isNativePlatform, isPluginAvailable } from './index';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Initialize push notifications — only runs on native platforms
 * Call this once when the app starts (inside a useEffect)
 */
export async function initializePushNotifications(): Promise<void> {
    if (!isNativePlatform() || !isPluginAvailable('PushNotifications')) {
        console.log('[Push] Not on native platform, skipping push notification setup');
        return;
    }

    // Check / request permission
    let permissionStatus = await PushNotifications.checkPermissions();

    if (permissionStatus.receive === 'prompt') {
        permissionStatus = await PushNotifications.requestPermissions();
    }

    if (permissionStatus.receive !== 'granted') {
        console.warn('[Push] Permission not granted');
        return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // --- Event Listeners ---

    // When registration is successful, save the FCM token
    PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Push] Registration successful, token:', token.value);
        await saveFCMToken(token.value);
    });

    // When registration fails
    PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
    });

    // When a notification is received while the app is in the foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Push] Notification received in foreground:', notification);
        // The notification will be shown automatically based on presentationOptions in config
    });

    // When the user taps on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[Push] Notification action performed:', action);

        // Navigate based on notification data
        const data = action.notification.data;
        if (data?.url) {
            window.location.href = data.url;
        } else if (data?.type) {
            handleNotificationNavigation(data.type);
        }
    });
}

/**
 * Save the FCM token to Supabase so the server can send push notifications
 */
async function saveFCMToken(token: string): Promise<void> {
    try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('[Push] No authenticated user, cannot save token');
            return;
        }

        // Upsert the token — update if user already has one, insert if new
        const { error } = await supabase
            .from('push_tokens')
            .upsert(
                {
                    user_id: user.id,
                    token: token,
                    platform: 'android',
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,platform',
                }
            );

        if (error) {
            console.error('[Push] Error saving FCM token:', error);
        } else {
            console.log('[Push] FCM token saved successfully');
        }
    } catch (err) {
        console.error('[Push] Error in saveFCMToken:', err);
    }
}

/**
 * Remove push notification listeners and unregister (call on logout)
 */
export async function teardownPushNotifications(): Promise<void> {
    if (!isNativePlatform() || !isPluginAvailable('PushNotifications')) {
        return;
    }

    try {
        await PushNotifications.removeAllListeners();
        // Optionally remove the token from Supabase
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await supabase
                .from('push_tokens')
                .delete()
                .eq('user_id', user.id)
                .eq('platform', 'android');
        }
    } catch (err) {
        console.error('[Push] Error in teardown:', err);
    }
}

/**
 * Navigate to the appropriate page based on the notification type
 */
function handleNotificationNavigation(type: string): void {
    switch (type) {
        case 'deposit':
        case 'cost':
        case 'finance':
            window.location.href = '/dashboard/finance';
            break;
        case 'meal':
            window.location.href = '/dashboard/meals';
            break;
        case 'announcement':
        case 'general':
            window.location.href = '/dashboard';
            break;
        case 'bazaar':
            window.location.href = '/dashboard/bazaar';
            break;
        default:
            window.location.href = '/dashboard';
            break;
    }
}
