import React from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    Sentry.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack }
      }
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ Algo salió mal</Text>
          <Text style={styles.subtitle}>La aplicación encontró un error inesperado.</Text>

          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>
              {this.state.error?.name}: {this.state.error?.message}
            </Text>

            {this.state.error?.stack && (
              <>
                <Text style={[styles.errorTitle, { marginTop: 20 }]}>Stack Trace:</Text>
                <Text style={styles.stackText}>{this.state.error.stack}</Text>
              </>
            )}

            {this.state.errorInfo?.componentStack && (
              <>
                <Text style={[styles.errorTitle, { marginTop: 20 }]}>Component Stack:</Text>
                <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
              </>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button title="🔄 Reintentar" onPress={this.handleReset} color="#007AFF" />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF3B30', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  errorTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  errorText: { fontSize: 14, color: '#FF3B30', fontFamily: 'monospace' },
  stackText: { fontSize: 12, color: '#666', fontFamily: 'monospace', lineHeight: 18 },
  buttonContainer: { marginVertical: 10 }
});
