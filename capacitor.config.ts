import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.kangal.app',
    appName: 'KANGAL',
    webDir: 'out', // Required by Capacitor but we use server.url for remote mode

    // Remote URL mode — loads the live deployed site
    server: {
        url: 'https://kangal.software',
        cleartext: false, // HTTPS only
        allowNavigation: [
            'kangal.software',
            'kangal-app.vercel.app',
            '*.supabase.co',
        ],
    },

    // Plugin configs
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#09090b',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: true,
            spinnerColor: '#16a34a',
        },
        StatusBar: {
            backgroundColor: '#09090b',
            style: 'LIGHT', // Light text on dark background
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
    },

    // Android-specific
    android: {
        backgroundColor: '#09090b',
        allowMixedContent: false,
        buildOptions: {
            keystorePath: undefined,
            keystoreAlias: undefined,
        },
    },
};

export default config;
