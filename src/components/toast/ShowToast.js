import React from 'react';
import {ToastAndroid} from 'react-native';

  const ShowToast = (msg= "Operación exitosa") => {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  };

  export default ShowToast