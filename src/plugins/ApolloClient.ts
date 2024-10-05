import { URL_BASE } from "@env";
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getToken } from "./auth";
import { ToastAndroid } from "react-native";
// Crea el enlace HTTP
const httpLink = createHttpLink({
  uri: `${URL_BASE}graphql`,
});
// Manejo global de errores
const errorLink = onError(({ graphQLErrors, networkError }) => {


  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      const readableMessage = typeof message === 'object' ? JSON.stringify(message) : message;

      console.log(`[GraphQL error]: Message: ${readableMessage}, Location: ${JSON.stringify(locations)}, Path: ${path}`);

      // Si quieres ver más detalles, puedes imprimir también `extensions` que a veces contiene información útil.
      console.log('Extensions:', JSON.stringify(extensions));

      showToast(readableMessage); // Muestra el error en un Toast (si lo deseas).
    });
  }

  if (networkError) {
    console.log(`[Network error]: ${JSON.stringify(networkError)}`);
    // showToast('Error de red. Verifica tu conexión.');
  }
});

const showToast = (msg: string) => {
  ToastAndroid.show(msg, ToastAndroid.SHORT);
};
// Crea el enlace de autenticación
const authLink = setContext(async (_, { headers }) => {
  const token = await getToken(); // Obtén el token de forma asíncrona

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});


// Combina los enlaces
const client = new ApolloClient({
  link: ApolloLink.from([authLink, errorLink, httpLink]), // Concatenación de los enlaces
  cache: new InMemoryCache(),
});


export default client;

