package com.kangal.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private boolean isShowingOfflinePage = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make the navigation bar match our dark theme
        getWindow().setNavigationBarColor(Color.parseColor("#09090b"));
    }

    @Override
    public void onStart() {
        super.onStart();

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();

            // Fix Google OAuth: remove "wv" flag from user-agent
            // Google blocks OAuth from WebViews (Error 403: disallowed_useragent)
            // By removing the "wv" marker, Google treats this as a regular Chrome browser
            String originalUA = settings.getUserAgentString();
            String modifiedUA = originalUA.replace("; wv)", ")");
            settings.setUserAgentString(modifiedUA);

            // Enable DOM storage for Supabase auth to work
            settings.setDomStorageEnabled(true);

            // Show offline fallback page when there's no internet
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedError(WebView view, WebResourceRequest request,
                                             WebResourceError error) {
                    // Only handle main frame errors (not sub-resources like images)
                    if (request.isForMainFrame()) {
                        isShowingOfflinePage = true;
                        view.loadUrl("file:///android_asset/public/offline.html");
                    }
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    // If the offline page reloads and succeeds, clear the flag
                    if (isShowingOfflinePage && !url.contains("offline.html")) {
                        isShowingOfflinePage = false;
                    }
                }
            });
        }
    }
}
