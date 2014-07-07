/**
 * Summary: JSInterface实现
 * Version 1.0
 * Author: zhaomi@jugame.com.cn
 * Company: www.mjgame.cn
 * Date: 13-11-20
 * Time: 下午4:30
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.webview.bridge;

import android.text.TextUtils;
import android.webkit.WebView;
import cn.pedant.SafeJava4WebviewJS.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.HashMap;

public class JsCallJava {
    private static HashMap<String, Method> mMethodMap;
    private static final String RETURN_RESULT_FORMAT = "{\"code\": %d, \"result\": %s}";
    public static String PRELOAD_INTERFACE_JS;

    public static void init () {
        try {
            Class<?> SCOPECLASS = Class.forName("cn.pedant.SafeJava4WebviewJS.webview.bridge.HostJsScope");
            mMethodMap = new HashMap<String, Method>();
            //获取自身声明的所有方法（包括public private protected）， getMethods会获得所有继承与非继承的方法
            Method[] methods = SCOPECLASS.getDeclaredMethods();
            StringBuilder sb = new StringBuilder("javascript:(function(e){console.log(\"HostApp initialization begin\");var f={queue:[],callback:function(){var a=Array.prototype.slice.call(arguments,0);var b=a.shift();var c = a.shift();this.queue[b].apply(this,a);if(!c)delete this.queue[b]}};");
            String methodName;
            for (Method method : methods) {
                //非公用静态方法，直接跳过
                if (method.getModifiers() != (Modifier.PUBLIC | Modifier.STATIC)) {
                    continue;
                }
                methodName = method.getName();
                mMethodMap.put(keyConcat(methodName, method.getParameterTypes().length), method);
                sb.append(String.format("f.%s=", methodName));
            }
            sb.append("function(){var a=Array.prototype.slice.call(arguments,0);if(a.length<1){throw\"HostApp call error, message:miss method name\";}for(var i=1;i<a.length;i++){var b=a[i];if(typeof b==\"function\"){var c=f.queue.length;f.queue[c]=b;a[i]=c}}var d=JSON.parse(prompt(JSON.stringify({method:a.shift(),args:a})));if(d.code!=200){throw\"HostApp call error, code:\"+d.code+\", message:\"+d.result;}return d.result};Object.getOwnPropertyNames(f).forEach(function(a){var b=f[a];if(typeof b==='function'&&a!=='callback'){f[a]=function(){return b.apply(f,[a].concat(Array.prototype.slice.call(arguments,0)))}}});e.HostApp=f;console.log(\"HostApp initialization end\")})(window);");
            PRELOAD_INTERFACE_JS = sb.toString();
        } catch(Exception e){
            Log.e("init js error:" + e.getMessage());
        }
    }

    private static String keyConcat (String name, int len) {
        return name + "_" + len;
    }

    private static String getReturn (String reqJson, int stateCode, Object result) {
        String insertRes = String.valueOf(result);
        if (result instanceof String) {
            insertRes = "\"" + insertRes + "\"";
        }
        String resStr = String.format(RETURN_RESULT_FORMAT, stateCode, insertRes);
        Log.d("HostApp call json: " + reqJson + " result:" + resStr);
        return resStr;
    }

    public static String call(WebView webView, String jsonStr) {
        if (!TextUtils.isEmpty(jsonStr)) {
            try {
                JSONObject callJson = new JSONObject(jsonStr);
                String methodName = callJson.getString("method");
                JSONArray argsJson = callJson.getJSONArray("args");
                //带上默认的第一个参数WebView
                int argsLen = argsJson.length() + 1;
                Method currMethod = mMethodMap.get(keyConcat(methodName, argsLen));
                if (currMethod == null) {
                    return getReturn(jsonStr, 500, "not found method " + methodName + " with " + argsLen + " parameters");
                }
                Object[] args = new Object[argsLen];
                Class[] types = currMethod.getParameterTypes();
                int defValue = 0;
                for (int k = 0;k < argsLen;k++) {
                    Class currType = types[k];
                    if (currType == WebView.class) {
                        args[k] = webView;
                        defValue = -1;
                    } else if (currType == int.class) {
                        args[k] = argsJson.getInt(k + defValue);
                    } else if (currType == long.class) {
                        //WARN: argsJson.getLong(k + defValue) will return a bigger incorrect number
                        args[k] = Long.parseLong(argsJson.getString(k + defValue));
                    } else if (currType == boolean.class) {
                        args[k] = argsJson.getBoolean(k + defValue);
                    } else if (currType == Double.class) {
                        args[k] = argsJson.getDouble(k + defValue);
                    } else if (currType == JSONObject.class) {
                        args[k] = argsJson.getJSONObject(k + defValue);
                    } else if (currType == JsCallback.class) {
                        args[k] = new JsCallback(webView, argsJson.getInt(k + defValue));
                    } else {    //其他类型统一转换为字符串
                        args[k] = argsJson.getString(k + defValue);
                    }
                }
                return getReturn(jsonStr, 200, currMethod.invoke(null, args));
            } catch (Exception e) {
                //优先返回详细的错误信息
                if (e.getCause() != null) {
                    return getReturn(jsonStr, 500, "method execute error:" + e.getCause().getMessage());
                }
                return getReturn(jsonStr, 500, "method execute error:" + e.getMessage());
            }
        } else {
            return getReturn(jsonStr, 500, "call data empty");
        }
    }
}