package com.kangal.app.twa;

import android.net.Uri;

/**
 * TWA Launcher — opens kangal.software as a Trusted Web Activity using Chrome.
 * Extends the official Google androidbrowserhelper LauncherActivity.
 */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://kangal.software");
    }
}