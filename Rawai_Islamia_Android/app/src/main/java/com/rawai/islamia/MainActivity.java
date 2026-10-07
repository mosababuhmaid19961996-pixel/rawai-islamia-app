package com.rawai.islamia;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.Build;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        requestNotificationPermission();
        NotificationScheduler.schedule(this);

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
        webView.addJavascriptInterface(new AndroidBridge(), "Android");

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
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "تعذر بدء التنزيل", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // زر الرجوع في شريط الهاتف: يرجع داخل صفحات التطبيق أولاً،
        // وإذا لم توجد صفحة سابقة يغلق التطبيق بشكل طبيعي.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1001);
        }
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void requestNotifications() {
            runOnUiThread(() -> requestNotificationPermission());
        }

        @JavascriptInterface
        public void setNotificationsEnabled(boolean enabled) {
            runOnUiThread(() -> {
                NotificationScheduler.setEnabled(MainActivity.this, enabled);
                Toast.makeText(MainActivity.this,
                        enabled ? "تم تفعيل التذكيرات كل 3 ساعات" : "تم إيقاف التذكيرات الدينية",
                        Toast.LENGTH_SHORT).show();
                if (enabled) requestNotificationPermission();
            });
        }

        @JavascriptInterface
        public boolean notificationsEnabled() {
            return NotificationScheduler.isEnabled(MainActivity.this);
        }

        @JavascriptInterface
        public String notificationTimes() {
            return NotificationScheduler.getTimes(MainActivity.this);
        }

        @JavascriptInterface
        public void setNotificationTimes(String times) {
            runOnUiThread(() -> {
                NotificationScheduler.setTimes(MainActivity.this, times);
                Toast.makeText(MainActivity.this, "تم حفظ أوقات التذكير", Toast.LENGTH_SHORT).show();
            });
        }
    }
}
