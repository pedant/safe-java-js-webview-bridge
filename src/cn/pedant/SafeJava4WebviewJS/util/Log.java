package cn.pedant.SafeJava4WebviewJS.util;

import cn.pedant.SafeJava4WebviewJS.MainApp;

public class Log {

    private static void log (int type, String message) {
        StackTraceElement stackTrace = Thread.currentThread().getStackTrace()[4];
        String className = stackTrace.getClassName();
        String tag = MainApp.LOG_TAG;
        String fromCode = className.substring(className.lastIndexOf('.') + 1) + "." + stackTrace.getMethodName() + "#" + stackTrace.getLineNumber();
        message = "from code:" + fromCode + "\n" + message;
        switch (type) {
            case android.util.Log.DEBUG:
                android.util.Log.d(tag, message);
                break;
            case android.util.Log.INFO:
                android.util.Log.i(tag, message);
                break;
            case android.util.Log.WARN:
                android.util.Log.w(tag, message);
                break;
            case android.util.Log.ERROR:
                android.util.Log.e(tag, message);
                break;
            case android.util.Log.VERBOSE:
                android.util.Log.v(tag, message);
                break;
        }
    }

    public static void d (String message) {
        if (MainApp.IS_DEBUGING) log(android.util.Log.DEBUG, message);
    }

    public static void i (String message) {
        if (MainApp.IS_DEBUGING) log(android.util.Log.INFO, message);
    }

    public static void w (String message) {
        if (MainApp.IS_DEBUGING) log(android.util.Log.WARN, message);
    }

    public static void e (String message) {
        log(android.util.Log.ERROR, message);
    }

    public static void v (String message) {
        if (MainApp.IS_DEBUGING) log(android.util.Log.VERBOSE, message);
    }
}
