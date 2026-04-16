'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface MemberBalanceData {
    memberId: string;
    name: string;
    role: string;
    totalMeals: number;
    totalDeposits: number;
    mealCost: number;
    fixedCostShare: number;
    individualCostTotal: number;
    currentBalance: number;
}

interface AllMemberInfoProps {
    members: MemberBalanceData[] | null;
    loading?: boolean;
}

function formatCurrency(amount: number): string {
    const prefix = amount < 0 ? '-' : '';
    return `${prefix}৳${Math.abs(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AllMemberInfo({ members, loading }: AllMemberInfoProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!members?.length) return null;

    return (
        <div id="all-member-info" className="space-y-4">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-lg font-bold flex items-center justify-center gap-2 text-primary">
                    <Users className="h-5 w-5" />
                    All Member Info
                </h2>
                <p className="text-xs text-muted-foreground">Total {members.length} Members</p>
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member, index) => {
                    const totalCost = member.mealCost + member.fixedCostShare + member.individualCostTotal;
                    const isNegative = member.currentBalance < 0;

                    return (
                        <Card
                            key={member.memberId}
                            style={{ animationFillMode: 'both', animationDelay: `${index * 75}ms` }}
                            className={cn(
                                "group relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:shadow-elevated glass",
                                isNegative ? "border-destructive/30" : "border-border/50"
                            )}
                        >
                            {/* Dynamic Background Gradient (Effect 3: Gradient Pos/Neg) */}
                            <div className={cn(
                                "absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40 pointer-events-none",
                                isNegative
                                    ? "bg-gradient-to-br from-destructive/30 via-transparent to-transparent"
                                    : "bg-gradient-to-br from-emerald-500/30 via-transparent to-transparent"
                            )} />

                            <CardContent className="p-4 space-y-3 relative z-10">
                                {/* Name + Role */}
                                <div className="flex items-center justify-between">
                                    <h3 className={cn(
                                        "font-bold text-sm drop-shadow-sm transition-colors",
                                        isNegative ? "text-destructive" : "text-primary"
                                    )}>
                                        {member.name}
                                    </h3>
                                    {member.role === 'manager' && (
                                        <Badge variant="secondary" className="text-[10px] shadow-sm glass">Manager</Badge>
                                    )}
                                </div>

                                {/* Two Column Layout */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    {/* Left Column */}
                                    <div className="space-y-1">
                                        <InfoRow label="Total Meal" value={member.totalMeals.toFixed(2)} />
                                        <InfoRow label="Meal Cost" value={formatCurrency(member.mealCost)} />
                                        <InfoRow label="Individual Cost" value={formatCurrency(member.individualCostTotal)} />
                                        <div className="pt-1 border-t border-border/30">
                                            <InfoRow
                                                label="Balance"
                                                value={formatCurrency(member.currentBalance)}
                                                valueClass={cn(
                                                    "font-bold transition-all duration-500 group-hover:scale-105",
                                                    isNegative
                                                        ? "text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                                        : "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-1">
                                        <InfoRow label="Total Deposit" value={formatCurrency(member.totalDeposits)} />
                                        <InfoRow label="Shared Cost" value={formatCurrency(member.fixedCostShare)} />
                                        <InfoRow label="Total Cost" value={formatCurrency(totalCost)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <span className="text-muted-foreground">{label}</span>
            <span className={`tabular-nums tracking-tight ${valueClass || 'text-foreground font-medium'}`}>{value}</span>
        </div>
    );
}
