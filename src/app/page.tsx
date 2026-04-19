
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeatureCards } from '@/components/landing/feature-cards';
import { PricingSection } from '@/components/landing/pricing-section';
import { UpdatesModal } from '@/components/landing/updates-modal';
import { HeroSection } from '@/components/landing/hero-section';
import { FeedbackSection } from '@/components/landing/feedback-section';
import { AppManualModal } from '@/components/landing/app-manual-modal';
import { InstallAppSection } from '@/components/landing/install-app-section';
import { DesktopInstallButton } from '@/components/desktop-install-button';
import { LandingAuthButtons } from '@/components/landing/auth-buttons';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden shadow-sm">
              <img
                src="/food-animated-icon.svg"
                alt="Kangal Logo"
                className="w-12 h-12 object-cover scale-[1.3] group-hover:scale-[1.4] transition-transform duration-300"
              />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">KANGAL</span>
          </div>
          <div className="flex items-center gap-4">
            <DesktopInstallButton />
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
            {/* Client-side auth-aware buttons — no server delay */}
            <LandingAuthButtons location="header" />
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

        {/* Ambient gradient orb — adds a living, breathing depth behind the text */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-[5] bg-emerald-400/[0.06] dark:bg-emerald-400/[0.04] blur-[100px] animate-[drift_20s_ease-in-out_infinite]" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
          <HeroSection />
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
            <LandingAuthButtons location="cta" />
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 py-3 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4 text-muted-foreground">
            {/* Left — logo */}
            <div className="flex items-center gap-2 group shrink-0">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 overflow-hidden">
                <img
                  src="/food-animated-icon.svg"
                  alt="Kangal Logo"
                  className="w-8 h-8 object-cover scale-[1.3]"
                />
              </div>
              <span className="text-xs font-semibold text-foreground/70">KANGAL</span>
            </div>

            {/* Right — copyright + credit */}
            <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground/40">
              <span>&copy; {new Date().getFullYear()} CSTE18, NSTU</span>
              <span className="text-border/50">·</span>
              <a
                href="https://github.com/sovon1"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative italic text-muted-foreground/90 hover:text-muted-foreground/100 transition-all duration-700"
                style={{ fontFamily: 'var(--font-display), serif' }}
              >
                Made by Sovon
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-muted-foreground/20 group-hover:w-full transition-all duration-1000 ease-out" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
