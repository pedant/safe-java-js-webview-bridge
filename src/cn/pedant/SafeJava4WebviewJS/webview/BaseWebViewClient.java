/**
 * Summary: 应用中使用的WebViewClient基类
 * Version 1.0
 * Date: 13-11-8
 * Time: 下午2:30
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.webview;

import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import cn.pedant.SafeJava4WebviewJS.util.Log;

public class BaseWebViewClient extends WebViewClient {
    private static BaseWebViewClient mInstance;
    private static final String PROTOCOL_HEADER = "scheme:///";

    public static BaseWebViewClient getInstance () {
        if (mInstance == null) {
            mInstance = new BaseWebViewClient();
        }
        return mInstance;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        BaseWebView baseWebView = (BaseWebView)view;
        if (baseWebView.getLinkClickListener() != null) {
            baseWebView.getLinkClickListener().clickLink(url);   //上层有监听则回调
        } else if (url != null && url.length() > PROTOCOL_HEADER.length() && url.startsWith(PROTOCOL_HEADER)) {   // WebView内部调用第三方应用自由协议传入
            try {
                Uri uri = Uri.parse(url.substring(PROTOCOL_HEADER.length()));
                view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception e) {
                Log.e("no scheme recieve the intent:" + e.getMessage());
            }
        } else {
            baseWebView.reload(url);      // 使用自己的WebView组件来响应Url加载事件，而不是使用默认浏览器器加载页面
        }
        return true; // 消耗掉事件
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        // 页面开始加载时，状态重置
        BaseWebView baseWebView = (BaseWebView)view;
        baseWebView.setIsLoading(true);
        baseWebView.setIsInjectedJS(false);
        Log.d("page start:" + url);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        Log.d("page finish:" + url);

        BaseWebView baseWebView = (BaseWebView)view;
        //html加载完成后再加载图片资源
        if(!baseWebView.getSettings().getLoadsImagesAutomatically()) {
            baseWebView.getSettings().setLoadsImagesAutomatically(true);
        }
        baseWebView.setIsLoading(false);
        if (baseWebView.getLoadEndListener() != null) {
            baseWebView.getLoadEndListener().loadEnd(true);   //上层有监听则回调
        }
    }

    @Override
    public void onLoadResource(WebView view, String url) {
        super.onLoadResource(view, url);
    }

    @Override
    public void onReceivedError (WebView view, int errorCode, String description, String failingUrl) {
        super.onReceivedError(view, errorCode, description, failingUrl);
        BaseWebView baseWebView = (BaseWebView)view;
        baseWebView.onPageLoadedError(errorCode, description);
    }

    //当load有ssl层的https页面时，如果这个网站的安全证书在Android无法得到认证，WebView就会变成一个空白页，而并不会像PC浏览器中那样跳出一个风险提示框
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        //忽略证书的错误继续Load页面内容
        handler.proceed();
        //handler.cancel(); // Android默认的处理方式
        //handleMessage(Message msg); // 进行其他处理
        //super.onReceivedSslError(view, handler, error);
    }
}
