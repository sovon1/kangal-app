'use server';

import { getSupabaseServerClient } from '../supabase/server';

export async function submitFeedback(formData: FormData) {
    const supabase = await getSupabaseServerClient();

    const name = formData.get('name')?.toString() || null;
    const email = formData.get('email')?.toString() || null;
    const message = formData.get('message')?.toString();

    if (!message) {
        return { success: false, error: 'Message is required' };
    }

    // We try to securely get the user ID if they happen to be logged in
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('feedback')
        .insert({
            name,
            email,
            message,
            user_id: user?.id || null,
        });

    if (error) {
        console.error('Error submitting feedback:', error);
        return { success: false, error: 'Failed to submit feedback. Please try again later.' };
    }

    return { success: true };
}
