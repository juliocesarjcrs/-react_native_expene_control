// jest.setup.js

// Mock AsyncStorage (descomenta si tus tests usan storage)
// jest.mock('@react-native-async-storage/async-storage', () =>
//   require('@react-native-async-storage/async-storage/jest/async-storage-mock')
// );

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

// Mock Sentry (el plugin de Babel no corre en Jest)
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  wrap: (component) => component
}));

// Silenciar solo warnings conocidos de animaciones
const originalWarn = console.warn;

beforeAll(() => {
  console.warn = jest.fn((...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Animated:') || message.includes('useNativeDriver'))
    ) {
      return;
    }
    originalWarn(...args);
  });
});

afterAll(() => {
  console.warn = originalWarn;
});
