import { ToastAndroid } from 'react-native';

export type ToastDuration = 'SHORT' | 'LONG';

export type ToastOptions = {
  message?: string;
  duration?: ToastDuration;
};

/**
 * Muestra un toast en Android
 * @param message - Mensaje a mostrar (por defecto: "Operación exitosa")
 * @param duration - Duración del toast: 'SHORT' o 'LONG' (por defecto: 'SHORT')
 */
export const ShowToast = (
  message: string = "Operación exitosa",
  duration: ToastDuration = 'SHORT'
): void => {
  const toastDuration = duration === 'SHORT'
    ? ToastAndroid.SHORT
    : ToastAndroid.LONG;

  ToastAndroid.show(message, toastDuration);
};

/**
 * Variante con objeto de opciones
 */
export const showToastWithOptions = (options: ToastOptions = {}): void => {
  const { message = "Operación exitosa", duration = 'SHORT' } = options;
  ShowToast(message, duration);
};

// Mensajes predefinidos comunes
export const ToastMessages = {
  SUCCESS: "Operación exitosa",
  ERROR: "Ocurrió un error",
  SAVED: "Guardado exitosamente",
  DELETED: "Eliminado exitosamente",
  UPDATED: "Actualizado exitosamente",
  CREATED: "Creado exitosamente",
} as const;