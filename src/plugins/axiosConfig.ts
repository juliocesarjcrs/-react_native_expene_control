import { create, InternalAxiosRequestConfig } from 'axios';
import { URL_BASE } from '@env';
import { getToken } from './auth';

const axiosInstance = create({
  baseURL: URL_BASE
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export default axiosInstance;
