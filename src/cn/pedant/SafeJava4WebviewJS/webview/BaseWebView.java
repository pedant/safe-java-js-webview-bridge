/**
 * Summary: 应用中使用的WebView基类
 * Version 1.0
 * Date: 13-11-8
 * Time: 下午1:58
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.webview;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import cn.pedant.SafeJava4WebviewJS.R;
import cn.pedant.SafeJava4WebviewJS.util.EnvironUtil;
import cn.pedant.SafeJava4WebviewJS.util.Log;
import cn.pedant.SafeJava4WebviewJS.util.NetService;
import cn.pedant.SafeJava4WebviewJS.util.TaskExecutor;
import cn.pedant.SafeJava4WebviewJS.webview.bridge.JsCallback;

public class BaseWebView extends WebView {
    private final float mErrorTopRate = 0.18f;
    private FrameLayout mErrorFrame;
    private boolean mIsLoading = true;
    private boolean mIsInjectedJS = false;
    private float mCurrContentHeight;
    private int mThreshold;
    private JsCallback mJsCallBack;
    private String mLoadUrl;
    private OnVerticalScrolledListener mVScrolledListener;
    private View mParentView;
    private OnLinkClickListener mLinkClickListener;
    private OnLoadEndListener mLoadEndListener;

    public static interface OnVerticalScrolledListener {
        public void scrolled(BaseWebView view, int newY, int oldY);
    }

    public void setParentView (View view) {
        mParentView = view;
    }

    public void setIsInjectedJS (boolean value) {
        mIsInjectedJS = value;
    }

    public boolean isInjectedJS () {
        return  mIsInjectedJS;
    }

    public void setIsLoading (boolean value) {
        mIsLoading = value;
    }

    public boolean isLoading () {
        return  mIsLoading;
    }

    public OnLoadEndListener getLoadEndListener () {
        return mLoadEndListener;
    }

    public void setLoadEndListener (OnLoadEndListener listener) {
        mLoadEndListener = listener;
    }

    public boolean reload (String url) {
        //存在单页面生命周期内的变量重置
        mThreshold = 0;
        mCurrContentHeight = 0;
        mJsCallBack = null;
        ensureView();
        mErrorFrame.setVisibility(View.GONE);
        if (!TextUtils.isEmpty(url)) {
            loadUrl(url);
            return true;
        }
        return false;
    }

    @Override
    public String getUrl() {
        return mLoadUrl;
    }

    @Override
    public void reload () {
        reload(mLoadUrl);
    }

    @Override
    public void loadUrl(String url) {
        mLoadUrl = url;
        loadWithAccessLocal();
    }
    /**
     * param url 将加载的网页的地址
     * param isLocalFile 是否为本地assets下文件， 否则为远程网页
     * */
    public void loadUrl(String url, boolean isLocalFile) {
        mLoadUrl = url;
        if(isLocalFile) {
            super.loadUrl(url);
        } else {
            loadWithAccessLocal();
        }
    }

    public void onPageLoadedError(int errorCode, String description) {
        mIsLoading = false;
        loadDataWithBaseURL(null, "", "text/html", "utf-8", null);        //清除上一次显示的内容
        Log.e(String.format(getContext().getString(R.string.webview_load_fail), mLoadUrl, errorCode, description));
        if (mLoadEndListener != null) {
            mLoadEndListener.loadEnd(false);   //上层有监听则回调
        }
        ensureView();
        mErrorFrame.setVisibility(View.VISIBLE);
    }

    public View getErrorFrameView () {
        ensureView();
        return mErrorFrame;
    }

    private void loadWithAccessLocal() {
        new Thread(new Runnable() {
            public void run() {
                try {
                    final String htmlStr = NetService.fetchHtml(mLoadUrl);
                    if (htmlStr != null) {
                        // can replace some file paths in html with file:///android_asset/...
                        TaskExecutor.runTaskOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                loadDataWithBaseURL(mLoadUrl, htmlStr, "text/html", "UTF-8", "");
                            }
                        });
                        return;
                    }
                } catch (Exception e) {
                    Log.e("Exception:" + e.getMessage());
                }

                TaskExecutor.runTaskOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        onPageLoadedError(-1, "fetch html failed");
                    }
                });
            }
        }).start();
    }

    public void loadJS(String js) {
        super.loadUrl(js);
    }

    public BaseWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void ensureView () {
        if(!(getContext() instanceof Activity)) {
            if (mParentView != null) {
                mErrorFrame = (FrameLayout)mParentView.findViewById(R.id.error_frame);
            }
            return;
        }
        Activity activity = (Activity)getContext();
        if (mErrorFrame == null) {
            if (getParent() != null) {
                mErrorFrame = (FrameLayout)((ViewGroup)getParent()).findViewById(R.id.error_frame);
            } else {
                mErrorFrame = (FrameLayout)activity.findViewById(R.id.error_frame);
            }
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams)mErrorFrame.findViewById(R.id.error_button).getLayoutParams();
            lp.setMargins(0, (int)(EnvironUtil.getScreenHeight(activity) * mErrorTopRate), 0, 0);
        }
    }

    //默认浏览器的基础配置
    private void init () {
        //setBackgroundColor(getContext().getResources().getColor(android.R.color.transparent));
        setSoundEffectsEnabled(false);
        setLongClickable(false);
        setHorizontalScrollBarEnabled(false);
        setVerticalScrollBarEnabled(true);
        setScrollbarFadingEnabled(true);
        setScrollBarStyle(View.SCROLLBARS_OUTSIDE_OVERLAY);

        WebSettings webSettings = this.getSettings();
        //支持JS脚本
        webSettings.setJavaScriptEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        //支持缩放
        webSettings.setSupportZoom(false);
        webSettings.setLoadWithOverviewMode(false);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        if (getContext().getCacheDir() != null) {
            webSettings.setAppCachePath(getContext().getCacheDir().getPath());
        }
        webSettings.setAppCacheEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAppCacheMaxSize(1024*1024*5);//设置缓冲大小，设8M
        //有网络时则使用默认存在规则（网页数据未过期则使用缓存），无网络时则优先拿取缓存
        if (EnvironUtil.isNetworkAvailable()) {
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }
        //onPageFinished时再恢复图片加载,4.4以上系统直接加载，不然当有多张相同图片时，会只加载一张
        if(EnvironUtil.getOsSdk() >= 19) {
            webSettings.setLoadsImagesAutomatically(true);
        } else {
            webSettings.setLoadsImagesAutomatically(false);
        }
        webSettings.setLightTouchEnabled(true);
        webSettings.setDomStorageEnabled(true); // supports local storage
        webSettings.setDatabaseEnabled(true);   // supports local storage
        webSettings.setDatabasePath(getContext().getDatabasePath("databases").getPath());
        // we are using ApplicationContext when creating BrowserLayer, without disabling the "Save Password" dialog
        // there will be an exception that would cause crash: "Unable to add window -- token null is not for an application"
        webSettings.setSavePassword(false);

        setWebViewClient(BaseWebViewClient.getInstance());

        setWebChromeClient(BaseWebChromeClient.getInstance());
        requestFocus(View.FOCUS_DOWN|View.FOCUS_UP);
    }

    public void setLinkClickListener (OnLinkClickListener listener) {
        mLinkClickListener = listener;
    }

    public OnLinkClickListener getLinkClickListener () {
        return mLinkClickListener;
    }

    private float mLastMontionY;
    private float mLastDownY;
    private boolean mIgnoreMove;
    // find a solution for webview-in-viewpager touch problem
    // http://stackoverflow.com/questions/18745018/webview-in-viewpager-not-receive-user-inputs/18830896#18830896
    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        int sx = getScrollX();
        int sy = getScrollY();
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            mLastMontionY = ev.getY();
            mLastDownY = mLastMontionY;
            mIgnoreMove = false;
            onScrollChanged(sx, sy, sx, sy);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
            return super.onTouchEvent(ev);
        }

        /** 向上拖动但是滚动条已在最底部, 则忽略拖动距离
         *  这样做的目的是防止页面滑动到底部，WebView回调js异步加载新内容时，内容被append到元素而不显示的问题
         *  准确来说，当Html代码被append到元素节点， Body的高度本应会增大，但这时用户不停地往上拖动滚动条就阻止了页面高度的刷新
         *  这个问题目前来说，只在2.x的机子WebView发现
         * */
        switch (ev.getAction()) {
            case MotionEvent.ACTION_MOVE:
                float contentHeight = getContentHeight() * getScale();
                float diffY = ev.getY() - mLastMontionY;
                mLastMontionY = ev.getY();

                if (diffY < 0 && sy > 0 && sy + getHeight() >= contentHeight) {
                    mIgnoreMove = true;
                    return true;
                }
                mIgnoreMove = false;
                break;
            case MotionEvent.ACTION_UP:
                // TODO: 待解决 --> 2.X滑动到底部时易引起误操作
                // Log.d("ignore distance:" + (mLastDownY - ev.getY()) + "  bool:" + mIgnoreMove);
                if (mLastDownY - ev.getY() >= 6 && mIgnoreMove) {
                    ev.offsetLocation(200, -200);
                    mIgnoreMove = false;
                }
                break;
        }
        return super.onTouchEvent(ev);
    }

    public boolean rebuildTouch(MotionEvent event) {
        //Log.d("web-rebuild event.getAction:" + event.getAction());
        return super.onTouchEvent(event);
    }

    @Override
    protected void onScrollChanged(int newX, int newY, int oldX, int oldY) {
        super.onScrollChanged(newX, newY, oldX, oldY);
        //页面注册了事件回调对象
        if (newY != oldY && mJsCallBack != null) {
           /* 判断是否到底部方法一
            int contentHeight = computeVerticalScrollRange();
            if (mCurrContentHeight != contentHeight && newY > 0 && computeVerticalScrollOffset() + computeVerticalScrollExtent() + mThreshold >= contentHeight) {
                mJsCallBack.apply(contentHeight);
                mCurrContentHeight = contentHeight;
            }*/
            // 判断是否到底部方法二
            float contentHeight = getContentHeight() * getScale();
            // 当前内容高度下从未触发过, 浏览器存在滚动条且滑动到将抵底部位置
            if (mCurrContentHeight != contentHeight && newY > 0 && contentHeight <= newY + getHeight() + mThreshold) {
                mJsCallBack.apply(contentHeight);
                mCurrContentHeight = contentHeight;
            }
        }
        if (mVScrolledListener != null) {
            mVScrolledListener.scrolled(BaseWebView.this, newY, oldY);
        }
    }

    public void setOnVerticalScrolledListener(OnVerticalScrolledListener listener) {
        mVScrolledListener = listener;
    }

    public boolean existVerticalScrollbar () {
        //可滑动的最大高度大于滚动把手自身的高，则认为存在滚动条
        //Log.d("v-range:" + computeVerticalScrollRange());
        //Log.d("v-extent:" + computeVerticalScrollExtent());
        //computeVerticalScrollRange在窗口初始创建时拿到的值仍然可能为0， 导致判断滚动条结果为false
        return computeVerticalScrollRange() > computeVerticalScrollExtent();
    }

    /* 注册浏览器滚动到底部时的回调对象*/
    public void setOnScrollBottomListener (int threshold, JsCallback jsCallback) {
        mThreshold = threshold;
        mJsCallBack = jsCallback;
    }
}