package org.datasavercoin.faulkerverse;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.net.Uri;
import android.view.View;
import android.webkit.*;
import java.io.*;
import java.util.Collections;

/** Bundled offline game with an optional hosted multiplayer city. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/game/index.html?mobile=1";
    private WebView web;
    private final DialogInterface.OnClickListener exitListener = new DialogInterface.OnClickListener() { public void onClick(DialogInterface dialog, int which) { finish(); } };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        WebView.setWebContentsDebuggingEnabled(getIntent().getBooleanExtra("inspect_webview", false));
        web = new WebView(this);
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !local(request.getUrl()) && !online(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!local(uri)) return online(uri) ? null : failure(403, "Blocked");
                String path = uri.getPath().substring(1);
                if (path.contains("..") || path.contains("\\")) return failure(403, "Blocked");
                try {
                    String mime = path.endsWith(".js") ? "application/javascript" : path.endsWith(".json") ? "application/json" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : path.endsWith(".png") ? "image/png" : "application/octet-stream";
                    return new WebResourceResponse(mime, "UTF-8", 200, "OK", Collections.singletonMap("Cache-Control", "no-cache"), getAssets().open(path));
                } catch (IOException error) { return failure(404, "Not found"); }
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                view.destroy();
                new AlertDialog.Builder(MainActivity.this).setTitle("Game stopped")
                    .setMessage("The browser renderer stopped, possibly due to memory pressure. Close other apps and restart FaulkerVerse.")
                    .setPositiveButton("Close", exitListener).setCancelable(false).show();
                web = null; return true;
            }
        });
        immersive();
        new AlertDialog.Builder(this).setTitle("FaulkerVerse")
            .setMessage("Offline plays the bundled city. Online connects to BeepBoop; join the same multiplayer room as your friend.")
            .setNegativeButton("Play offline", new DialogInterface.OnClickListener() { public void onClick(DialogInterface dialog, int which) { web.loadUrl(HOME); } })
            .setPositiveButton("Play online", new DialogInterface.OnClickListener() { public void onClick(DialogInterface dialog, int which) { web.loadUrl("http://104.187.83.156/previews/faulkerverse-downtown/?mobile=1"); } })
            .setCancelable(false).show();
    }
    private boolean online(Uri uri) {
        return ("http".equals(uri.getScheme()) && "104.187.83.156".equals(uri.getHost()) && (uri.getPort()==-1 || uri.getPort()==80) && uri.getPath()!=null && uri.getPath().startsWith("/previews/faulkerverse-downtown/"))
            || ("https".equals(uri.getScheme()) && "cdn.babylonjs.com".equals(uri.getHost()));
    }
    private boolean local(Uri uri) { return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/game/"); }
    private WebResourceResponse failure(int status, String message) { return new WebResourceResponse("text/plain", "UTF-8", status, message, Collections.emptyMap(), new ByteArrayInputStream(message.getBytes(java.nio.charset.StandardCharsets.UTF_8))); }
    private void immersive() { getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE); }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus) immersive(); }
    @Override protected void onPause() { if (web!=null) { web.evaluateJavascript("window.Faulker?.touchControls?.release?.();window.Faulker?.input?.reset?.();", null); web.onPause(); web.pauseTimers(); } super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web!=null) { web.onResume(); web.resumeTimers(); web.evaluateJavascript("window.Faulker?.touchControls?.release?.();window.Faulker?.input?.reset?.();", null); } }
    @Override public void onBackPressed() { new AlertDialog.Builder(this).setTitle("Leave FaulkerVerse?").setMessage("This session's rides and earnings are not saved.").setNegativeButton("Keep playing", null).setPositiveButton("Exit", exitListener).show(); }
    @Override protected void onDestroy() { if (web!=null) { web.stopLoading(); web.destroy(); web=null; } super.onDestroy(); }
}
