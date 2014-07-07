/**
 * Summary: 应用周围设备环境值控制工具类
 * Version 1.0
 * Author: zhaomi@jugame.com.cn
 * Company: muji.com
 * Date: 13-11-5
 * Time: 下午5:17
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.util;

import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.telephony.TelephonyManager;
import android.util.DisplayMetrics;
import cn.pedant.SafeJava4WebviewJS.MainApp;

import java.lang.reflect.Method;

public class EnvironUtil {
    private static TelephonyManager telephonyManager;
    private static ConnectivityManager connectivityManager;
    private static AudioManager audioManager;
    private static WifiManager wifiManager;
    private static String uuid;
    private static String imei;
    private static String imsi;
    private static String mac;
    private static int osSdk;
    private static String deviceModel;
    private static int lastVolume;

    public static String getIMEI () {
        if (imei != null) {
            return imei;
        }
        ensureTelephonyManager();
        imei = telephonyManager.getDeviceId();
        return imei;
    }

    public static String getIMSI () {
        if (imsi != null) {
            return imsi;
        }
        ensureTelephonyManager();
        imsi = telephonyManager.getSubscriberId();
        return imsi;
    }

    public static String getMac () {
        if (mac != null) {
            return mac;
        }
        ensureConnectivityManager();
        NetworkInfo myWifi = connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
        if (myWifi.isConnected()) {
            ensureWifiManager();
            if (wifiManager.getConnectionInfo() != null) {
                mac =  wifiManager.getConnectionInfo().getMacAddress();
            }
        }
        return mac;
    }

    public static int getOsSdk () {
        if (osSdk != 0) {
            return osSdk;
        }

        osSdk = Build.VERSION.SDK_INT;

        return osSdk;
    }

    public static String getDeviceModel () {
        if (deviceModel != null) {
            return deviceModel;
        }

        deviceModel = Build.MODEL;

        return deviceModel;
    }

    private static void ensureTelephonyManager () {
        if (telephonyManager == null) {
            telephonyManager = (TelephonyManager) MainApp.getInstance().getSystemService(Context.TELEPHONY_SERVICE);
        }
    }

    private static void ensureConnectivityManager () {
        if (connectivityManager == null) {
            connectivityManager = (ConnectivityManager) MainApp.getInstance().getSystemService(Context.CONNECTIVITY_SERVICE);
        }
    }

    private static void ensureWifiManager () {
        if (wifiManager == null) {
            wifiManager = (WifiManager) MainApp.getInstance().getSystemService(Context.WIFI_SERVICE);
        }
    }

    private static void ensureAudioManager () {
        if (audioManager == null) {
            audioManager = (AudioManager) MainApp.getInstance().getSystemService(Context.AUDIO_SERVICE);
        }
    }

    /**
     * 网络是否可用
     *
     * @return
     */
    public static boolean isNetworkAvailable() {
        ensureConnectivityManager();
        NetworkInfo[] info = connectivityManager.getAllNetworkInfo();
        if (info != null) {
            for (int i = 0; i < info.length; i++) {
                if (info[i].getState() == NetworkInfo.State.CONNECTED) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 音量开关
     *
     * return 当前的Media声音是否打开
     */
    public static boolean switchVolumeCloset () {
        ensureAudioManager();
        boolean isVolEnabled = isVolumeEnabled();
        if (isVolEnabled) {  //保存当前的音量，置为静音
            lastVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, 0);
        } else {
            if(lastVolume != 0) {
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, lastVolume, 0);
            } else {
                int volume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC) / 2;
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, volume, 0);
            }
        }
        return !isVolEnabled;
    }

    public static boolean isVolumeEnabled () {
        ensureAudioManager();
        return audioManager.getStreamVolume(AudioManager.STREAM_MUSIC) > 0;
    }

    /**
     * WiFi开关
     *
     * return 当前的WiFi是否打开
     */
    public static boolean switchWiFiCloset () {
        ensureWifiManager();
        boolean isWifiConn = isWifiEnabled();
        wifiManager.setWifiEnabled(!isWifiConn);
        return !isWifiConn;
    }

    public static boolean isWifiEnabled () {
        ensureWifiManager();
        return wifiManager.isWifiEnabled();
    }

    /**
     * GPRS开关
     *
     * return 当前的GPRS是否打开
     */
    public static boolean switchGprsCloset () {
        ensureConnectivityManager();
        Class<?> cls = connectivityManager.getClass();
        boolean isGprsConn = isGprsEnabled();
        try {
            Method setMethod = cls.getMethod("setMobileDataEnabled", new Class<?>[]{boolean.class});
            setMethod.invoke(connectivityManager, !isGprsConn);
        } catch (Exception ex) {}
        return !isGprsConn;
    }

    public static boolean isGprsEnabled () {
        ensureConnectivityManager();
        Class<?> cls = connectivityManager.getClass();
        try {
            Method getMethod = cls.getMethod("getMobileDataEnabled");
            return (Boolean)getMethod.invoke(connectivityManager);
        } catch (Exception ex) {}
        return false;
    }

    public static int getScreenWidth (Activity activity) {
        DisplayMetrics displaymetrics = new DisplayMetrics();
        activity.getWindowManager().getDefaultDisplay().getMetrics(displaymetrics);
        return displaymetrics.widthPixels;
    }

    public static int getScreenHeight (Activity activity) {
        DisplayMetrics displayMetrics = new DisplayMetrics();
        activity.getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
        return  displayMetrics.heightPixels;
    }
}