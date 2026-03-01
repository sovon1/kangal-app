'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@/lib/validations';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Utensils, Eye, EyeOff, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function SignupPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setGoogleLoading(false);
        }
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupInput) => {
        setError(null);
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.fullName,
                },
            },
        });

        if (error) {
            setError(error.message);
        } else {
            router.push('/dashboard');
            router.refresh();
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
                        <CardTitle className="text-3xl font-bold tracking-tight">Join KANGAL</CardTitle>
                        <CardDescription className="text-base mt-1">
                            Create your account to get started
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Your full name"
                                {...register('fullName')}
                                className="h-11 bg-background/50"
                            />
                            {errors.fullName && (
                                <p className="text-sm text-destructive">{errors.fullName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@university.edu"
                                {...register('email')}
                                className="h-11 bg-background/50"
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    {...register('password')}
                                    className="h-11 pr-10 bg-background/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repeat your password"
                                {...register('confirmPassword')}
                                className="h-11 bg-background/50"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/60" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card/80 px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        {/* Google Sign Up */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 gap-3 font-medium bg-background/50 hover:bg-background/80"
                            onClick={handleGoogleSignUp}
                            disabled={googleLoading}
                        >
                            {googleLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <GoogleIcon />
                            )}
                            Continue with Google
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-primary font-medium hover:underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
