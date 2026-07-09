import { addBazaarExpense } from '@/lib/actions/bazaar';
import { toast } from 'sonner';

export interface QueuedAction {
    id: string;
    type: 'ADD_BAZAAR';
    payload: unknown;
    options?: {
        depositForShopper?: boolean;
        depositMemberId?: string;
    };
    timestamp: number;
}

const QUEUE_KEY = 'kangal-offline-actions-queue';

export function getOfflineQueue(): QueuedAction[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function queueOfflineAction(
    type: 'ADD_BAZAAR',
    payload: unknown,
    options?: {
        depositForShopper?: boolean;
        depositMemberId?: string;
    }
) {
    if (typeof window === 'undefined') return;
    const queue = getOfflineQueue();
    const newAction: QueuedAction = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        payload,
        options,
        timestamp: Date.now()
    };
    queue.push(newAction);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

let isProcessing = false;

export async function processOfflineQueue() {
    if (typeof window === 'undefined') return;
    if (isProcessing) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    isProcessing = true;
    const remainingQueue: QueuedAction[] = [];
    let successCount = 0;

    toast.loading(`Syncing ${queue.length} offline actions... 🔄`, { id: 'offline-sync' });

    for (const action of queue) {
        try {
            if (action.type === 'ADD_BAZAAR') {
                const res = await addBazaarExpense(action.payload, action.options);
                if (res && typeof res === 'object' && 'error' in res && res.error) {
                    console.error('Failed to sync offline expense:', res.error);
                    remainingQueue.push(action);
                } else {
                    successCount++;
                    window.dispatchEvent(new CustomEvent('bazaar-expense-added'));
                }
            }
        } catch (error) {
            console.error('Network error during offline sync:', error);
            remainingQueue.push(action);
        }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    isProcessing = false;

    if (successCount > 0) {
        toast.success(`সরাসরি ${successCount}টি অফলাইন খরচ সিঙ্ক করা হয়েছে! ⚡`, { id: 'offline-sync', duration: 4000 });
    } else if (remainingQueue.length > 0) {
        toast.error(`অফলাইন খরচ সিঙ্ক ব্যর্থ হয়েছে, পরবর্তীতে চেষ্টা করা হবে।`, { id: 'offline-sync' });
    } else {
        toast.dismiss('offline-sync');
    }
}
