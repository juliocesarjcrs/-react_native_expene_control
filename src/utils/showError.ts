import { Alert, ToastAndroid, Platform } from 'react-native';
import { AxiosError } from 'axios';

export function showError(error: any, customMessage?: string) {
  let message = customMessage || 'Ocurrió un error inesperado. Intenta de nuevo.';

  // Si es un error de Axios, tomamos info del backend
  if (error instanceof AxiosError) {
    const backendMessage = error.response?.data?.message || error.response?.data?.error;

    if (backendMessage) {
      message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    }

    // Si no hay status → no hay conexión
    if (!error.response) {
      message = 'No hay conexión con el servidor.';
    }
  }

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Error', message);
  }

  console.log('🔴 ERROR:', error);
}
