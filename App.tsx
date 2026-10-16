import React from 'react';
import * as Sentry from '@sentry/react-native';
import { store } from '~/store';
import { Provider } from 'react-redux';
import { ChatProvider } from './src/features/chat/ChatContext';
import MyStack from './src/navigator/stack';
import { ApolloProvider } from '@apollo/client/react';
import client from './src/plugins/ApolloClient';
import { ThemeProvider } from '~/contexts/ThemeContext';
import { InvestmentComparisonProvider } from '~/contexts/InvestmentComparisonContext';
import { ErrorBoundary } from '~/components/ErrorBoundary';
import { APP_ENV, SENTRY_DSN } from '@env';
import { setupInterceptors } from '~/plugins/setupInterceptors';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: APP_ENV ?? 'development', // 'development' | 'preview' | 'production'
  tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
  debug: false,
  enableNative: true
});

setupInterceptors(store.dispatch);
function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <Provider store={store}>
          <ChatProvider>
            <ThemeProvider>
              <InvestmentComparisonProvider>
                <MyStack />
              </InvestmentComparisonProvider>
            </ThemeProvider>
          </ChatProvider>
        </Provider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(App);
