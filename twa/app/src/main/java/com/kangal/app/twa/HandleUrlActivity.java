package com.kangal.app.twa;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;

/**
 * Handles deep links — redirects kangal.software URLs to the main TWA launcher.
 */
public class HandleUrlActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Just finish — the LauncherActivity handles everything
        // Deep links to kangal.software will be handled by Chrome automatically
        finish();
    }
}
