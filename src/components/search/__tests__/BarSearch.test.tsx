import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import createMockStore from 'redux-mock-store';
import BarSearch from '../BarSearch';
import searchReducer, { setQuery } from '~/features/search/searchSlice';

import { configureStore } from '@reduxjs/toolkit';

const mockStore = createMockStore([]);

// Mock components
jest.mock('~/components/MyButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  store = mockStore({
    search: { queries: { expenses: null, incomes: null } }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      search: { queries: { expenses: null, incomes: null } }
    });
  });

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      expect(getByPlaceholderText('Buscar...')).toBeTruthy();
      expect(getByTestId('search-button')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" placeholder="Buscar productos..." />
        </Provider>
      );

      expect(getByPlaceholderText('Buscar productos...')).toBeTruthy();
    });
  });

  describe('Search Input Behavior', () => {
    it('should update input value when typing', () => {
      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'Luz');

      expect(input.props.value).toBe('Luz');
    });

    it('should show clear button when text is present', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'test');

      expect(getByTestId('icon-close-circle')).toBeTruthy();
    });

    it('should not show clear button when input is empty', () => {
      const { getByPlaceholderText, queryByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
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
          <BarSearch scope="expenses" />
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
        payload: { scope: 'expenses', query: 'Luz' }
      });
    });

    it('should dispatch setQuery action with trimmed text', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, '  comida  ');
      fireEvent.press(searchButton);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: { scope: 'expenses', query: 'comida' }
      });
    });

    it('should dispatch setQuery(null) when submitting empty text', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, '   ');
      fireEvent.press(searchButton);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: { scope: 'expenses', query: null }
      });
    });

    it('should submit search on keyboard return', async () => {
      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');

      fireEvent.changeText(input, 'test');
      fireEvent(input, 'submitEditing');

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: { scope: 'expenses', query: 'test' }
      });
    });
  });

  describe('Clear Button Behavior', () => {
    it('should clear input when clear button is pressed', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
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
        payload: { scope: 'expenses', query: null }
      });
    });
  });

  describe('Store Synchronization', () => {
    it('should initialize input from store value', () => {
      store = mockStore({
        search: { queries: { expenses: 'existing search', incomes: null } }
      });

      const { getByPlaceholderText } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      expect(input.props.value).toBe('existing search');
    });

    it('should clear input when store query becomes null', async () => {
      store = mockStore({
        search: { queries: { expenses: 'test', incomes: null } }
      });

      const { getByPlaceholderText, rerender } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      expect(input.props.value).toBe('test');

      // Update store to null
      store = mockStore({
        search: { queries: { expenses: null, incomes: null } }
      });

      rerender(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    it('should sync input when store query changes', async () => {
      store = mockStore({
        search: { queries: { expenses: 'initial', incomes: null } }
      });

      const { getByPlaceholderText, rerender } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      expect(input.props.value).toBe('initial');

      // Update store value
      store = mockStore({
        search: { queries: { expenses: 'updated', incomes: null } }
      });

      rerender(
        <Provider store={store}>
          <BarSearch scope="expenses" />
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
          <BarSearch scope="expenses" />
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
          <BarSearch scope="expenses" />
        </Provider>
      );

      const input = getByPlaceholderText('Buscar...');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(input, '     ');
      fireEvent.press(searchButton);

      const actions = store.getActions();
      expect(actions).toContainEqual({
        type: setQuery.type,
        payload: { scope: 'expenses', query: null }
      });
    });

    it('should handle special characters', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <BarSearch scope="expenses" />
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
        payload: { scope: 'expenses', query: specialText }
      });
    });
  });

  describe('BarSearch: limpieza de la query', () => {
    it('limpia la query del store al desmontarse, no al re-renderizar', () => {
      const realStore = configureStore({
        reducer: { search: searchReducer },
        preloadedState: { search: { queries: { expenses: 'luz', incomes: null } } }
      });
      const tree = (
        <Provider store={realStore}>
          <BarSearch scope="expenses" />
        </Provider>
      );

      const { rerender, unmount } = render(tree);
      rerender(tree);
      expect(realStore.getState().search.queries.expenses).toBe('luz');

      unmount();
      expect(realStore.getState().search.queries.expenses).toBeNull();
    });

    it('cada pantalla conserva su propia búsqueda', () => {
      const realStore = configureStore({
        reducer: { search: searchReducer },
        preloadedState: { search: { queries: { expenses: 'luz', incomes: 'sueldo' } } }
      });

      const expenses = render(
        <Provider store={realStore}>
          <BarSearch scope="expenses" />
        </Provider>
      );
      render(
        <Provider store={realStore}>
          <BarSearch scope="incomes" />
        </Provider>
      );

      expenses.unmount();

      expect(realStore.getState().search.queries.expenses).toBeNull();
      expect(realStore.getState().search.queries.incomes).toBe('sueldo'); // no se toca
    });
  });
});
