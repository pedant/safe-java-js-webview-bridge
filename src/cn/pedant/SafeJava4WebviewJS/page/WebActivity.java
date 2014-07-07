package cn.pedant.SafeJava4WebviewJS.page;

import android.app.Activity;
import android.os.Bundle;
import cn.pedant.SafeJava4WebviewJS.R;
import cn.pedant.SafeJava4WebviewJS.webview.BaseWebView;

public class WebActivity extends Activity {
    private BaseWebView mWebView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        mWebView = (BaseWebView)findViewById(R.id.webview_content);
        mWebView.loadUrl("file:///android_asset/test.html", true);
    }
}
