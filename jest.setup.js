// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
// jest.mock('@react-native-async-storage/async-storage', () =>
//   require('@react-native-async-storage/async-storage/jest/async-storage-mock')
// );

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

// Suppress specific warnings
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn((...args) => {
    const message = args[0];
    // Only suppress specific warnings
    if (
      typeof message === 'string' &&
      (message.includes('Animated:') ||
        message.includes('useNativeDriver') ||
        message.includes('ViewPropTypes'))
    ) {
      return;
    }
    originalWarn(...args);
  });

  console.error = jest.fn((...args) => {
    const message = args[0];
    // Only suppress specific errors
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') || message.includes('not wrapped in act'))
    ) {
      return;
    }
    originalError(...args);
  });
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
