package com.kangal.app.twa;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;

import androidx.browser.customtabs.CustomTabsIntent;

/**
 * Handles deep links from kangal.software URLs and opens them in the TWA.
 */
public class HandleUrlActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri uri = getIntent().getData();
        if (uri == null) {
            uri = Uri.parse("https://kangal.software");
        }

        // Open the URL in Chrome Custom Tab (TWA)
        CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
                .build();
        customTabsIntent.launchUrl(this, uri);
        
        finish();
    }
}
