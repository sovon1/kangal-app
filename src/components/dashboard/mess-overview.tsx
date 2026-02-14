'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Wallet,
    Banknote,
    UtensilsCrossed,
    Receipt,
    Calculator,
    Users2,
    DollarSign,
    FileText,
} from 'lucide-react';

interface MessOverviewData {
    messName: string;
    cycleName: string;
    cycleStatus: string;
    monthLabel: string;
    messBalance: number;
    totalDeposits: number;
    totalMeals: number;
    totalMealCost: number;
    mealRate: number;
    totalIndividualCost: number;
    totalSharedCost: number;
}

interface MessOverviewProps {
    data: MessOverviewData | null;
    loading?: boolean;
}

function formatCurrency(amount: number): string {
    if (isNaN(amount)) return '____';
    const prefix = amount < 0 ? '-' : '';
    return `${prefix}৳${Math.abs(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function MessOverview({ data, loading }: MessOverviewProps) {
    if (loading) {
        return (
            <Card className="border-border/50">
                <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2.5">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const statusText = data.cycleStatus === 'open' ? 'Running' : data.cycleStatus === 'closed' ? 'Closed' : data.cycleStatus;

    const rows = [
        { icon: Wallet, label: 'Mess Balance', value: formatCurrency(data.messBalance), isNegative: data.messBalance < 0 },
        { icon: Banknote, label: 'Total Deposit', value: formatCurrency(data.totalDeposits) },
        { icon: UtensilsCrossed, label: 'Total Meal', value: data.totalMeals.toFixed(2) },
        { icon: Receipt, label: 'Total Meal Cost', value: formatCurrency(data.totalMealCost) },
        { icon: Calculator, label: 'Meal Rate', value: data.mealRate > 0 ? `${formatCurrency(data.mealRate)}` : '____ ৳' },
        { icon: Users2, label: 'Total Individual Other Cost', value: formatCurrency(data.totalIndividualCost) },
        { icon: DollarSign, label: 'Total Shared Other Cost', value: formatCurrency(data.totalSharedCost) },
    ];

    return (
        <Card className="border-border/50 h-full">
            <CardContent className="p-5">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="font-bold text-base text-foreground">
                        {data.messName}, {data.monthLabel}
                        <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                            {statusText}
                        </Badge>
                    </h3>
                </div>

                {/* Stats Rows */}
                <div className="space-y-2.5">
                    {rows.map((row) => {
                        const Icon = row.icon;
                        return (
                            <div key={row.label} className="flex items-center gap-2.5 text-sm">
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{row.label}:</span>
                                <span className={`font-medium ml-auto ${row.isNegative ? 'text-destructive' : 'text-foreground'}`}>
                                    {row.value}
                                </span>
                            </div>
                        );
                    })}

                    {/* Full Details Link */}
                    <div className="flex items-center gap-2.5 text-sm pt-1 border-t border-border/30">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">This Month Full Details:</span>
                        <a
                            href="#all-member-info"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('all-member-info')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="ml-auto text-primary text-xs cursor-pointer hover:underline flex items-center gap-1"
                        >
                            📄 View
                        </a>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
