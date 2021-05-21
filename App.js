import React from "react";

import store from "./src/store/store";
import { Provider } from "react-redux";
import MyStack from "~/navigator/stack";
import axiosInstance from "~/plugins/axiosConfig";
import { userSignOut } from "./src/actions/authActions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ToastAndroid} from 'react-native';

export default function App() {
/** Intercept any unauthorized request.
  * dispatch logout action accordingly
  *  https://stackoverflow.com/questions/52946376/reactjs-axios-interceptors-how-dispatch-a-logout-action
**/
  const { dispatch } = store; // direct access to redux store.

  axiosInstance.interceptors.response.use(function (response) {
    return response;
  }, async function (error) {

    if(error && error.response){
      // console.log('----ERROR, INTERCEPT ---- ',error, );
      // console.log(error.response);
      const { status } = error.response;
      if (status === 401) {
          dispatch(userSignOut());
          await AsyncStorage.setItem("access_token",null);
      }else if(status ===  403){
        console.log(error.response.data.message);
        const message =  error.response.data.message ? error.response.data.message :'Sin definir'
        showToast(message)
      }

    }
    return Promise.reject(error);
  });

  const showToast = (msg) => {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  };
  return (
    <Provider store={store}>
      <MyStack />
    </Provider>
  );
}
