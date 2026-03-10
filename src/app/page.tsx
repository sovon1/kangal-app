
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { FeatureCards } from '@/components/landing/feature-cards';
import { PricingSection } from '@/components/landing/pricing-section';
import { UpdatesModal } from '@/components/landing/updates-modal';
import { MobileUpdatesMarquee } from '@/components/landing/mobile-updates-marquee';
import { FeedbackSection } from '@/components/landing/feedback-section';
import { AppManualModal } from '@/components/landing/app-manual-modal';
import { InstallAppSection } from '@/components/landing/install-app-section';
import { Utensils } from 'lucide-react';

export default async function LandingPage() {
  const supabase = await getSupabaseServerClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    // Supabase might be down or network issue - treat as logged out
    console.error('Auth check failed:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
              <Utensils className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">KANGAL</span>
          </div>
          <div className="flex items-center gap-4">
            <UpdatesModal />
            <AppManualModal trigger={
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block cursor-pointer">
                User Manual
              </button>
            } />
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Pricing
            </Link>
            <Link href="#feedback" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block mr-2">
              Feedback
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-base">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="font-semibold">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-86 lg:pt-28 lg:pb-110 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.08]">
          <div
            className="absolute inset-0 bg-repeat"
            style={{ backgroundImage: 'url(/auth-bg.png)', backgroundSize: '400px' }}
          />
        </div>

        {/* Gradient Overlay for Fade Effect */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Mess Management Made Simple
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Manage Your Mess Life<br />
            <span className="text-primary">Without the Chaos</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Track meals, split bazaar costs, and manage finances effortlessly.
            Say goodbye to spreadsheets and confusion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 lg:mb-16">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 text-lg gap-2">
                  <Utensils className="h-5 w-5" />
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-12 px-8 text-lg shadow-lg shadow-primary/20">
                    Start Your Mess
                  </Button>
                </Link>
                <AppManualModal trigger={
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg cursor-pointer">
                    How it Works
                  </Button>
                } />
              </>
            )}
          </div>

          {/* Mobile Only: Updates Marquee in the gap */}
          <MobileUpdatesMarquee />
        </div>

        {/* Mobile Only: Install App Section */}
        <div className="relative z-20">
          <InstallAppSection />
        </div>

        {/* Decorative Hero Image (Cabbage & Goat) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.prod.website-files.com/6784bb6fe62260fc0039c353/6784cbaaca128d91b017a5c4_Hero.avif"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-8xl z-[15] pointer-events-none select-none object-contain"
        />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-muted/30 scroll-mt-8">
        <div className="max-w-7xl mx-auto px-6">
          <FeatureCards />
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Feedback Section */}
      <FeedbackSection />

      {/* CTA + Footer with shared background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
            style={{ backgroundImage: 'url(/nstu-bg.jpg)' }}
          />
        </div>

        {/* CTA Section */}
        <section className="relative z-10 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">তাহলে আর দেরি কেন?</h2>
          <p className="text-muted-foreground mb-8">আজকেই শুরু করেন, ফ্রি!</p>
          <div className="flex items-center justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-lg gap-2">
                  <Utensils className="h-5 w-5" />
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/20">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 py-12 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Utensils className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">KANGAL</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} KANGAL. some lifeless guy from CSTE18 NSTU.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

