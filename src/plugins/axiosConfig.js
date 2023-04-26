import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {URL_BASE} from "@env";
console.log('env.URL_BASE,',URL_BASE);
const axiosInstance = axios.create({
  baseURL: URL_BASE,
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
