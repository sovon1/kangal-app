'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '@/lib/actions/feedback';
import { motion } from 'framer-motion';

export function FeedbackSection() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await submitFeedback(formData);

            if (result.success) {
                toast.success("Thank you! Your message has been sent directly to the developer.");
                (e.target as HTMLFormElement).reset();
            } else {
                toast.error(result.error || "Failed to submit feedback.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="feedback" className="py-20 bg-muted/30 border-t border-border/50 scroll-mt-8 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                className="max-w-3xl mx-auto px-6 relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
                        <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Have a Suggestion or Complaint?</h2>
                    <p className="text-muted-foreground text-lg">
                        We are building this app for you. Let us know how we can make it better!
                    </p>
                </div>

                <Card className="bg-background shadow-lg border-primary/10">
                    <CardHeader>
                        <CardTitle>Send your feedback</CardTitle>
                        <CardDescription>All messages go straight to the developer's inbox.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Name (Optional)</label>
                                    <Input id="name" name="name" placeholder="Your name" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">Email (Optional)</label>
                                    <Input id="email" name="email" type="email" placeholder="Your email address" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium">Your Message *</label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="Tell us what you love, what's broken, or what you'd like to see next..."
                                    className="min-h-[120px] resize-none"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : (
                                    <>
                                        Send Message <Send className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </section>
    );
}
