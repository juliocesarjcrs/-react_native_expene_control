import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import {URL_BASE} from '@env'

const axiosInstance = axios.create({
  // baseURL: "http://192.168.1.11:4000/",
  // baseURL: URL_BASE,
  baseURL: "https://expense-control-nestjs.onrender.com/",
  // headers: {
  //   'Accept': 'application/json',
  //   'Content-Type': 'application/json',
  //   'Access-Control-Allow-Origin': '*'
  // }
});
axiosInstance.interceptors.request.use(
  async function (config) {
    const token = await AsyncStorage.getItem("access_token");
    if (token !== null) {
      config["headers"] = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default axiosInstance;
