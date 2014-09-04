/**
 * Summary: js脚本所能执行的函数空间
 * Version 1.0
 * Date: 13-11-20
 * Time: 下午4:40
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.webview.bridge;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.webkit.WebView;
import android.widget.Toast;
import cn.pedant.SafeJava4WebviewJS.R;
import cn.pedant.SafeJava4WebviewJS.util.EnvironUtil;
import cn.pedant.SafeJava4WebviewJS.util.Log;
import cn.pedant.SafeJava4WebviewJS.webview.BaseWebView;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

//HostJsScope中需要被JS调用的函数，必须定义成public static，且必须包含WebView这个参数
public class HostJsScope {
    /**
     * 短暂气泡提醒
     * @param webView 浏览器
     * @param message 提示信息
     * */
    public static void toast (WebView webView, String message) {
        Toast.makeText(webView.getContext(), message, Toast.LENGTH_SHORT).show();
    }

    /**
     * 可选择时间长短的气泡提醒
     * @param webView 浏览器
     * @param message 提示信息
     * @param isShowLong 提醒时间方式
     * */
    public static void toast (WebView webView, String message, int isShowLong) {
        Toast.makeText(webView.getContext(), message, isShowLong).show();
    }

    /**
     * 弹出记录的测试JS层到Java层代码执行损耗时间差
     * @param webView 浏览器
     * @param timeStamp js层执行时的时间戳
     * */
    public static void testLossTime (WebView webView, long timeStamp) {
        timeStamp = System.currentTimeMillis() - timeStamp;
        Log.d("HostApp test loss time:" + timeStamp);
        alert(webView, String.valueOf(timeStamp));
    }

    /**
     * 系统弹出提示框
     * @param webView 浏览器
     * @param message 提示信息
     * */
    public static void alert (WebView webView, String message) {
        // 构建一个Builder来显示网页中的alert对话框
        AlertDialog.Builder builder = new AlertDialog.Builder(webView.getContext());
        builder.setTitle(webView.getContext().getString(R.string.dialog_title_system_msg));
        builder.setMessage(message);
        builder.setPositiveButton(android.R.string.ok, new AlertDialog.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
            }
        });
        builder.setCancelable(false);
        builder.create();
        builder.show();
    }

    /**
     * 获取设备全球标识符IMEI
     * @param webView 浏览器
     * @return 设备全球标识符IMEI
     * */
    public static String getIMEI (WebView webView) {
        return EnvironUtil.getIMEI();
    }

    /**
     * 获取设备IMSI
     * @param webView 浏览器
     * @return 设备IMSI
     * */
    public static String getIMSI (WebView webView) {
        return EnvironUtil.getIMSI();
    }

    /**
     * 获取用户系统版本大小
     * @param webView 浏览器
     * @return 安卓SDK版本
     * */
    public static int getOsSdk (WebView webView) {
        return EnvironUtil.getOsSdk();
    }

    //---------------- 界面切换类 ------------------

    /**
     * 结束当前窗口
     * @param view 浏览器
     * */
    public static void goBack (WebView view) {
        if (view.getContext() instanceof Activity) {
            ((Activity)view.getContext()).finish();
        }
    }

    /**
     * 注册浏览器滚动到底部时的回调对象
     * @param view 浏览器
     * @param threshold 滚动条距离底部距离distance <= threshold，触发回调
     * @param jsCallback 回调的函数对象
     * */
    public static void setOnScrollBottomListener (WebView view, int threshold, JsCallback jsCallback) {
        //回调函数对象在当前页面的生命周期内永久保留
        jsCallback.setPermanent(true);
        ((BaseWebView)view).setOnScrollBottomListener(threshold, jsCallback);
    }

    /**
     * 当前浏览器是否存在滚动条
     * @param view 浏览器
     * @return boolean
     * */
    public static boolean existVerticalScrollbar (WebView view) {
        return ((BaseWebView)view).existVerticalScrollbar();
    }

    /**
     * 传入Json对象
     * @param view 浏览器
     * @param jo 传入的JSON对象
     * @return 返回对象的第一个键值对
     * */
    public static String passJson2Java (WebView view, JSONObject jo) {
        Iterator<String> iterator = jo.keys();
        String res = null;
        if(iterator.hasNext()) {
            try {
                String keyW = iterator.next();
                res = keyW + ": " + jo.getString(keyW);
            } catch (JSONException je) {

            }
        }
        return res;
    }

    /**
     * 将传入Json对象直接返回
     * @param view 浏览器
     * @param jo 传入的JSON对象
     * @return 返回对象的第一个键值对
     * */
    public static JSONObject retBackPassJson (WebView view, JSONObject jo) {
        return jo;
    }
}