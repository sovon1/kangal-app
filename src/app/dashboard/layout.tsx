import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { MessProvider, type MessContextValue } from '@/components/mess-context';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await getSupabaseServerClient();

    // Get current user profile and mess membership
    const { data: { user } } = await supabase.auth.getUser();

    let userName = 'User';
    let userRole: 'manager' | 'member' | 'cook' = 'member';
    let messCtx: MessContextValue | null = null;

    if (user) {
        // Fetch profile + membership in parallel
        const [profileRes, membershipRes] = await Promise.all([
            supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single(),
            supabase
                .from('mess_members')
                .select('id, mess_id, role')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .limit(1)
                .single(),
        ]);

        if (profileRes.data) {
            userName = profileRes.data.full_name;
        }

        if (membershipRes.data) {
            const m = membershipRes.data;
            userRole = m.role as 'manager' | 'member' | 'cook';

            // Get the active cycle for this mess
            const { data: cycle } = await supabase
                .from('mess_cycles')
                .select('id')
                .eq('mess_id', m.mess_id)
                .eq('status', 'open')
                .limit(1)
                .single();

            if (cycle) {
                messCtx = {
                    userId: user.id,
                    memberId: m.id,
                    messId: m.mess_id,
                    cycleId: cycle.id,
                    role: userRole,
                };
            }
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar userName={userName} userRole={userRole} />
            <main className="max-w-7xl mx-auto px-4 py-6">
                <MessProvider value={messCtx}>
                    {children}
                </MessProvider>
            </main>
        </div>
    );
}
