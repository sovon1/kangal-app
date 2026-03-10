import webpush from 'web-push';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Configure Web Push with our VAPID keys
// This requires the keys to be present in .env
webpush.setVapidDetails(
    'mailto:hello@kangal-app.com', // Need a valid email for VAPID contact
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
);

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
}

/**
 * Sends a push notification to all users in a specific mess.
 * Excludes the user who triggered the action.
 * 
 * @param messId - The ID of the mess
 * @param triggerUserId - The ID of the user who performed the action (will not receive the notification)
 * @param payload - The notification content (title, body, etc.)
 */
export async function sendNotificationToMess(messId: string, triggerUserId: string, payload: PushPayload) {
    try {
        const supabase = await getSupabaseServerClient();

        // 1. Get all active members of the mess (excluding the trigger user)
        const { data: members, error: membersError } = await supabase
            .from('mess_members')
            .select('user_id')
            .eq('mess_id', messId)
            .eq('status', 'active')
            .neq('user_id', triggerUserId);

        if (membersError || !members || members.length === 0) {
            console.log('No eligible members found to notify.');
            return { success: false, reason: 'No members' };
        }

        const userIds = members.map(m => m.user_id);

        // 2. Fetch all valid push subscriptions for these users
        const { data: subscriptions, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (subsError || !subscriptions || subscriptions.length === 0) {
            console.log('No push subscriptions found for these members.');
            return { success: false, reason: 'No subscriptions' };
        }

        console.log(`Sending Web Push to ${subscriptions.length} devices...`);

        // 3. Send the push notification to each subscription asynchronously
        const notifications = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                }
            };

            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .catch(err => {
                    console.error('Failed to send notification to endpoint:', sub.endpoint);
                    // If the subscription is no longer valid (e.g. user revoked permission),
                    // the push service will return a 410 Gone or 404 Not Found error.
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log('Removing dead subscription from database...');
                        // Best practice is to delete dead subscriptions
                        supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint).then();
                    }
                });
        });

        await Promise.allSettled(notifications);
        return { success: true, count: subscriptions.length };

    } catch (error) {
        console.error('Error in sendNotificationToMess:', error);
        return { success: false, error };
    }
}
