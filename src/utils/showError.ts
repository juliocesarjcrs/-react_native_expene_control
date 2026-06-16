import { Alert, ToastAndroid, Platform } from 'react-native';
import { AxiosError } from 'axios';
import { logger } from '~/utils/logger';

export function showError(error: unknown, customMessage?: string) {
  let message = customMessage || 'Ocurrió un error inesperado. Intenta de nuevo.';

  if (error instanceof AxiosError) {
    const backendMessage = error.response?.data?.message || error.response?.data?.error;

    if (backendMessage) {
      message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    }

    if (!error.response) {
      message = 'No hay conexión con el servidor.';
    }

    logger.error(message, error, {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
  } else {
    // Error no esperado (bug en código, no del servidor)
    logger.error(message, error instanceof Error ? error : new Error(String(error)));
  }

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Error', message);
  }
}
