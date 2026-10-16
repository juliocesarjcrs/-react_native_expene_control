// src/plugins/setupInterceptors.ts
import { AxiosError } from 'axios';
import axiosInstance from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearApolloCache } from './ApolloClient';
import { logout } from '~/features/auth/authSlice';
import type { AppDispatch } from '~/store';
import { ShowToast } from '~/utils/toastUtils';
import { logger } from '~/utils/logger';
import { ToastAndroid } from 'react-native';
import { markNotified } from '~/utils/errorNotification';

let interceptorId: number | null = null;

const formatError = (msg: string): string => {
  if (!msg) return 'Sin definir general';
  if (Array.isArray(msg)) return msg[0];
  return msg;
};

const showToast = (msg: string) => {
  ToastAndroid.show(msg, ToastAndroid.SHORT);
};

export type ApiError = {
  error: string;
};

export const setupInterceptors = (dispatch: AppDispatch) => {
  if (interceptorId !== null) {
    axiosInstance.interceptors.response.eject(interceptorId);
  }
  interceptorId = axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!error?.response) return Promise.reject(error);

      const { status } = error.response;
      const url = error.config?.url ?? '';
      const isChatbotError = url.includes('chatbot/');

      if (![400, 401, 403].includes(status) && !isChatbotError) {
        const msg = error.response.data?.message ?? 'Error en el servidor';
        ToastAndroid.show(msg, ToastAndroid.SHORT);
        markNotified(error);
        logger.error(`HTTP ${status} inesperado`, error, { url, status });
      }
      const isLoginRequest = url.includes('auth/login');
      if (status === 401 && !isLoginRequest) {
        dispatch(logout());
        await AsyncStorage.removeItem('access_token');
        await clearApolloCache();
        const message = formatError(error.response.data.message);
        ShowToast(message);
        markNotified(error);
        logger.warn('Sesión expirada, usuario desconectado', { url });
      } else if (status === 403) {
        const message = error.response.data.message ?? 'Sin permisos';
        showToast(message);
        markNotified(error);
        logger.warn('Acceso denegado 403', { url, message });
      } else if (status === 400) {
        if (isChatbotError) return Promise.reject(error);

        if (error instanceof AxiosError) {
          const apiError = error.response?.data as ApiError;
          if (apiError?.error) {
            showToast(apiError.error);
            markNotified(error);
            logger.warn('Error 400 del servidor', { url, apiError: apiError.error });
          }
        } else {
          const message = formatError(error.response.data.message);
          showToast(message);
          logger.error('Error 400 inesperado', error, { url });
        }
      }

      return Promise.reject(error);
    }
  );
};
