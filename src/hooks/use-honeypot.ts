import { useState, useCallback } from 'react';

/**
 * Honeypot anti-bot hook.
 * Renders a hidden field that real users will never see or fill.
 * If a bot auto-fills it, the form submission is silently rejected.
 */
export function useHoneypot() {
    const [honeypotValue, setHoneypotValue] = useState('');

    const isBot = useCallback(() => {
        return honeypotValue.length > 0;
    }, [honeypotValue]);

    const honeypotProps = {
        value: honeypotValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypotValue(e.target.value),
        name: 'website',
        autoComplete: 'off',
        tabIndex: -1,
        'aria-hidden': true as const,
        style: {
            position: 'absolute' as const,
            left: '-9999px',
            top: '-9999px',
            opacity: 0,
            height: 0,
            width: 0,
            overflow: 'hidden' as const,
        },
    };

    return { isBot, honeypotProps };
}
