import React from 'react';
import {ToastAndroid} from 'react-native';

  const ShowToast = () => {
    ToastAndroid.show("Operación exitosa", ToastAndroid.SHORT);
  };

  export default ShowToast