Safe Java-JS WebView Bridge
===================
抛弃使用高风险的WebView addJavascriptInterface方法，利用onJsPrompt解析纯JSON字符串，来实现网页JS层反射调用Java方法，同时通过对js层调用函数及回调函数的包装，支持方法参数传入所有已知的类型，包括number、string、boolean、object、function。

## 安装
使用Safe Java-JS WebView Bridge最简单的办法就是像下面这样添加项目依赖。

**Maven**
    <dependency>
      <groupId>com.google.code.gson</groupId>
      <artifactId>gson</artifactId>
      <version>2.3</version>
    </dependency>
    <dependency>
      <groupId>cn.pedant.safewebviewbridge</groupId>
      <artifactId>library</artifactId>
      <version>1.2</version>
      <type>aar</type>
    </dependency>

**Gradle**

    repositories {
        mavenCentral()
    }

    dependencies {
        compile 'cn.pedant.safewebviewbridge:library:1.2'
    }

## Sample
[Sample 下载](https://github.com/pedant/safe-java-js-webview-bridge/releases/download/v1.1/safe-webview-bridge-sample-v1.1.apk)

![image](https://github.com/pedant/safe-java-js-webview-bridge/raw/master/app-sample-screenshot.png)

## 用法

### 如何开始
初始化Webview WebSettings时允许js脚本执行，同时使用你的注入名和注入类来实例化一个**InjectedChromeClient**对象，然后关联到你的Webview实例。如demo中的例子（页面中引用的对象名为HostApp，指定的注入类为HostJsScope）：

	WebView wv = new WebView(this);
	WebSettings ws = wv.getSettings();
	ws.setJavaScriptEnabled(true);
    wv.setWebChromeClient(
        new InjectedChromeClient("HostApp", HostJsScope.class)
    );
	wv.loadUrl("file:///android_asset/test.html");

### 自定义WebChromeClient子类
如果你需要实现自己的WebChromeClient子类，然后设置到WebView。为了保持InjectedChromeClient的功能，你需要将此类继承自InjectedChromeClient，同时像下面这样覆盖这三个方法。

    public class CustomChromeClient extends InjectedChromeClient {

        public CustomChromeClient (String injectedName, Class injectedCls) {
            super(injectedName, injectedCls);
        }

        @Override
        public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
            // to do your work
            // ...
            return super.onJsAlert(view, url, message, result);
        }

        @Override
        public void onProgressChanged (WebView view, int newProgress) {
            super.onProgressChanged(view, newProgress);
            // to do your work
            // ...
        }

        @Override
        public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
            // to do your work
            // ...
            return super.onJsPrompt(view, url, message, defaultValue, result);
        }
    }

### 方法的定义
需要注入到网页的方法，**必须在注入类中定义为public static且第一个参数接收WebView**，其他参数的类型可以是int、long、double、boolean、String、JSONObject、JsCallback。方法执行时会默认将当前Webview的实例放到第一个参数，所以你的定义可能看起来像这样子的：
	
	public static void testA (WebView webView) {}
网页调用如下：
	
	HostApp.testA();

### 方法的重载
在定义时，支持不同参数类型或参数个数的方法重载，如：
	  
    public static int overloadMethod(WebView view, int val) {
        return val;
    }
    public static String overloadMethod(WebView view, String val) {
        return val;
    }
但需要注意的是，由于JS中数字类型不区分整型、长整型、浮点类型等，是统一由64位浮点数表示，故Java方法在定义时int/long/double被当作是一种类型，也即：
    
    public static int overloadMethod(WebView view, int val) {
        return val;
    }
    public static long overloadMethod(WebView view, long val) {
        return val;
    }
    public static double overloadMethod(WebView view, double val) {
        return val;
    }
上面这三个方法并没有发生重载，HostApp.overloadMethod(1)调用时只会调用最后一个定义的方法（double类型定义的那个）。

### 方法的返回值
Java层方法可以返回void 或 能转为字符串的类型（如int、long、String、double、float等）或 **可序列化的自定义类型**。关于自定义类型的返回可以参见Demo下“从Java层返回Java对象”项对HostApp.retJavaObject()的调用。另外如果方法定义时返回void，那么网页端调用得到的返回值为null。

如果方法执行过程中出现异常，那么在网页JS端会抛出异常，可以catch后打印详细的错误说明。

### 关于异步回调
举例说明，首先你可以在Java层定义如下方法，该方法的作用是延迟设定的时间之后，用你传入的参数回调Js函数：
  
    public static void delayJsCallBack(WebView view, int ms, final String backMsg, final JsCallback jsCallback) {
      TaskExecutor.scheduleTaskOnUiThread(ms*1000, new Runnable() {
          @Override
          public void run() {
              jsCallback.apply(backMsg);
          }
      });
    }
那么在网页端的调用如下：
  
    HostApp.delayJsCallBack(3, 'call back haha', function (msg) {
      HostApp.alert(msg);
    });
即3秒之后会弹出你传入的'call back haha'信息。
故从上面的例子我们可以看出，你在网页端定义的回调函数是可以附加多个参数，Java方法在执行回调时需要带入相应的实参就行了。当然这里的**回调函数的参数类型目前还不支持过复杂的类型，仅支持能够被转为字符串的类型**。

另外需要注意的是一般传入到Java方法的js function是一次性使用的，即在Java层jsCallback.apply(...)之后不能再发起回调了。如果需要传入的function能够在当前页面生命周期内多次使用，请在第一次apply前**setPermanent(true)**。例如：

	public static void setOnScrollBottomListener (WebView view, JsCallback jsCallback) {
		jsCallback.setPermanent(true);
		...
	}

### 发布时防混淆
注意注入类中的方法名称不能被混淆，否则页面会调用失败。故发布时需在你的混淆配置文件中加入注入类的防混淆代码，如demo中的HostJsScope配置:

    -keepclassmembers class cn.pedant.SafeWebViewBridge.demo.HostJsScope{ *; }

### 小心过大数字
JS中使用过大数字时，可能会导致精度丢失或者错误的数字结果，如下面：

	HostApp.passLongType(14102300951321235)
传入一个大数**14102300951321235**到Java层，但Java层接收的数字实际上将会是**14102300951321236**这样一个错误的数字，所以当需要使用大数的情景下时，Java方法参数类型最好定义为**String类型**，而js层调用时也转为string，比如上面就为

	HostApp.passLongType(14102300951321235+'')。	

更多实现细节见: http://www.pedant.cn/2014/07/04/webview-js-java-interface-research/

## License

    The MIT License (MIT)

    Copyright (c) 2014 Pedant(http://pedant.cn)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
