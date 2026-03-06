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
import { Input } from '@/components/ui/input';
import { Users, Crown, ChefHat, User, Copy, Check, UserPlus, Loader2, ArrowRightLeft, AlertTriangle, UserCog } from 'lucide-react';
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

    const [addManualOpen, setAddManualOpen] = useState(false);
    const [addManualStep, setAddManualStep] = useState<'warning1' | 'warning2' | 'form'>('warning1');
    const [addManualConfirm, setAddManualConfirm] = useState('');
    const [manualName, setManualName] = useState('');
    const [addingManual, setAddingManual] = useState(false);

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
                .select('id, role, status, join_date, is_manual, manual_name, profile:profiles(full_name, email)')
                .eq('mess_id', ctx.messId)
                .eq('status', 'active')
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

    const handleAddManual = async () => {
        if (!ctx || !manualName.trim()) return;
        setAddingManual(true);

        // Dynamically import to avoid cluttering the top imports if it's rarely used
        const { addManualMember } = await import('@/lib/actions/mess');
        const result = await addManualMember({
            messId: ctx.messId,
            manualName: manualName.trim(),
        });

        setAddingManual(false);
        if ('error' in result) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed to add manual member');
            return;
        }

        toast.success('Manual member added!');
        setAddManualOpen(false);
        setManualName('');
        queryClient.invalidateQueries({ queryKey: ['all-members'] });
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
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => { setAddManualStep('warning1'); setAddManualConfirm(''); setAddManualOpen(true); }} className="gap-2">
                            <UserCog className="h-4 w-4" /> Add Manual Member
                        </Button>
                        <Button variant="outline" onClick={() => setTransferOpen(true)} className="gap-2">
                            <ArrowRightLeft className="h-4 w-4" /> Transfer Manager
                        </Button>
                    </div>
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
                        const isManual = Boolean(m.is_manual);
                        const name = isManual ? (m.manual_name as string) : ((profile?.full_name as string) || 'Unknown');
                        const email = isManual ? 'Offline Member' : ((profile?.email as string) || '');
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
                                    <div className="flex items-center gap-2">
                                        {isManual && <Badge variant="outline" className="text-[10px] bg-muted/50">Manual</Badge>}
                                        <Badge variant="secondary" className={`gap-1 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                                            <Icon className="h-3 w-3" />
                                            {role}
                                        </Badge>
                                    </div>
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

            {/* Add Manual Member Dialog */}
            <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
                <DialogContent className="sm:max-w-md">
                    {addManualStep === 'warning1' ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" /> Warning
                                </DialogTitle>
                                <DialogDescription className="text-red-600 font-medium leading-relaxed">
                                    দয়া করে শুধুমাত্র যাদের স্মার্টফোন বা কম্পিউটার নেই তাদেরকেই ম্যানুয়াল মেম্বার হিসেবে অ্যাড করুন। কারণ তাদের প্রতিদিনের মিল আপডেট করা ম্যানেজারের জন্য একটি কষ্টকর কাজ। অন্যদেরকে অ্যাকাউন্ট খুলে ইনভাইট কোড দিয়ে জয়েন করতে বলুন।
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <div className="bg-muted/50 p-3 rounded-md text-center border">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Mess Invite Code</p>
                                    <p className="font-mono font-bold text-xl">{ctx?.inviteCode || 'N/A'}</p>
                                </div>
                                <Button
                                    className="w-full h-11"
                                    onClick={() => setAddManualStep('warning2')}
                                >
                                    I understand, proceed
                                </Button>
                            </div>
                        </>
                    ) : addManualStep === 'warning2' ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" /> Final Confirmation
                                </DialogTitle>
                                <DialogDescription className="text-red-600 font-medium leading-relaxed">
                                    You are about to add a manual member. Please confirm you understand this means extra work for you to manage their account.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">To proceed, please type <span className="font-bold font-mono bg-muted px-1.5 py-0.5 rounded text-red-600">add manual</span> below:</p>
                                    <Input
                                        placeholder="Type 'add manual'"
                                        value={addManualConfirm}
                                        onChange={(e) => setAddManualConfirm(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <Button
                                    className="w-full h-11"
                                    variant="destructive"
                                    onClick={() => setAddManualStep('form')}
                                    disabled={addManualConfirm.trim().toLowerCase() !== 'add manual'}
                                >
                                    Confirm adding manual member
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <UserCog className="h-5 w-5" /> Add Manual Member
                                </DialogTitle>
                                <DialogDescription>
                                    Create an offline member without an account. You can track their meals, deposits, and balances manually.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Full Name (e.g. John Doe)"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>

                                <Button
                                    className="w-full h-11"
                                    onClick={handleAddManual}
                                    disabled={addingManual || manualName.trim().length < 2}
                                >
                                    {addingManual ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                                    ) : (
                                        <><UserPlus className="mr-2 h-4 w-4" /> Add Offline Member</>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
