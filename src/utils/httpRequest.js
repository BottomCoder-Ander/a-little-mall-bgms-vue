import Vue from "vue";
import axios from "axios";
import router from "@/router";
import qs from "qs";
import merge from "lodash/merge";
import { clearLoginInfo } from "@/utils";
import { Message } from "element-ui";

const http = axios.create({
  timeout: 1000 * 30,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  }
});

/**
 * 请求拦截
 */
http.interceptors.request.use(
  config => {
    config.headers["token"] = Vue.cookie.get("token"); // 请求头带上token
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截
 */
http.interceptors.response.use(
  response => {
    if (!response.data) {
      console.log(response);
      return Promise.reject(new Error("响应没有data属性"));
    }

    if (response.data.code === 401) {
      // 401, token失效
      clearLoginInfo();
      Message.error("Token失效");
      router.push({ name: "login" });
    } else if (response.data.code !== 200 && response.data.code !== 20000) {
      console.log(response);
      Message.error("请求错误，Code=" + response.data.code);
      return Promise.reject(new Error(response.code));
    }
    return response.data;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 请求地址处理
 * @param {*} actionName action方法名称
 */
http.adornUrl = actionName => {
  // 非生产环境 && 开启代理, 接口前缀统一使用[/proxyApi/]前缀做代理拦截!
  return (
    (process.env.NODE_ENV !== "production" && process.env.OPEN_PROXY
      ? "/proxyApi/"
      : window.SITE_CONFIG.baseUrl) + actionName
  );
};

/**
 * get请求参数处理
 * @param {*} params 参数对象
 * @param {*} openDefultParams 是否开启默认参数?
 */
http.adornParams = (params = {}, openDefultParams = true) => {
  var defaults = {
    t: new Date().getTime()
  };
  return openDefultParams ? merge(defaults, params) : params;
};

/**
 * post请求数据处理
 * @param {*} data 数据对象
 * @param {*} openDefultdata 是否开启默认数据?
 * @param {*} contentType 数据格式
 *  json: 'application/json; charset=utf-8'
 *  form: 'application/x-www-form-urlencoded; charset=utf-8'
 */
http.adornData = (data = {}, openDefultdata = true, contentType = "json") => {
  var defaults = {
    t: new Date().getTime()
  };
  data = openDefultdata ? merge(defaults, data) : data;
  return contentType === "json" ? JSON.stringify(data) : qs.stringify(data);
};

export default http;
