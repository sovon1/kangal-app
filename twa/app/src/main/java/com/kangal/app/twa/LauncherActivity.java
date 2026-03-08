package com.kangal.app.twa;

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

/**
 * LauncherActivity opens kangal.software as a Trusted Web Activity.
 * 
 * TWA uses Chrome (not a WebView), so:
 * - Google OAuth works perfectly (native account picker)
 * - Cloudflare Turnstile CAPTCHA works
 * - Status bar is handled by Chrome
 * - Service Worker provides offline support
 * - No address bar shown (when Digital Asset Links are verified)
 */
public class LauncherActivity extends AppCompatActivity {

    private static final String DEFAULT_URL = "https://kangal.software";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Lock to portrait
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        // Build and launch the TWA
        Uri uri = Uri.parse(DEFAULT_URL);
        
        TrustedWebActivityIntentBuilder builder = new TrustedWebActivityIntentBuilder(uri);
        
        // Set status bar and navigation bar colors
        CustomTabsIntent.Builder customTabsBuilder = new CustomTabsIntent.Builder();
        customTabsBuilder.setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK);
        
        builder.setAdditionalTrustedOrigins(
            java.util.Arrays.asList(
                "https://www.kangal.software",
                "https://kangal-app.vercel.app"
            )
        );

        builder.build(customTabsBuilder.build()).launchTrustedWebActivity(this, null);
        
        // Finish this launcher activity so pressing back exits the app
        finish();
    }
}
