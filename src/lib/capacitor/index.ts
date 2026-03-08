import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running inside a native Capacitor shell (Android/iOS)
 */
export function isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on web (browser)
 */
export function isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
}

/**
 * Get the current platform name
 */
export function getPlatform(): string {
    return Capacitor.getPlatform();
}

/**
 * Check if a specific Capacitor plugin is available on the current platform
 */
export function isPluginAvailable(pluginName: string): boolean {
    return Capacitor.isPluginAvailable(pluginName);
}
