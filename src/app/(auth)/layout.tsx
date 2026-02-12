import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-h-screen flex items-center justify-center">
            {/* Doodle background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/auth-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.08,
                }}
            />
            {/* Content on top */}
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}
