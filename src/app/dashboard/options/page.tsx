'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { startNewMonth, getAllMonths, renameCycle, deleteMess } from '@/lib/actions/options';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    CalendarPlus,
    CalendarSearch,
    Trash2,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Pencil,
    X,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMessContext } from '@/components/mess-context';

export default function OptionsPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const messCtx = useMessContext();

    // Derived from context
    const user = messCtx ? { id: messCtx.userId } : null;
    const role = messCtx?.role || null;
    const messId = messCtx?.messId || null;
    const activeCycleId = messCtx?.cycleId || null;
    const [loading, setLoading] = useState(!messCtx);

    // Data State
    const [months, setMonths] = useState<{ id: string; name: string; status: string }[]>([]);

    // Form States
    const [newMonthName, setNewMonthName] = useState('');
    const [deleteMessName, setDeleteMessName] = useState('');
    const [messName, setMessName] = useState(''); // To verify delete

    // Editing State
    const [editingCycle, setEditingCycle] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Loading States
    const [submittingNewMonth, setSubmittingNewMonth] = useState(false);
    const [submittingDelete, setSubmittingDelete] = useState(false);
    const [refreshingMonths, setRefreshingMonths] = useState(false);

    useEffect(() => {
        if (!messCtx) return;
        async function loadExtra() {
            // Fetch mess name for delete confirmation
            const { data: mess } = await supabase.from('messes').select('name').eq('id', messCtx!.messId).single();
            if (mess) setMessName(mess.name || '');

            // Load months
            loadMonths(messCtx!.messId);
            setLoading(false);
        }
        loadExtra();
    }, [messCtx?.messId, supabase]);

    async function loadMonths(mId: string) {
        setRefreshingMonths(true);
        const result = await getAllMonths(mId);
        if (result.data) {
            setMonths(result.data);
        }
        setRefreshingMonths(false);
    }

    // Handlers
    async function handleStartNewMonth(e: React.FormEvent) {
        e.preventDefault();
        if (!messId || !activeCycleId) {
            toast.error("No active cycle found. You might need to create one first or the month is already closed.");
            return;
        }
        if (!newMonthName.trim()) {
            toast.error("Please enter a name for the new month");
            return;
        }

        setSubmittingNewMonth(true);
        const result = await startNewMonth(messId, activeCycleId, newMonthName);
        setSubmittingNewMonth(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(result.message);
            setNewMonthName('');
            loadMonths(messId);
            if (role === 'manager') {
                // If manager, we might want to reload to reflect the new cycle state globally
                router.refresh();
            }
        }
    }

    async function handleRenameCycle(cycleId: string) {
        if (!editName.trim()) return;

        const result = await renameCycle(cycleId, editName);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Month renamed successfully");
            setEditingCycle(null);
            loadMonths(messId!);
        }
    }

    async function handleDeleteMess(e: React.FormEvent) {
        e.preventDefault();
        if (!messId) return;

        // For manager, check default confirmation logic
        if (role === 'manager' && deleteMessName !== messName) {
            toast.error("Mess name does not match. Please type the exact mess name to confirm.");
            return;
        }

        const confirmText = role === 'manager'
            ? "Permanent Delete: Are you absolutely sure?"
            : "Request Delete: Are you sure you want to request this?";

        if (!window.confirm(confirmText)) return;

        setSubmittingDelete(true);
        const result = await deleteMess(messId);
        setSubmittingDelete(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            if (role === 'manager') {
                toast.success("Mess deleted. Redirecting...");
                router.push('/'); // Or login
            } else {
                toast.success(result.message);
            }
        }
    }

    if (loading) {
        return <div className="p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        </div>;
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Options</h1>
                <p className="text-muted-foreground text-sm">Manage mess cycles and settings</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">

                {/* 1. START NEW MONTH */}
                <Card className="border-border/50">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl text-red-500 font-bold">Start New Month</CardTitle>
                        <CardDescription>Start new month with new calculation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {role === 'manager' && (
                            <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 mb-4 text-xs text-orange-700 flex items-start gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <div>
                                    This will <strong>close the current month</strong> and create the next one immediately.
                                    <br />
                                    For a detailed summary before closing, go to <a href="/dashboard/admin/month-close" className="underline font-semibold hover:text-orange-900">Close Month</a>.
                                </div>
                            </div>
                        )}
                        <div className="text-center text-sm text-muted-foreground mb-4">
                            (নতুন মাস শুরু করুন। ⚠ নতুন মাস শুরু করার পর, পুরাতন কোনো মাসের হিসাব এডিট করা যাবে না তাই সাবধান)
                        </div>

                        <form onSubmit={handleStartNewMonth} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newMonthName">New Month Name</Label>
                                <Input
                                    id="newMonthName"
                                    placeholder="e.g. April 2027"
                                    value={newMonthName}
                                    onChange={(e) => setNewMonthName(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-red-500 hover:bg-red-600 text-white"
                                disabled={submittingNewMonth}
                            >
                                {submittingNewMonth && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {role === 'manager' ? 'Submit' : 'Submit for Approval'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* 2. DELETE MESS */}
                <Card className="border-border/50">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl text-red-500 font-bold">Delete Mess</CardTitle>
                        <CardDescription>Delete your current mess</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-muted-foreground mb-4">
                            Delete your current mess. all member will be removed, all data will be deleted. (মেস ডিলিট করলে মেসের সকল মাসের হিসাব ডিলিট হযে যাবে এবং সকল মেম্বার ও রিমুভ হয়ে যাবে, তাই ডিলেট করার পূর্বে অবশ্যই সিউর হযে নিন)
                        </div>

                        <form onSubmit={handleDeleteMess} className="space-y-4">
                            {role === 'manager' && (
                                <div className="space-y-2">
                                    <Label htmlFor="deleteMessName">Type Mess Name to Confirm: <span className="font-bold">{messName}</span></Label>
                                    <Input
                                        id="deleteMessName"
                                        placeholder={messName}
                                        value={deleteMessName}
                                        onChange={(e) => setDeleteMessName(e.target.value)}
                                    />
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-red-500 hover:bg-red-600 text-white"
                                disabled={submittingDelete || (role === 'manager' && deleteMessName !== messName)}
                            >
                                {submittingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {role === 'manager' ? 'Delete Mess' : 'Request Delete'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* 3. ALL MONTH LIST (Full width) */}
                <Card className="border-border/50 md:col-span-2">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl text-red-500 font-bold">Mess Month List</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {refreshingMonths ? (
                            <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                        ) : months.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No months found</div>
                        ) : (
                            months.map((month) => (
                                <div key={month.id} className="flex items-center justify-between p-4 bg-card border rounded-xl hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                                            <CalendarSearch className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            {editingCycle === month.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 w-48"
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleRenameCycle(month.id)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingCycle(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <h3 className="font-semibold">{month.name}</h3>
                                            )}

                                            {month.status === 'open' ? (
                                                <Badge className="bg-red-500 hover:bg-red-600 border-none text-white text-xs px-2 py-0 h-5">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-red-400 border-red-200 bg-red-50 text-xs px-2 py-0 h-5">Old Month</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {role === 'manager' && editingCycle !== month.id && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setEditingCycle(month.id);
                                                setEditName(month.name);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
