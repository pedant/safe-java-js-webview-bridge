package cn.pedant.SafeJava4WebviewJS;

import android.app.Application;
import cn.pedant.SafeJava4WebviewJS.util.TaskExecutor;
import cn.pedant.SafeJava4WebviewJS.webview.bridge.JsCallJava;

public class MainApp extends Application {
    //调试状态中
    public final static boolean IS_DEBUGING = true;

    //Debug日志输出Tag
    public final static String LOG_TAG = "safejava4";

    public static MainApp getIns() {
        return gMainApp;
    }

    private final Object mLock = new Object();
    private static MainApp gMainApp;
    private JsCallJava mJsCallJava;

    @Override
    public void onCreate() {
        super.onCreate();
        TaskExecutor.executeTask(new Runnable() {
            @Override
            public void run() {
                synchronized (mLock) {
                    mJsCallJava = new JsCallJava();
                }
            }
        });
        gMainApp = this;
    }

    public JsCallJava getJsCallJava () {
        synchronized (mLock) {
            return mJsCallJava;
        }
    }
}