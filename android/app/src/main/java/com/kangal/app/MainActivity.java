package com.kangal.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();

        // Override WebView user-agent to fix Google OAuth
        // Google blocks OAuth from WebViews (Error 403: disallowed_useragent)
        // By setting a standard Chrome user-agent, Google treats this as a regular browser
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            String originalUA = settings.getUserAgentString();
            // Remove "wv" flag from user-agent so Google doesn't detect it as a WebView
            String modifiedUA = originalUA.replace("; wv)", ")");
            settings.setUserAgentString(modifiedUA);
        }
    }
}
