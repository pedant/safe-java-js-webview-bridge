package cn.pedant.SafeJava4WebviewJS.webview.bridge;

import android.text.TextUtils;
import android.webkit.WebView;
import cn.pedant.SafeJava4WebviewJS.util.JacksonKit;
import cn.pedant.SafeJava4WebviewJS.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class JsCallJava {
    private HashMap<String, Method> mSingleMethodMap;
    private HashMap<String, List<Method>> mMultiMethodsMap;
    private final String RETURN_RESULT_FORMAT = "{\"code\": %d, \"result\": %s}";
    private String mPreloadInterfaceJS;

    public JsCallJava () {
        try {
            mSingleMethodMap = new HashMap<String, Method>();
            mMultiMethodsMap = new HashMap<String, List<Method>>();
            //获取自身声明的所有方法（包括public private protected）， getMethods会获得所有继承与非继承的方法
            Method[] methods = HostJsScope.class.getDeclaredMethods();
            StringBuilder sb = new StringBuilder("javascript:(function(e){console.log(\"HostApp initialization begin\");var f={queue:[],callback:function(){var a=Array.prototype.slice.call(arguments,0);var b=a.shift();var c = a.shift();this.queue[b].apply(this,a);if(!c)delete this.queue[b]}};");
            String methodName;
            String mkey;
            for (Method method : methods) {
                //非公用静态方法，直接跳过
                if (method.getModifiers() != (Modifier.PUBLIC | Modifier.STATIC)) {
                    continue;
                }
                methodName = method.getName();
                mkey = keyConcat(methodName, method.getParameterTypes().length);

                Method currSingleMethod = mSingleMethodMap.get(mkey);
                List<Method> currMultiMethods = mMultiMethodsMap.get(mkey);

                if (currSingleMethod == null && currMultiMethods == null) { // 第一次扫描到该方法
                    mSingleMethodMap.put(mkey, method);
                    sb.append(String.format("f.%s=", methodName));
                    continue;
                }

                if (currSingleMethod != null && currMultiMethods == null) {  // 方法被首次重载，则建立链表关系
                    currMultiMethods = new ArrayList<Method>();
                    currMultiMethods.add(mSingleMethodMap.remove(mkey));  // 转移上一个方法声明到MultiMap
                    mMultiMethodsMap.put(mkey, currMultiMethods);
                }
                // 其他情况则只为方法被第>=2次重载，则直接加入List；不可能出现currSingleMethod与currMultiMethods都不为NULL的情况
                currMultiMethods.add(method);
            }
            sb.append("function(){var a=Array.prototype.slice.call(arguments,0);if(a.length<1){throw\"HostApp call error, message:miss method name\";}for(var i=1;i<a.length;i++){var b=a[i];if(typeof b==\"function\"){var c=f.queue.length;f.queue[c]=b;a[i]=c}}var d=JSON.parse(prompt(JSON.stringify({method:a.shift(),args:a})));if(d.code!=200){throw\"HostApp call error, code:\"+d.code+\", message:\"+d.result;}return d.result};Object.getOwnPropertyNames(f).forEach(function(a){var b=f[a];if(typeof b==='function'&&a!=='callback'){f[a]=function(){return b.apply(f,[a].concat(Array.prototype.slice.call(arguments,0)))}}});e.HostApp=f;console.log(\"HostApp initialization end\")})(window);");
            mPreloadInterfaceJS = sb.toString();
        } catch(Exception e){
            Log.e("init js error:" + e.getMessage());
        }
    }

    private static String keyConcat (String name, int len) {
        return name + "_" + len;
    }

    public String getPreloadInterfaceJS () {
        return mPreloadInterfaceJS;
    }

    private String getReturn (String reqJson, int stateCode, Object result) {
        String insertRes;
        if (result == null) {
            insertRes = "null";
        } else if (result instanceof String) {
            insertRes = "\"" + result + "\"";
        } else if (!(result instanceof Integer)
                && !(result instanceof Long)
                && !(result instanceof Boolean)
                && !(result instanceof Float)
                && !(result instanceof Double)) {    // 非数字或者非字符串的构造对象类型都要序列化后再拼接
            try {
                insertRes = JacksonKit.encode(result, true);
            } catch (Exception e) {
                stateCode = 500;
                insertRes = "json encode result error:" + e.getMessage();
            }
        } else {  //数字直接转化
            insertRes = String.valueOf(result);
        }
        String resStr = String.format(RETURN_RESULT_FORMAT, stateCode, insertRes);
        Log.d("HostApp call json: " + reqJson + " result:" + resStr);
        return resStr;
    }

    public String call(WebView webView, String jsonStr) {
        if (!TextUtils.isEmpty(jsonStr)) {
            try {
                JSONObject callJson = new JSONObject(jsonStr);
                String methodName = callJson.getString("method");
                JSONArray argsJson = callJson.getJSONArray("args");
                //带上默认的第一个参数WebView
                int argsLen = argsJson.length() + 1;
                // 在未重载的方法集合中查寻
                String mkey = keyConcat(methodName, argsLen);
                Method currMethod = mSingleMethodMap.get(mkey);
                Object[] args = null;
                List<Method> currMultiMethods;

                if (currMethod != null) {
                    args = detectMethodArgs(webView, currMethod, argsLen, argsJson);
                } else if ((currMultiMethods = mMultiMethodsMap.get(mkey)) != null) {
                    for (Method dMethod : currMultiMethods) {
                        args = detectMethodArgs(webView, dMethod, argsLen, argsJson);
                        if (args != null) {
                            currMethod = dMethod;
                            break;
                        }
                    }
                }

                if (args == null) {
                    return getReturn(jsonStr, 500, "not found method " + methodName + " with " + argsLen + " parameters");
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

    private Object[] detectMethodArgs (WebView webView, Method method, int argsLen, JSONArray argsJson) {
        Object[] args = new Object[argsLen];
        Class[] types = method.getParameterTypes();
        int defValue = 0;
        try {
            // 只有一个参数类型匹配失败则认为该方法不合适
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
                } else if (currType == float.class) {
                    args[k] = argsJson.getDouble(k + defValue);
                } else if (currType == double.class) {
                    args[k] = argsJson.getDouble(k + defValue);
                } else if (argsJson.isNull(k + defValue)) {
                    args[k] = null;
                } else if (currType == JSONObject.class) {
                    args[k] = argsJson.getJSONObject(k + defValue);
                } else if (currType == JSONArray.class) {
                    args[k] = argsJson.getJSONArray(k + defValue);
                } else if (currType == JsCallback.class) {
                    args[k] = new JsCallback(webView, argsJson.getInt(k + defValue));
                } else {    //其他类型统一转换为字符串
                    args[k] = argsJson.getString(k + defValue);
                }
            }
        } catch (JSONException je) {
            return null;
        }
        return args;
    }
}