import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-background scroll-mt-8">
            {/* Background glow for premium feel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
                        Simple Pricing, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">Premium Experience</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Choose the plan that fits your mess. As a special launch offer, our developer is making all Pro features absolutely <span className="font-semibold text-foreground">FREE for the next 2 years!</span>
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
                    {/* Free Tier */}
                    <Card className="relative p-8 bg-card border-border/50 shadow-sm flex flex-col h-full z-10">
                        <div className="mb-6">
                            <CardTitle className="text-2xl font-bold mb-2">Free Tier</CardTitle>
                            <CardDescription className="text-base">Perfect for getting your mess organized.</CardDescription>
                        </div>
                        <div className="mb-8">
                            <span className="text-5xl font-extrabold">৳0</span>
                            <span className="text-muted-foreground"> /month</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Basic meal tracking',
                                'Split bazaar costs',
                                'Standard PDF exports',
                                'Member management',
                                'Community support'
                            ].map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-muted-foreground">
                                    <Check className="h-5 w-5 text-primary shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href="/signup" className="mt-auto">
                            <Button variant="outline" className="w-full h-12 text-lg">Get Started Free</Button>
                        </Link>
                    </Card>

                    {/* Pro Tier (Premium Look) */}
                    <div className="relative group z-20 md:-my-4">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-20 blur-lg transition-opacity duration-300 group-hover:opacity-40"></div>
                        <Card className="relative p-8 bg-card/60 backdrop-blur-xl border-amber-500/30 shadow-2xl flex flex-col h-full rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>

                            <div className="absolute top-0 right-0 p-4">
                                <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-amber-950 hover:from-amber-400 hover:to-amber-200 font-bold border-none shadow-lg px-3 py-1">
                                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Developer's Gift
                                </Badge>
                            </div>

                            <div className="mb-6 relative z-10">
                                <CardTitle className="text-3xl font-bold text-amber-500 mb-2">Pro Tier</CardTitle>
                                <CardDescription className="text-base text-foreground/80">
                                    The ultimate premium experience.
                                </CardDescription>
                            </div>

                            <div className="mb-8 relative z-10 flex flex-col sm:flex-row sm:items-baseline gap-2">
                                <span className="text-2xl text-muted-foreground line-through decoration-destructive decoration-2">৳50</span>
                                <div>
                                    <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">৳0</span>
                                    <span className="text-muted-foreground ml-1">/month</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                {[
                                    '100x PDF Exports power',
                                    '100% Ad-free experience',
                                    'Advanced analytics & charts',
                                    'Priority feature access',
                                    'Glistening PRO badge for all members'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 font-medium text-foreground">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/login" className="mt-auto relative z-10">
                                <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-amber-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02]">
                                    Subscribe for ৳0 BDT
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
