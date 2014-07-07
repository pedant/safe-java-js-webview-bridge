/**
 * Summary: js脚本所能执行的函数空间
 * Version 1.0
 * Author: zhaomi@jugame.com.cn
 * Company: www.mjgame.cn
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

//HostJsScope中需要被JS调用的函数，必须定义成public static，且必须包含WebView这个参数，其他参数为可转换为字符串的类型，返回值可为void 或 能被String.valueOf转换的类型
public class HostJsScope {
    /**
     * 短暂气泡提醒
     * @param webView 浏览器
     * @param message 提示信息
     * */
    public static void toast (final WebView webView, String message) {
        Toast.makeText(webView.getContext(), message, Toast.LENGTH_SHORT).show();
    }

    /**
     * 可选择时间长短的气泡提醒
     * @param webView 浏览器
     * @param message 提示信息
     * @param isShowLong 提醒时间方式
     * */
    public static void toast (final WebView webView, String message, int isShowLong) {
        Toast.makeText(webView.getContext(), message, isShowLong).show();
    }

    /**
     * 弹出记录的测试JS层到Java层代码执行损耗时间差
     * @param webView 浏览器
     * @param timeStamp js层执行时的时间戳
     * */
    public static void testLossTime (final WebView webView, long timeStamp) {
        timeStamp = System.currentTimeMillis() - timeStamp;
        Log.d("HostApp test loss time:" + timeStamp);
        alert(webView, String.valueOf(timeStamp));
    }

    /**
     * 系统弹出提示框
     * @param webView 浏览器
     * @param message 提示信息
     * */
    public static void alert (final WebView webView, String message) {
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
    public static String getIMEI (final WebView webView) {
        return EnvironUtil.getIMEI();
    }

    /**
     * 获取设备IMSI
     * @param webView 浏览器
     * @return 设备IMSI
     * */
    public static String getIMSI (final WebView webView) {
        return EnvironUtil.getIMSI();
    }

    /**
     * 获取用户系统版本大小
     * @param webView 浏览器
     * @return 安卓SDK版本
     * */
    public static int getOsSdk (final WebView webView) {
        return EnvironUtil.getOsSdk();
    }

    //---------------- 界面切换类 ------------------

    /**
     * 结束当前窗口
     * @param view 浏览器
     * */
    public static void goBack (final WebView view) {
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
    public static void setOnScrollBottomListener (final WebView view, int threshold, JsCallback jsCallback) {
        //回调函数对象在当前页面的生命周期内永久保留
        jsCallback.setPermanent(true);
        ((BaseWebView)view).setOnScrollBottomListener(threshold, jsCallback);
    }

    /**
     * 当前浏览器是否存在滚动条
     * @param view 浏览器
     * @return boolean
     * */
    public static boolean existVerticalScrollbar (final WebView view) {
        return ((BaseWebView)view).existVerticalScrollbar();
    }

}