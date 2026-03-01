'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Utensils, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const supabase = getSupabaseBrowserClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { setError('Please enter your email'); return; }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">

            <Card className="w-full max-w-md mx-4 relative z-10 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
                        <Utensils className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {sent ? 'Check your email' : 'Forgot Password'}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">
                            {sent
                                ? 'We sent you a reset link'
                                : 'Enter your email to receive a password reset link'
                            }
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    {sent ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
                            </p>
                            <Button asChild variant="outline" className="w-full h-11 gap-2 mt-4">
                                <Link href="/login">
                                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 pl-10 bg-background/50"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <Button asChild variant="ghost" className="w-full gap-2">
                                <Link href="/login">
                                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                                </Link>
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
