'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, User, LogOut, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const [profile, setProfile] = useState<{ fullName: string; email: string; phone: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            const { data } = await supabase.from('profiles').select('full_name, email, phone').eq('id', user.id).single();
            if (data) setProfile({ fullName: data.full_name, email: data.email, phone: data.phone || '' });
            setLoading(false);
        }
        load();
    }, [supabase]);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaving(false); return; }

        const { error } = await supabase.from('profiles').update({
            full_name: profile.fullName,
            phone: profile.phone || null,
        }).eq('id', user.id);

        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success('Profile updated!');
        router.refresh();
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-lg mx-auto">
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-64 bg-muted animate-pulse rounded-xl" />
            </div>
        );
    }

    const initials = profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Manage your profile and preferences</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{profile?.fullName}</CardTitle>
                            <CardDescription>{profile?.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={profile?.fullName || ''}
                            onChange={e => setProfile(p => p ? { ...p, fullName: e.target.value } : p)}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={profile?.email || ''} disabled className="h-11 bg-muted/50" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            value={profile?.phone || ''}
                            onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : p)}
                            placeholder="01XXXXXXXXX"
                            className="h-11"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="w-full h-11 gap-2">
                        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-destructive text-base">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={handleSignOut} className="w-full gap-2">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
