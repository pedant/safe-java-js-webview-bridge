/**
 * Summary: 网络请求层封装
 * Version 1.0
 * Date: 13-11-5
 * Time: 下午12:38
 * Copyright: Copyright (c) 2013
 */

package cn.pedant.SafeJava4WebviewJS.util;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.protocol.HTTP;

import java.io.*;

public class NetService {
    private static String getStringFromResponse (HttpResponse response) throws IOException {
        HttpEntity entity = null;
        try {
            if (response != null && response.getStatusLine().getStatusCode() == 200) {
                entity = response.getEntity();
                Header contentEnc = response.getLastHeader("isgzip-based");
                boolean isGzipped = contentEnc != null && "1".equals(contentEnc.getValue());
                return readInputStreamAsString(entity.getContent(), isGzipped);
            }
        } catch (Exception e) {
            Log.e("get string from response error:" + e.getMessage());
        } finally {
            if (entity != null) {
                try {
                    entity.consumeContent();
                } catch (IOException e) {
                }
            }
        }
        return null;
    }

    /**
     * 从响应流中先解密，再判断解压缩
     * */
    private static String readInputStreamAsString (InputStream is, boolean isGzipped) throws Exception{
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] bytes = new byte[4096];
        int lenRead;
        while ((lenRead = is.read(bytes)) != -1) {
            if (lenRead > 0) {
                baos.write(bytes, 0, lenRead);
            }
        }
        if (baos.size() > 0) {
            byte[]  rspBytes = baos.toByteArray();
            return new String(rspBytes, HTTP.UTF_8);
        }

        return null;
    }

    public static String fetchHtml (String url) throws Exception{
        //HttpGet httpGet = new HttpGet(url);
        HttpPost httpPost = new HttpPost(url);
        HttpResponse response = HttpClientWrapper.getHttpClient().execute(httpPost);
        if (response != null && response.getStatusLine().getStatusCode() == 200) {
            InputStream is = response.getEntity().getContent();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] bytes = new byte[4096];
            int lenRead;
            while ((lenRead = is.read(bytes)) != -1) {
                if (lenRead > 0) {
                    baos.write(bytes, 0, lenRead);
                }
            }
            if (baos.size() > 0) {
                return new String(baos.toByteArray(), HTTP.UTF_8);
            }
        } else {
            Log.d("response code not correct-------------->" + response.getStatusLine().getStatusCode());
        }
        return null;
    }
}