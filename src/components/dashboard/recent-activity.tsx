'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Wallet, DollarSign, CalendarClock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: string;
    action: string;
    details: Record<string, unknown> | null;
    created_at: string;
    actor: { full_name: string; avatar_url: string | null } | null;
}

interface RecentActivityProps {
    activities: ActivityItem[] | null;
    loading?: boolean;
}

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
    bazaar_added: { icon: ShoppingCart, label: 'Bazaar Expense', color: 'text-amber-500 bg-amber-500/10' },
    deposit_added: { icon: Wallet, label: 'Deposit', color: 'text-emerald-500 bg-emerald-500/10' },
    fixed_cost_added: { icon: DollarSign, label: 'Fixed Cost', color: 'text-blue-500 bg-blue-500/10' },
    month_closed: { icon: CalendarClock, label: 'Month Closed', color: 'text-purple-500 bg-purple-500/10' },
};

export function RecentActivity({ activities, loading }: RecentActivityProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-3/4 mb-1" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {!activities || activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => {
                            const config = actionConfig[activity.action] || {
                                icon: Activity,
                                label: activity.action.replace(/_/g, ' '),
                                color: 'text-muted-foreground bg-muted',
                            };
                            const Icon = config.icon;
                            const initials = activity.actor?.full_name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) || '??';

                            return (
                                <div key={activity.id} className="flex items-start gap-3 group">
                                    <Avatar className="h-9 w-9 border">
                                        <AvatarFallback className="text-xs font-semibold bg-primary/5">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-medium truncate">
                                                {activity.actor?.full_name || 'System'}
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${config.color}`}>
                                                <Icon className="h-2.5 w-2.5 mr-1" />
                                                {config.label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                            {activity.details && 'total' in activity.details && (
                                                <span className="ml-1">
                                                    · ৳{Number(activity.details.total).toLocaleString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
