'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sun, Cloud, Moon, Lock, Plus, Minus, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { MealToggleState } from '@/types';

interface MealTogglesProps {
    meals: MealToggleState | null;
    memberId: string;
    cycleId: string;
    messId: string;
    loading?: boolean;
    onToggle: (mealType: 'breakfast' | 'lunch' | 'dinner', value: boolean) => Promise<void>;
    onGuestUpdate: (mealType: 'breakfast' | 'lunch' | 'dinner', count: number) => Promise<void>;
}

const mealConfig = [
    {
        type: 'breakfast' as const,
        label: 'Breakfast',
        icon: Sun,
        gradient: 'from-amber-500/10 to-yellow-500/10',
        activeColor: 'bg-amber-500',
        iconColor: 'text-amber-500',
        lockText: 'Locks 9PM night before',
    },
    {
        type: 'lunch' as const,
        label: 'Lunch',
        icon: Cloud,
        gradient: 'from-sky-500/10 to-blue-500/10',
        activeColor: 'bg-sky-500',
        iconColor: 'text-sky-500',
        lockText: 'Locks 10AM',
    },
    {
        type: 'dinner' as const,
        label: 'Dinner',
        icon: Moon,
        gradient: 'from-indigo-500/10 to-purple-500/10',
        activeColor: 'bg-indigo-500',
        iconColor: 'text-indigo-500',
        lockText: 'Locks 3PM',
    },
];

export function MealToggles({
    meals,
    memberId,
    cycleId,
    messId,
    loading,
    onToggle,
    onGuestUpdate,
}: MealTogglesProps) {
    const [isPending, startTransition] = useTransition();
    const [optimistic, setOptimistic] = useState<Partial<MealToggleState>>({});

    if (loading || !meals) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Today&apos;s Meals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    const getMealValue = (type: 'breakfast' | 'lunch' | 'dinner') => {
        return optimistic[type] !== undefined ? optimistic[type] as boolean : meals[type];
    };

    const getGuestCount = (type: 'breakfast' | 'lunch' | 'dinner') => {
        const key = `guest${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof MealToggleState;
        return (optimistic[key] !== undefined ? optimistic[key] : meals[key]) as number;
    };

    const isLocked = (type: 'breakfast' | 'lunch' | 'dinner') => {
        const key = `${type}Locked` as keyof MealToggleState;
        return meals[key] as boolean;
    };

    const handleToggle = (type: 'breakfast' | 'lunch' | 'dinner', value: boolean) => {
        if (isLocked(type)) {
            toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} is locked`);
            return;
        }

        // Optimistic update
        setOptimistic((prev) => ({ ...prev, [type]: value }));

        startTransition(async () => {
            try {
                await onToggle(type, value);
            } catch {
                // Revert optimistic update
                setOptimistic((prev) => {
                    const next = { ...prev };
                    delete next[type];
                    return next;
                });
                toast.error('Failed to update meal');
            }
        });
    };

    const handleGuestChange = (type: 'breakfast' | 'lunch' | 'dinner', delta: number) => {
        const currentCount = getGuestCount(type);
        const newCount = Math.max(0, Math.min(10, currentCount + delta));
        if (newCount === currentCount) return;

        const key = `guest${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof MealToggleState;
        setOptimistic((prev) => ({ ...prev, [key]: newCount }));

        startTransition(async () => {
            try {
                await onGuestUpdate(type, newCount);
            } catch {
                setOptimistic((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
                toast.error('Failed to update guest meals');
            }
        });
    };

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Today&apos;s Meals</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {mealConfig.map(({ type, label, icon: Icon, gradient, activeColor, iconColor, lockText }) => {
                    const enabled = getMealValue(type);
                    const locked = isLocked(type);
                    const guestCount = getGuestCount(type);

                    return (
                        <div
                            key={type}
                            className={`relative rounded-xl border p-4 transition-all duration-300 ${enabled
                                    ? `bg-gradient-to-r ${gradient} border-border/50 shadow-sm`
                                    : 'bg-card/50 border-border/30'
                                } ${locked ? 'opacity-70' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${enabled ? `${iconColor} bg-background/60` : 'text-muted-foreground bg-muted/50'}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{label}</span>
                                            {locked && (
                                                <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 h-5">
                                                    <Lock className="h-2.5 w-2.5" />
                                                    Locked
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{lockText}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={enabled}
                                    onCheckedChange={(v) => handleToggle(type, v)}
                                    disabled={locked || isPending}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>

                            {/* Guest Meals */}
                            {enabled && (
                                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>Guest meals</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleGuestChange(type, -1)}
                                            disabled={guestCount <= 0 || isPending}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-semibold w-6 text-center">{guestCount}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleGuestChange(type, 1)}
                                            disabled={guestCount >= 10 || isPending}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
