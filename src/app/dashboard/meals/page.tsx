'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, ChevronLeft, ChevronRight, Sun, Cloud, Moon, Lock, Users, Plus, Minus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { toggleMeal, updateGuestMeal } from '@/lib/actions/meals';
import Link from 'next/link';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_ICONS = { breakfast: Sun, lunch: Cloud, dinner: Moon };
const MEAL_COLORS = {
    breakfast: 'text-amber-500 bg-amber-500/10',
    lunch: 'text-sky-500 bg-sky-500/10',
    dinner: 'text-indigo-500 bg-indigo-500/10',
};

export default function MealsPage() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const [ctx, setCtx] = useState<{ userId: string; memberId: string; messId: string; cycleId: string; role: string } | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: m } = await supabase.from('mess_members').select('id, mess_id, role').eq('user_id', user.id).eq('status', 'active').limit(1).single();
            if (!m) return;
            const { data: c } = await supabase.from('mess_cycles').select('id').eq('mess_id', m.mess_id).eq('status', 'open').limit(1).single();
            if (!c) return;
            setCtx({ userId: user.id, memberId: m.id, messId: m.mess_id, cycleId: c.id, role: m.role });
        }
        load();
    }, [supabase]);

    // Get week dates
    const getWeekDates = useCallback(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d.toISOString().split('T')[0];
        });
    }, [weekOffset]);

    const weekDates = getWeekDates();

    // Fetch week meals
    const mealsQuery = useQuery({
        queryKey: ['week-meals', ctx?.memberId, weekDates[0]],
        queryFn: async () => {
            if (!ctx) return [];
            const { data } = await supabase
                .from('daily_meals')
                .select('*')
                .eq('member_id', ctx.memberId)
                .gte('meal_date', weekDates[0])
                .lte('meal_date', weekDates[6]);
            return data || [];
        },
        enabled: !!ctx,
    });

    const getMealData = (date: string) => {
        return mealsQuery.data?.find((m: Record<string, unknown>) => m.meal_date === date);
    };

    const handleToggle = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', value: boolean) => {
        if (!ctx) return;
        const result = await toggleMeal({
            memberId: ctx.memberId, cycleId: ctx.cycleId, messId: ctx.messId,
            mealDate: date, mealType, value,
        });
        if (result.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Failed');
            return;
        }
        queryClient.invalidateQueries({ queryKey: ['week-meals'] });
        toast.success(`${mealType} ${value ? 'on' : 'off'}`);
    };

    const handleGuest = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', count: number) => {
        if (!ctx) return;
        const result = await updateGuestMeal({
            memberId: ctx.memberId, cycleId: ctx.cycleId, messId: ctx.messId,
            mealDate: date, mealType, count,
        });
        if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Failed'); return; }
        queryClient.invalidateQueries({ queryKey: ['week-meals'] });
    };

    const isToday = (date: string) => date === new Date().toISOString().split('T')[0];
    const formatDate = (date: string) => {
        const d = new Date(date + 'T00:00:00');
        return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }) };
    };

    // Count stats
    const totalMeals = (mealsQuery.data || []).reduce((sum: number, m: Record<string, unknown>) => {
        return sum + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0) +
            ((m.guest_breakfast as number) || 0) + ((m.guest_lunch as number) || 0) + ((m.guest_dinner as number) || 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Meal Calendar</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Toggle your meals for the week</p>
                </div>
                <Badge variant="outline" className="text-xs gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {totalMeals} meals this week
                </Badge>
                {ctx?.role === 'manager' && (
                    <Link href="/dashboard/meals/manage">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Settings className="h-3.5 w-3.5" /> Manage
                        </Button>
                    </Link>
                )}
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-sm font-medium">
                    {formatDate(weekDates[0]).month} {formatDate(weekDates[0]).date} — {formatDate(weekDates[6]).month} {formatDate(weekDates[6]).date}
                </span>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            {/* Meal Grid */}
            {!ctx || mealsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {weekDates.map((date) => {
                        const meal = getMealData(date);
                        const today = isToday(date);
                        const f = formatDate(date);
                        return (
                            <Card key={date} className={`overflow-hidden transition-all ${today ? 'border-primary/50 shadow-md shadow-primary/5' : 'border-border/40'}`}>
                                <CardHeader className={`py-2 px-3 ${today ? 'bg-primary/5' : 'bg-muted/30'}`}>
                                    <div className="text-center">
                                        <p className="text-xs font-medium text-muted-foreground">{f.day}</p>
                                        <p className={`text-lg font-bold ${today ? 'text-primary' : ''}`}>{f.date}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-2 space-y-1.5">
                                    {MEAL_TYPES.map((type) => {
                                        const Icon = MEAL_ICONS[type];
                                        const enabled = meal?.[type] ?? false;
                                        const guestKey = `guest_${type}` as string;
                                        const guestCount = (meal as Record<string, unknown>)?.[guestKey] as number ?? 0;
                                        return (
                                            <div key={type} className={`rounded-lg p-2 transition-all ${enabled ? 'bg-accent/50' : ''}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className={`flex items-center gap-1.5 ${MEAL_COLORS[type]}`}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium capitalize">{type}</span>
                                                    </div>
                                                    <Switch
                                                        checked={enabled as boolean}
                                                        onCheckedChange={(v) => handleToggle(date, type, v)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                                {enabled && (
                                                    <div className="flex items-center justify-between mt-1.5 pl-5">
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-2.5 w-2.5" /> Guest
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleGuest(date, type, Math.max(0, guestCount - 1))} className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition"><Minus className="h-2.5 w-2.5" /></button>
                                                            <span className="text-xs w-4 text-center font-medium">{guestCount}</span>
                                                            <button onClick={() => handleGuest(date, type, Math.min(10, guestCount + 1))} className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition"><Plus className="h-2.5 w-2.5" /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
