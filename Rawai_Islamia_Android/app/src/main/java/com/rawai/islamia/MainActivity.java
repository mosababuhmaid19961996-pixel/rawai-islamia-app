package com.rawai.islamia;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return loader.shouldInterceptRequest(Uri.parse(url));
            }
        });
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setDownloadListener(new DownloadListener() {
            @Override public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                    req.setMimeType(mimetype);
                    String cookies = CookieManager.getInstance().getCookie(url);
                    if (cookies != null) req.addRequestHeader("Cookie", cookies);
                    req.addRequestHeader("User-Agent", userAgent);
                    req.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype));
                    req.setDescription("تنزيل من روائع إسلامية");
                    req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    req.setDestinationInExternalFilesDir(MainActivity.this, Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimetype));
                    ((DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(req);
                    Toast.makeText(MainActivity.this, "بدأ تنزيل الملف الصوتي", Toast.LENGTH_SHORT).show();
                } catch (Exception e) { Toast.makeText(MainActivity.this, "تعذر بدء التنزيل", Toast.LENGTH_SHORT).show(); }
            }
        });
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }
    @Override public void onBackPressed() { if (webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
}
