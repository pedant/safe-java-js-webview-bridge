/**
 * Summary: 主程序各视窗共享Application
 * Version 1.0
 * Author: zhaomi@jugame.com.cn
 * Company: muji.com
 * Date: 13-11-5
 * Time: 下午1:03
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS;

import android.app.Application;
import cn.pedant.SafeJava4WebviewJS.util.TaskExecutor;
import cn.pedant.SafeJava4WebviewJS.webview.bridge.JsCallJava;

public class MainApp extends Application {
    //调试状态中
    public final static boolean IS_DEBUGING = true;

    //Debug日志输出Tag
    public final static String LOG_TAG = "safejava4";

    private static MainApp gMainApp;

    @Override
    public void onCreate() {
        if (gMainApp != null) {
            return;
        }
        super.onCreate();
        gMainApp = this;
        TaskExecutor.executeTask(new Runnable() {
            @Override
            public void run() {
                JsCallJava.init();
            }
        });
    }

    public static MainApp getInstance () {
        return gMainApp;
    }
}