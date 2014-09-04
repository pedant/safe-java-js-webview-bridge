/**
 * Summary: 应用中使用的WebChromeClient基类
 * Version 1.0
 * Date: 13-11-8
 * Time: 下午2:31
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.webview;

import android.webkit.*;
import cn.pedant.SafeJava4WebviewJS.MainApp;
import cn.pedant.SafeJava4WebviewJS.util.Log;


public class BaseWebChromeClient extends WebChromeClient {
    private static BaseWebChromeClient mInstance;

    public static BaseWebChromeClient getInstance () {
        if (mInstance == null) {
            mInstance = new BaseWebChromeClient();
        }
        return mInstance;
    }

    // 处理Alert事件
    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
        result.confirm();
        return true;
    }

    @Override
    public void onProgressChanged (WebView view, int newProgress) {
        BaseWebView baseWebView = (BaseWebView)view;
        //为什么要在这里注入JS
        //1 OnPageStarted中注入有可能全局注入不成功，导致页面脚本上所有接口任何时候都不可用
        //2 OnPageFinished中注入，虽然最后都会全局注入成功，但是完成时间有可能太晚，当页面在初始化调用接口函数时会等待时间过长
        //3 在进度变化时注入，刚好可以在上面两个问题中得到一个折中处理
        //为什么是进度大于25%才进行注入，因为从测试看来只有进度大于这个数字页面才真正得到框架刷新加载，保证100%注入成功
        if (newProgress > 25 && !baseWebView.isInjectedJS()) {
            baseWebView.loadJS(MainApp.getIns().getJsCallJava().getPreloadInterfaceJS());
            baseWebView.setIsInjectedJS(true);
            Log.d(" inject js interface completely on progress " + newProgress);
        }
        super.onProgressChanged(view, newProgress);
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
        result.confirm(MainApp.getIns().getJsCallJava().call(view, message));
        return true;
    }

    @Override
    public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        // we MUST return true we are done with debugging
        return !MainApp.IS_DEBUGING;  // return false to enable console.log
    }
}
