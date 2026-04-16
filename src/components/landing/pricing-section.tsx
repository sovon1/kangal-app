'use client';

import { Check, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export function PricingSection() {
    return (
        <section id="pricing" className="py-32 relative overflow-hidden bg-background scroll-mt-8">
            {/* Surreal Background Orbs */}
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0 animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div className="absolute top-1/3 right-1/4 translate-x-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 mt-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-28 relative"
                >
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center justify-center gap-10 w-full pointer-events-none">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                            <Sparkles className="w-10 h-10 text-amber-300 opacity-60" />
                        </motion.div>
                        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                            <Star className="w-6 h-6 text-emerald-300 opacity-60" />
                        </motion.div>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-foreground">
                        Simple Pricing, <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-[pulse_4s_ease-in-out_infinite]">Premium Experience</span>
                    </h2>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                        Choose the companion that fits your mess. As a magical launch offer, your developer is granting all Pro powers <span className="inline-block font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300 animate-pulse drop-shadow-sm">ABSOLUTELY FREE</span> for 2 years! 🪄
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-5xl mx-auto items-center mt-10">

                    {/* Free Tier */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10"
                    >
                        {/* Cute Mascot Peeking */}
                        <motion.img
                            animate={{ y: [0, -8, 0], rotate: [0, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            src="/avatars/miki2.svg"
                            className="absolute -top-16 -left-6 w-28 h-28 drop-shadow-xl z-20 pointer-events-none"
                            alt="Cute Mascot"
                        />

                        <Card className="relative p-8 pt-12 bg-card/40 backdrop-blur-md border-border/60 shadow-xl flex flex-col h-full rounded-[2rem] overflow-hidden">
                            <div className="mb-6">
                                <CardTitle className="text-2xl font-bold mb-2">Basic Friend</CardTitle>
                                <CardDescription className="text-base text-muted-foreground">The minimalist companion to organize your mess.</CardDescription>
                            </div>
                            <div className="mb-8 flex items-end gap-2">
                                <span className="text-5xl md:text-6xl font-black text-foreground/80">৳0</span>
                                <span className="text-muted-foreground font-medium mb-2">/ month forever</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    'Basic meal tracking',
                                    'Split bazaar costs safely',
                                    'Standard PDF exports',
                                    'Member management',
                                    'Community support'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-muted-foreground font-medium">
                                        <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
                                            <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className="mt-auto">
                                <Button variant="secondary" className="w-full h-14 text-lg rounded-2xl font-semibold backdrop-blur-md border border-border/50 hover:bg-muted/80 transition-all">
                                    Adopt Basic
                                </Button>
                            </Link>
                        </Card>
                    </motion.div>

                    {/* Pro Tier (Premium Sleek Look) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.5 }}
                        className="relative group z-20 md:-my-4 mt-8 md:mt-0"
                    >
                        {/* Majestic Mascot Peeking from Right */}
                        <motion.img
                            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                            src="/avatars/haru.svg"
                            className="absolute -top-16 -right-6 w-28 h-28 drop-shadow-[0_10px_15px_rgba(16,185,129,0.3)] z-30 pointer-events-none"
                            alt="Premium Mascot"
                        />

                        <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-40 animate-pulse"></div>

                        <Card className="relative p-8 pt-12 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-3xl border border-emerald-500/30 shadow-[0_15px_50px_-15px_rgba(16,185,129,0.2)] flex flex-col h-full rounded-[2rem] overflow-hidden">

                            {/* Inner ambient glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 pointer-events-none"></div>

                            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold px-3 py-1 rounded-full text-[10px] md:text-xs">
                                    <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" /> Developer's Gift
                                </Badge>
                            </div>

                            <div className="mb-6 relative z-10 mt-4">
                                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 mb-2">Pro Magic</CardTitle>
                                <CardDescription className="text-base text-muted-foreground">The ultimate premium experience.</CardDescription>
                            </div>

                            <div className="mb-8 relative z-10 flex flex-col items-start gap-1">
                                <span className="text-lg font-bold text-muted-foreground line-through decoration-destructive/60 decoration-2">৳25 / month</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">৳0</span>
                                    <span className="text-muted-foreground font-medium mb-2">/ month for 2 years</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                {[
                                    '100x PDF Exports power',
                                    '100% Ad-free experience',
                                    'Advanced analytics & charts',
                                    'Priority feature access',
                                    'Glistening PRO badge'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 font-medium text-foreground">
                                        <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
                                            <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/login" className="mt-auto relative z-10">
                                <Button className="w-full h-14 text-lg rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                                    Claim Magic For Free
                                </Button>
                            </Link>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
