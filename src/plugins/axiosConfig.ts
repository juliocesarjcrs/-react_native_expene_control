import axios, { AxiosRequestConfig, InternalAxiosRequestConfig} from "axios";
import { URL_BASE } from "@env";
import { getToken } from "./auth";
console.log('env.URL_BASE,', URL_BASE);

const axiosInstance = axios.create({
  baseURL: URL_BASE,
});

axiosInstance.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        config.headers = { Authorization: `Bearer ${token}` };
      }
    }
    return config as InternalAxiosRequestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
