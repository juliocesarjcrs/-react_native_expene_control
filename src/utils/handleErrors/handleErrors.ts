import { AxiosError } from "axios";
import ShowToast from '../../utils/toastUtils';
export type ApiError = {
  error: string;
}

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    // Establece el nombre de la clase para que aparezca correctamente en la pila de errores
    this.name = this.constructor.name;
  }
}

// Define una clase para errores de red
export class NetworkError extends CustomError { }

// Define una clase para errores de validación
export class ValidationError extends CustomError { }

export const handleErrors = (error: Error) => {

  if (error instanceof AxiosError) {

    // AxiosError tiene propiedades específicas
    const axiosError = error as AxiosError;

    // Comprueba si la respuesta tiene una propiedad 'error'
    const apiError = axiosError.response?.data as ApiError;
    // console.log('--- axiosError ---', axiosError)
    // console.log('--- apiError ---', apiError)

    if (apiError?.error) {
      // Si existe la propiedad 'error', utiliza ese mensaje
      showValidationErrorToast(apiError.error);
    } else {
      // Manejar otros casos
      // Puedes acceder al código de estado HTTP de la respuesta
      const statusCode = axiosError.response?.status;
      // Puedes acceder al mensaje de error de la respuesta
      // const errorMessage = axiosError.response?.data?.message || 'Error desconocido';

      // Lógica para manejar el error de Axios según tus necesidades
      if (statusCode === 400) {
        showValidationErrorToast('Error desconocido' || 'Error de validación');
      }
      showGenericErrorToast();
    }

  } else if (error instanceof NetworkError) {
    showNetworkErrorToast();
  } else if (error instanceof ValidationError) {
    showValidationErrorToast(error.message);
  } else {
    // Manejar otros tipos de errores
    showGenericErrorToast();
  }
};


const showNetworkErrorToast = () => {
  // Mostrar un mensaje de error para errores de red
  ShowToast('Error de red. Verifica tu conexión.');
}

const showValidationErrorToast = (message: string) => {
  // Mostrar un mensaje de error para errores de validación
  console.log('--- messager ---', message)
  ShowToast(`Error de validación: ${message}`);
}

const showGenericErrorToast = () => {
  // Mostrar un mensaje de error genérico
  ShowToast('Ocurrió un error. Inténtalo de nuevo.');
}
