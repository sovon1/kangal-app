'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (element: HTMLElement, options: TurnstileOptions) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

interface TurnstileOptions {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
}

interface TurnstileCaptchaProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    className?: string;
}

export function TurnstileCaptcha({
    onVerify,
    onExpire,
    onError,
    theme = 'auto',
    className = '',
}: TurnstileCaptchaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);

    const renderWidget = useCallback(() => {
        if (!containerRef.current || !window.turnstile) return;

        // Remove existing widget if any
        if (widgetIdRef.current) {
            try {
                window.turnstile.remove(widgetIdRef.current);
            } catch {
                // ignore
            }
        }

        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        if (!siteKey) {
            console.warn('Turnstile site key not configured. CAPTCHA disabled.');
            // If no site key, auto-verify to not block the form
            onVerify('captcha-disabled');
            return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'expired-callback': () => {
                onExpire?.();
            },
            'error-callback': () => {
                onError?.();
            },
            theme,
        });
    }, [onVerify, onExpire, onError, theme]);

    useEffect(() => {
        // If Turnstile script is already loaded, render immediately
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // If script tag already exists, wait for it to load
        if (scriptLoadedRef.current) return;
        scriptLoadedRef.current = true;

        // Load the Turnstile script
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
        script.async = true;
        script.defer = true;

        window.onTurnstileLoad = () => {
            renderWidget();
        };

        document.head.appendChild(script);

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // ignore
                }
            }
        };
    }, [renderWidget]);

    return (
        <div
            ref={containerRef}
            className={`flex justify-center ${className}`}
        />
    );
}
