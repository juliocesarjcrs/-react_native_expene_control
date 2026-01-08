import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import BarSearch from '../BarSearch';
import { setQuery } from '~/features/search/searchSlice';

const mockStore = configureStore([]);

// Mock components
jest.mock('~/components/MyButton', () => {
  const { TouchableOpacity, Text } = require('react-native');

  const MockMyButton = ({ title, onPress }: any) => (
    <TouchableOpacity onPress={onPress} testID="search-button">
      <Text>{title}</Text>
    </TouchableOpacity>
  );

  MockMyButton.displayName = 'MyButton';

  return MockMyButton;
});

jest.mock('react-native-elements', () => ({
  Icon: ({ name, testID }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID || `icon-${name}`}>
        <Text>{name}</Text>
      </View>
    );
  }
}));

jest.mock('~/customHooks/useThemeColors', () => ({
  useThemeColors: () => ({
    CARD_BACKGROUND: '#FFFFFF',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#666666',
    PRIMARY: '#9c27b0'
  })
}));

describe('BarSearch Component', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      search: { query: null }
    });
  });

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      expect(getByPlaceholderText('Buscar...')).toBeTruthy();
      expect(getByTestId('search-button')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch placeholder="Buscar productos..." />
        </Provider>
      );

      expect(getByPlaceholderText('Buscar productos...')).toBeTruthy();
    });
  });

  describe('Search Input Behavior', () => {
    it('should update input value when typing', () => {
      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'Luz');

      expect(input.props.value).toBe('Luz');
    });

    it('should show clear button when text is present', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'test');

      expect(getByTestId('icon-close-circle')).toBeTruthy();
    });

    it('should not show clear button when input is empty', () => {
      const { getByPlaceholderText, queryByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      expect(input.props.value).toBe('');
      expect(queryByTestId('icon-close-circle')).toBeNull();
    });
  });

  describe('Search Submit Behavior - UX Critical Tests', () => {
    it('✅ CRITICAL: should maintain search text in input after submit', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      // Type search text
      fireEvent.changeText(input, 'Luz');
      expect(input.props.value).toBe('Luz');

      // Submit search
      fireEvent.press(searchButton);

      // ✅ CRITICAL ASSERTION: Text should remain in input after submit
      expect(input.props.value).toBe('Luz');

      // Verify action was dispatched
      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: 'Luz'
      });
    });

    it('should dispatch setQuery action with trimmed text', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, '  comida  ');
      fireEvent.press(searchButton);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: 'comida'
      });
    });

    it('should dispatch setQuery(null) when submitting empty text', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, '   ');
      fireEvent.press(searchButton);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: null
      });
    });

    it('should submit search on keyboard return', async () => {
      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'test');
      fireEvent(input, 'submitEditing');

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: 'test'
      });
    });
  });

  describe('Clear Button Behavior', () => {
    it('should clear input when clear button is pressed', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      // Type text
      fireEvent.changeText(input, 'test');
      expect(input.props.value).toBe('test');

      // Press clear button
      const clearButton = getByTestId('icon-close-circle');
      const clearButtonParent = clearButton.parent;

      if (!clearButtonParent) {
        throw new Error('Clear button parent not found');
      }

      fireEvent.press(clearButtonParent);

      // Input should be cleared
      expect(input.props.value).toBe('');

      // Should dispatch setQuery(null)
      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: null
      });
    });
  });

  describe('Store Synchronization', () => {
    it('should initialize input from store value', () => {
      store = mockStore({
        search: { query: 'existing search' }
      });

      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      expect(input.props.value).toBe('existing search');
    });

    it('should clear input when store query becomes null', async () => {
      store = mockStore({
        search: { query: 'test' }
      });

      const { getByPlaceholderText, rerender } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      expect(input.props.value).toBe('test');

      // Update store to null
      store = mockStore({
        search: { query: null }
      });

      rerender(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    it('should sync input when store query changes', async () => {
      store = mockStore({
        search: { query: 'initial' }
      });

      const { getByPlaceholderText, rerender } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      expect(input.props.value).toBe('initial');

      // Update store value
      store = mockStore({
        search: { query: 'updated' }
      });

      rerender(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      await waitFor(() => {
        expect(input.props.value).toBe('updated');
      });
    });
  });

  describe('Non-dispatch Mode (shouldDispatch=false)', () => {
    it('should call onQueryChange callback instead of dispatching', () => {
      const mockOnQueryChange = jest.fn();

      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch shouldDispatch={false} onQueryChange={mockOnQueryChange} />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, 'test');
      fireEvent.press(searchButton);

      expect(mockOnQueryChange).toHaveBeenCalledWith('test');
      expect(store.getActions()).toHaveLength(0);
    });

    it('should maintain text in input after callback in non-dispatch mode', () => {
      const mockOnQueryChange = jest.fn();

      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch shouldDispatch={false} onQueryChange={mockOnQueryChange} />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, 'test query');
      fireEvent.press(searchButton);

      // ✅ Text should remain in non-dispatch mode too
      expect(input.props.value).toBe('test query');
    });

    it('should call onQueryChange with empty string when clearing', () => {
      const mockOnQueryChange = jest.fn();

      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch shouldDispatch={false} onQueryChange={mockOnQueryChange} />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'test');

      const clearButton = getByTestId('icon-close-circle');
      const clearButtonParent = clearButton.parent;

      if (!clearButtonParent) {
        throw new Error('Clear button parent not found');
      }

      fireEvent.press(clearButtonParent);

      expect(mockOnQueryChange).toHaveBeenCalledWith('');
      expect(input.props.value).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid searches', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, 'first');
      fireEvent.press(searchButton);
      expect(input.props.value).toBe('first');

      fireEvent.changeText(input, 'second');
      fireEvent.press(searchButton);
      expect(input.props.value).toBe('second');

      fireEvent.changeText(input, 'third');
      fireEvent.press(searchButton);
      expect(input.props.value).toBe('third');

      const actions = store.getActions();
      expect(actions).toHaveLength(3);
    });

    it('should handle whitespace-only input', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, '     ');
      fireEvent.press(searchButton);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: null
      });
    });

    it('should handle special characters', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      const specialText = '!@#$%^&*()';
      fireEvent.changeText(input, specialText);
      fireEvent.press(searchButton);

      expect(input.props.value).toBe(specialText);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: specialText
      });
    });
  });
});
