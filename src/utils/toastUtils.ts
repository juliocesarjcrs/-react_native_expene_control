import { ToastAndroid } from 'react-native';

export type ShowToastProps = {
  msg?: string;
}

const ShowToast = (msg: string = "Operación exitosa", duration: 'SHORT' | 'LONG' = 'SHORT') => {
  ToastAndroid.show(msg, duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG);
  return null;
};

export default ShowToast;