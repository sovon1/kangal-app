'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { transferManager } from '@/lib/actions/mess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Crown, ChefHat, User, Copy, Check, UserPlus, Loader2, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useMessContext } from '@/components/mess-context';

const ROLE_ICONS = { manager: Crown, cook: ChefHat, member: User };
const ROLE_COLORS = { manager: 'text-amber-500 bg-amber-500/10', cook: 'text-blue-500 bg-blue-500/10', member: 'text-slate-500 bg-slate-500/10' };

export default function MembersPage() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const router = useRouter();
    const messCtx = useMessContext();
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [selectedNewManager, setSelectedNewManager] = useState('');
    const [transferring, setTransferring] = useState(false);

    // Build ctx from MessContext + fetched invite code
    const ctx = messCtx ? { messId: messCtx.messId, inviteCode, memberId: messCtx.memberId, role: messCtx.role } : null;

    // Only fetch invite code (extra data not in context)
    useEffect(() => {
        if (!messCtx) return;
        async function loadInviteCode() {
            const { data: mess } = await supabase.from('messes').select('invite_code').eq('id', messCtx!.messId).single();
            if (mess?.invite_code) setInviteCode(mess.invite_code);
        }
        loadInviteCode();
    }, [messCtx?.messId, supabase]);

    const isManager = ctx?.role === 'manager';

    const membersQuery = useQuery({
        queryKey: ['all-members', ctx?.messId],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase
                .from('mess_members')
                .select('id, role, status, join_date, profile:profiles(full_name, email)')
                .eq('mess_id', ctx.messId)
                .order('role', { ascending: true });
            return data || [];
        },
        enabled: !!ctx,
    });

    const handleCopy = async () => {
        if (ctx?.inviteCode) {
            await navigator.clipboard.writeText(ctx.inviteCode);
            setCopied(true);
            toast.success('Invite code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleTransfer = async () => {
        if (!ctx || !selectedNewManager) return;

        const confirmed = window.confirm(
            'Are you sure you want to transfer the manager role? You will become a regular member and lose admin access.'
        );
        if (!confirmed) return;

        setTransferring(true);
        const result = await transferManager({
            messId: ctx.messId,
            newManagerMemberId: selectedNewManager,
        });
        setTransferring(false);

        if ('error' in result) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to transfer');
            return;
        }

        toast.success('Manager role transferred!');
        setTransferOpen(false);
        setSelectedNewManager('');
        queryClient.invalidateQueries({ queryKey: ['all-members'] });
        // Refresh the page since the user's role changed
        router.refresh();
        window.location.reload();
    };

    const activeCount = (membersQuery.data || []).filter((m: Record<string, unknown>) => m.status === 'active').length;
    const otherMembers = (membersQuery.data || []).filter((m: Record<string, unknown>) => m.id !== ctx?.memberId && m.status === 'active');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage your mess members</p>
                </div>
                {isManager && (
                    <Button variant="outline" onClick={() => setTransferOpen(true)} className="gap-2">
                        <ArrowRightLeft className="h-4 w-4" /> Transfer Manager
                    </Button>
                )}
            </div>

            {/* Invite Code Card */}
            {ctx && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <UserPlus className="h-3 w-3" /> Invite Code
                                </p>
                                <p className="text-xl font-mono font-bold tracking-widest mt-1">{ctx.inviteCode}</p>
                            </div>
                            <Button variant="outline" size="icon" onClick={handleCopy} className="h-10 w-10">
                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Share this code to invite new members</p>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" /> {activeCount} active members
                </Badge>
            </div>

            {/* Members List */}
            {membersQuery.isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
                <div className="space-y-2">
                    {(membersQuery.data || []).map((m: Record<string, unknown>) => {
                        const profile = m.profile as Record<string, unknown>;
                        const name = (profile?.full_name as string) || 'Unknown';
                        const email = (profile?.email as string) || '';
                        const role = (m.role as string) || 'member';
                        const Icon = ROLE_ICONS[role as keyof typeof ROLE_ICONS] || User;
                        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        const isMe = m.id === ctx?.memberId;

                        return (
                            <Card key={m.id as string} className={`hover:shadow-sm transition-shadow ${isMe ? 'border-primary/30' : ''}`}>
                                <CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className={`text-xs font-semibold ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {name} {isMe && <span className="text-xs text-muted-foreground">(You)</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={`gap-1 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                                        <Icon className="h-3 w-3" />
                                        {role}
                                    </Badge>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Transfer Manager Dialog */}
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5" /> Transfer Manager Role
                        </DialogTitle>
                        <DialogDescription>
                            Choose a member to become the new manager. You will be demoted to a regular member.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                This will immediately transfer all manager privileges. You will lose access to admin features.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Select value={selectedNewManager} onValueChange={setSelectedNewManager}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Select new manager" /></SelectTrigger>
                                <SelectContent>
                                    {otherMembers.map((m: Record<string, unknown>) => {
                                        const profile = m.profile as Record<string, unknown>;
                                        return (
                                            <SelectItem key={m.id as string} value={m.id as string}>
                                                {(profile?.full_name as string) || 'Unknown'}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full h-11"
                            variant="destructive"
                            onClick={handleTransfer}
                            disabled={transferring || !selectedNewManager}
                        >
                            {transferring ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</>
                            ) : (
                                <><ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Manager Role</>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
