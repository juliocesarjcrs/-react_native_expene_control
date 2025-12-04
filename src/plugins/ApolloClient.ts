import { URL_BASE } from '@env';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink, onError } from '@apollo/client/link/error';
import { getToken } from './auth';
import { ToastAndroid } from 'react-native';
// Crea el enlace HTTP
const httpLink = new HttpLink({
  uri: `${URL_BASE}graphql`
});
// Manejo global de errores
const errorLink = new ErrorLink(({ error, result }) => {
  // En v4, todos los errores se unifican en la propiedad 'error'
  if (error) {
    console.log(`[Error]: ${error.message}`);
    // Muestra el error específico según su tipo
    const errorMessage = error.message || 'Error desconocido';
    showToast(errorMessage);
  }
});

const showToast = (msg: string) => {
  ToastAndroid.show(msg, ToastAndroid.SHORT);
};
// Crea el enlace de autenticación
const authLink = new SetContextLink(async (prevContext, operation) => {
  const token = await getToken(); // Obtén el token de forma asíncrona

  return {
    ...prevContext,
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

// Combina los enlaces
const client = new ApolloClient({
  link: ApolloLink.from([authLink, errorLink, httpLink]), // Concatenación de los enlaces
  cache: new InMemoryCache()
});

export default client;
