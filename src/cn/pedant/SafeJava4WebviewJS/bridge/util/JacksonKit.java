package cn.pedant.SafeJava4WebviewJS.bridge.util;


import org.codehaus.jackson.annotate.JsonAutoDetect;
import org.codehaus.jackson.annotate.JsonMethod;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.Iterator;


public class JacksonKit {

    private static ObjectMapper objectMapper = new ObjectMapper();
    static {
        objectMapper.setDateFormat(new SimpleDateFormat(
                "yyyy-MM-dd HH:mm:ss.SSSSSS"));
        // 设置输入时忽略JSON字符串中存在而Java对象实际没有的属性
        objectMapper.setDeserializationConfig(
                objectMapper.getDeserializationConfig()
                        .without(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES));

        objectMapper.setSerializationConfig(
                objectMapper.getSerializationConfig()
                        .without(SerializationConfig.Feature.FAIL_ON_EMPTY_BEANS));
        //设置不输出值为 null 的属性
        objectMapper.setSerializationInclusion(JsonSerialize.Inclusion.NON_NULL);
    }

    /**
     * 将Java对象序列化成JSON字符串。
     *
     * @param obj 待序列化生成JSON字符串的Java对象
     * @return JSON字符串
     * @throws Exception 如果序列化过程中发生错误，将抛出异常
     */
    public static String encode(Object obj) throws Exception {
        return encode(obj, false);
    }

    public static String encode(Object obj, boolean outNull) throws Exception {
        objectMapper.setVisibility(JsonMethod.FIELD, JsonAutoDetect.Visibility.ANY);
        if (outNull) {
            objectMapper.setSerializationInclusion(JsonSerialize.Inclusion.ALWAYS);
        }
        String result = objectMapper.writeValueAsString(obj);
        objectMapper.setSerializationInclusion(JsonSerialize.Inclusion.NON_NULL);
        return result;
    }

    /**
     * 将json对象转换成Map
     *
     * @param jsonObject json对象
     * @return Map对象
     */
    @SuppressWarnings("unchecked")
    public static HashMap<String, String> toMap(JSONObject jsonObject) {
        HashMap<String, String> result = new HashMap<String, String>();
        Iterator<String> iterator = jsonObject.keys();
        String key;
        String value;
        while (iterator.hasNext()) {
            try {
                key = iterator.next();
                value = jsonObject.getString(key);
                result.put(key, value);
            } catch (JSONException e) {}
        }
        return result;
    }
}
