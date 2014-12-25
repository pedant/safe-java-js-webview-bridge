/**
 * Summary: 应用中使用的WebChromeClient基类
 * Version 1.0
 * Date: 13-11-8
 * Time: 下午2:31
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeWebViewBridge;

import android.util.Log;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;


public class InjectedChromeClient extends WebChromeClient {
    private final String TAG = "InjectedChromeClient";
    private JsCallJava mJsCallJava;
    private boolean mIsInjectedJS;

    public InjectedChromeClient (String injectedName, Class injectedCls) {
        mJsCallJava = new JsCallJava(injectedName, injectedCls);
    }

    public InjectedChromeClient (JsCallJava jsCallJava) {
        mJsCallJava = jsCallJava;
    }
    
    // 处理Alert事件
    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
        result.confirm();
        return true;
    }

    @Override
    public void onProgressChanged (WebView view, int newProgress) {
        //为什么要在这里注入JS
        //1 OnPageStarted中注入有可能全局注入不成功，导致页面脚本上所有接口任何时候都不可用
        //2 OnPageFinished中注入，虽然最后都会全局注入成功，但是完成时间有可能太晚，当页面在初始化调用接口函数时会等待时间过长
        //3 在进度变化时注入，刚好可以在上面两个问题中得到一个折中处理
        //为什么是进度大于25%才进行注入，因为从测试看来只有进度大于这个数字页面才真正得到框架刷新加载，保证100%注入成功
        if (newProgress <= 25) {
            mIsInjectedJS = false;
        } else if (!mIsInjectedJS) {
            view.loadUrl(mJsCallJava.getPreloadInterfaceJS());
            mIsInjectedJS = true;
            Log.d(TAG, " inject js interface completely on progress " + newProgress);

        }
        super.onProgressChanged(view, newProgress);
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
        result.confirm(mJsCallJava.call(view, message));
        return true;
    }
}
