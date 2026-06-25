import React from 'react';
import * as Sentry from '@sentry/react-native';

import appStore from './src/store/store';
import { Provider } from 'react-redux';
import { userSignOut } from './src/actions/authActions';
import { ChatProvider } from './src/features/chat/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid } from 'react-native';
import axiosInstance from './src/plugins/axiosConfig';
import MyStack from './src/navigator/stack';
import { AxiosError } from 'axios';

import { ApolloProvider } from '@apollo/client/react';
import client from './src/plugins/ApolloClient';
import { ThemeProvider } from '~/contexts/ThemeContext';
import { InvestmentComparisonProvider } from '~/contexts/InvestmentComparisonContext';
import { ErrorBoundary } from '~/components/ErrorBoundary';
import { logger } from '~/utils/logger';
import { APP_ENV, SENTRY_DSN } from '@env';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: APP_ENV ?? 'development', // 'development' | 'preview' | 'production'
  tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
  debug: __DEV__,
  enableNative: true
});

export type ApiError = {
  error: string;
};

function App() {
  const { dispatch } = appStore;

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!error?.response) return Promise.reject(error);

      const { status } = error.response;
      const url = error.config?.url ?? '';
      const isChatbotError = url.includes('chatbot/');

      if (![400, 401, 403].includes(status) && !isChatbotError) {
        const msg = error.response.data?.message ?? 'Error en el servidor';
        ToastAndroid.show(msg, ToastAndroid.SHORT);
        logger.error(`HTTP ${status} inesperado`, error, { url, status });
      }

      if (status === 401) {
        dispatch(userSignOut());
        await AsyncStorage.removeItem('access_token');
        const message = formatError(error.response.data.message);
        showToast(message);
        logger.warn('Sesión expirada, usuario desconectado', { url });
      } else if (status === 403) {
        const message = error.response.data.message ?? 'Sin permisos';
        showToast(message);
        logger.warn('Acceso denegado 403', { url, message });
      } else if (status === 400) {
        if (isChatbotError) return Promise.reject(error);

        if (error instanceof AxiosError) {
          const apiError = error.response?.data as ApiError;
          if (apiError?.error) {
            showToast(apiError.error);
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

  const formatError = (msg: string): string => {
    if (!msg) return 'Sin definir general';
    if (Array.isArray(msg)) return msg[0];
    return msg;
  };

  const showToast = (msg: string) => {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  };

  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <Provider store={appStore}>
          <ChatProvider>
            <ThemeProvider>
              <InvestmentComparisonProvider>
                <MyStack />
              </InvestmentComparisonProvider>
            </ThemeProvider>
          </ChatProvider>
        </Provider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(App);
