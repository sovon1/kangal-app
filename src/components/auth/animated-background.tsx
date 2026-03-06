import { useState, useEffect } from 'react';
import { Utensils, Coffee, Pizza, Croissant, CakeSlice, CupSoda } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingIconProps {
    Icon: React.ElementType;
    className?: string;
    delay: string;
    duration: string;
    size: string;
}

const FloatingIcon = ({ Icon, className, delay, duration, size }: FloatingIconProps) => (
    <div
        className={cn("absolute animate-float opacity-20", className)}
        style={{
            animationDelay: delay,
            animationDuration: duration,
            width: size,
            height: size,
        }}
    >
        <Icon className="w-full h-full text-primary" strokeWidth={1.5} />
    </div>
);

interface FloatingTextProps {
    text: string;
    className?: string;
    delay: string;
    duration: string;
}

const FloatingText = ({ text, className, delay, duration }: FloatingTextProps) => (
    <div
        className={cn("absolute animate-float opacity-15 font-bold tracking-tight text-primary whitespace-nowrap", className)}
        style={{
            animationDelay: delay,
            animationDuration: duration,
        }}
    >
        {text}
    </div>
);

export function AnimatedBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />

            {/* Floating Shapes / Icons */}
            <FloatingIcon
                Icon={Utensils}
                className="top-[10%] left-[10%] rotate-12"
                delay="0s"
                duration="15s"
                size="4rem"
            />
            <FloatingIcon
                Icon={Coffee}
                className="top-[20%] right-[15%] -rotate-12"
                delay="2s"
                duration="18s"
                size="3.5rem"
            />
            <FloatingIcon
                Icon={Pizza}
                className="top-[60%] left-[5%] rotate-45"
                delay="5s"
                duration="20s"
                size="5rem"
            />
            <FloatingIcon
                Icon={Croissant}
                className="top-[70%] right-[10%] -rotate-45"
                delay="1s"
                duration="16s"
                size="4.5rem"
            />
            <FloatingIcon
                Icon={CakeSlice}
                className="top-[40%] left-[80%] rotate-12"
                delay="4s"
                duration="19s"
                size="3rem"
            />
            <FloatingIcon
                Icon={CupSoda}
                className="top-[85%] left-[40%] -rotate-12"
                delay="3s"
                duration="17s"
                size="4rem"
            />
            <FloatingIcon
                Icon={Utensils}
                className="top-[30%] left-[40%] rotate-90"
                delay="7s"
                duration="22s"
                size="2.5rem"
            />

            {/* Floating Bengali Texts (Useful & Funny) */}
            <FloatingText
                text="মিল রেট কত?"
                className="top-[15%] right-[20%] text-2xl -rotate-6"
                delay="1s"
                duration="25s"
            />
            <FloatingText
                text="ম্যানেজার টাকা মারছে!"
                className="top-[55%] right-[15%] text-xl rotate-12"
                delay="3s"
                duration="24s"
            />
            <FloatingText
                text="আজকের বাজার"
                className="top-[45%] left-[10%] text-xl rotate-12"
                delay="4s"
                duration="28s"
            />
            <FloatingText
                text="ডিপোজিট দিন"
                className="top-[75%] right-[30%] text-3xl rotate-3"
                delay="6s"
                duration="22s"
            />
            <FloatingText
                text="আজকে ডাল পানি"
                className="top-[25%] left-[20%] text-2xl rotate-6"
                delay="7s"
                duration="27s"
            />
            <FloatingText
                text="ম্যাসের হিসাব"
                className="top-[80%] left-[15%] text-2xl -rotate-12"
                delay="8s"
                duration="26s"
            />
            <FloatingText
                text="বোর্ডিং ফি"
                className="top-[35%] right-[5%] text-xl rotate-6"
                delay="2s"
                duration="20s"
            />
            <FloatingText
                text="ব্রয়লার মুরগি আর কত!"
                className="top-[90%] right-[10%] text-lg -rotate-6"
                delay="5s"
                duration="29s"
            />
            <FloatingText
                text="গ্যাস নাই"
                className="top-[5%] left-[45%] text-xl lg:text-3xl rotate-3"
                delay="9s"
                duration="30s"
            />

            {/* Soft Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        </div>
    );
}
