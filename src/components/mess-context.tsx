'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface MessContextValue {
    userId: string;
    memberId: string;
    messId: string;
    cycleId: string;
    role: 'manager' | 'member' | 'cook';
}

const MessContext = createContext<MessContextValue | null>(null);

export function MessProvider({
    value,
    children,
}: {
    value: MessContextValue | null;
    children: ReactNode;
}) {
    return <MessContext.Provider value={value}>{children}</MessContext.Provider>;
}

/**
 * Returns the mess context (userId, memberId, messId, cycleId, role).
 * Returns null if the user hasn't joined a mess or has no active cycle.
 */
export function useMessContext(): MessContextValue | null {
    return useContext(MessContext);
}

/**
 * Same as useMessContext but throws if null — use this in pages that
 * definitely require a mess (meals, bazaar, deposits, costs, etc.)
 */
export function useRequiredMessContext(): MessContextValue {
    const ctx = useContext(MessContext);
    if (!ctx) {
        throw new Error(
            'useRequiredMessContext: No mess context — user may not have joined a mess or has no active cycle.'
        );
    }
    return ctx;
}
