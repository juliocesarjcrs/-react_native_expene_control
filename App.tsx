import React from 'react';

import store from './src/store/store';
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

export type ApiError = {
  error: string;
};

export default function App() {
  /** Intercept any unauthorized request.
   * dispatch logout action accordingly
   *  https://stackoverflow.com/questions/52946376/reactjs-axios-interceptors-how-dispatch-a-logout-action
   **/
  const { dispatch } = store; // direct access to redux store.

  axiosInstance.interceptors.response.use(
    function (response) {
      return response;
    },
    async function (error) {
      if (error && error.response) {
        // console.log('----ERROR, INTERCEPT ---- ',error, );
        // console.log(error.response);
        const { status } = error.response;
        // Si el servidor respondió pero no cae en 400/401/403:
        if (![400, 401, 403].includes(error.response.status)) {
          const msg = error.response.data?.message || 'Error en el servidor';
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        }
        if (status === 401) {
          dispatch(userSignOut());
          await AsyncStorage.removeItem('access_token');
          const message = formatError(error.response.data.message);
          showToast(message);
          // await AsyncStorage.setItem("access_token",null);
        } else if (status === 403) {
          const message = error.response.data.message ? error.response.data.message : 'Sin definir 1';
          showToast(message);
        } else if (status === 400) {
          console.log('::: type :::', typeof error);
          if (error instanceof AxiosError) {
            console.log('::: Error :::', error);

            // AxiosError tiene propiedades específicas
            const axiosError = error as AxiosError;
            // Comprueba si la respuesta tiene una propiedad 'error'
            const apiError = axiosError.response?.data as ApiError;
            if (apiError?.error) {
              showToast(apiError.error);
            }
          } else {
            const message = formatError(error.response.data.message);
            showToast(message);
          }
        }
      }
      return Promise.reject(error);
    }
  );

  const formatError = (msg: string) => {
    if (!msg) return 'Sin definir general';
    const isArray = Array.isArray(msg);
    if (isArray) {
      const msgSend = msg[0];
      // msg.forEach(element => {
      //   msgSend += element;
      // });
      return msgSend;
    }
    return msg;
  };

  const showToast = (msg: string) => {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  };

  return (
    <ApolloProvider client={client}>
      <Provider store={store}>
        <ChatProvider>
          <MyStack />
        </ChatProvider>
      </Provider>
    </ApolloProvider>
  );
}
