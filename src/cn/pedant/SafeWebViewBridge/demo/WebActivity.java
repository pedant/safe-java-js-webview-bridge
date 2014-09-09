package cn.pedant.SafeWebViewBridge.demo;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import cn.pedant.SafeWebViewBridge.bridge.InjectedChromeClient;

public class WebActivity extends Activity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView wv = new WebView(this);
        setContentView(wv);
        WebSettings ws = wv.getSettings();
        ws.setJavaScriptEnabled(true);
        wv.setWebChromeClient(new InjectedChromeClient(HostJsScope.class));
        wv.loadUrl("file:///android_asset/test.html");
    }
}
