import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await getSupabaseServerClient();

    // Get current user profile and mess membership
    const { data: { user } } = await supabase.auth.getUser();

    let userName = 'User';
    let userRole: 'manager' | 'member' | 'cook' = 'member';

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        if (profile) {
            userName = profile.full_name;
        }

        // Get their role in their active mess
        const { data: membership } = await supabase
            .from('mess_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .single();

        if (membership) {
            userRole = membership.role as 'manager' | 'member' | 'cook';
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar userName={userName} userRole={userRole} />
            <main className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
