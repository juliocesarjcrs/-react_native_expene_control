import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore, { MockStoreEnhanced } from 'redux-mock-store';
import LastExpensesScreen from '../LastExpensesScreen';
import * as expensesService from '../../../services/expenses';
import { setQuery } from '~/features/search/searchSlice';

// Mock navigationP
const mockNavigation = {
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  dispatch: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  canGoBack: jest.fn().mockReturnValue(true),
  getParent: jest.fn(),
  getState: jest.fn(),
  getId: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  navigateDeprecated: jest.fn(),
  preload: jest.fn()
} as any;

// Mock services
jest.mock('../../../services/expenses');
const getLastExpensesWithPaginate = expensesService.getLastExpensesWithPaginate as jest.Mock;

// Mock components
jest.mock('~/components/ScreenHeader', () => ({
  ScreenHeader: () => null
}));

jest.mock('../components/RenderItemExpense', () => {
  return jest.fn(() => null);
});

jest.mock('~/components/search/BarSearch', () => {
  return jest.fn(() => null);
});

jest.mock('~/components/loading/MyLoading', () => {
  return jest.fn(() => null);
});

// Mock hooks
jest.mock('~/customHooks/useThemeColors', () => ({
  useThemeColors: () => ({
    BACKGROUND: '#FFFFFF',
    DARK_GRAY: '#666666'
  })
}));

jest.mock('~/utils/showError', () => ({
  showError: jest.fn()
}));

const mockStore = configureStore<object>();

describe('LastExpensesScreen behaviors', () => {
  let store: MockStoreEnhanced<object, object>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({ search: { query: null } });

    getLastExpensesWithPaginate.mockImplementation(({ page, query }) => {
      if (page === 1 && !query) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              value: `Expense ${i + 1}`,
              description: `Expense ${i + 1}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      if (page === 2 && !query) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 5 }, (_, i) => ({
              id: 11 + i,
              value: `Expense ${11 + i}`,
              description: `Expense ${11 + i}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      if (page === 1 && query) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 7 }, (_, i) => ({
              id: 100 + i,
              value: `Filtered ${query} ${i}`,
              description: `Filtered ${query} ${i}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      if (page === 2 && query) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 3 }, (_, i) => ({
              id: 200 + i,
              value: `Filtered ${query} ${i + 7}`,
              description: `Filtered ${query} ${i + 7}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('should reset the query on mount', () => {
    store = mockStore({ search: { query: 'something' } });

    render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    const actions = store.getActions();
    expect(actions[0].type).toBe(setQuery.type);
    expect(actions[0].payload).toBe(null);
  });

  it('should fetch first page on mount with query null', async () => {
    store = mockStore({ search: { query: null } });

    render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          query: null,
          take: 15,
          orderBy: 'date'
        })
      );
    });
  });

  it('should paginate and accumulate data on scroll', async () => {
    store = mockStore({ search: { query: null } });

    const { getByTestId } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    const flatList = getByTestId('flatlist-expenses');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, query: null })
      );
    });
  });

  it('should fetch filtered data when query changes', async () => {
    store = mockStore({ search: { query: null } });

    const { rerender } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    store = mockStore({ search: { query: 'test' } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: 'test' })
      );
    });
  });

  it('should paginate filtered data on scroll', async () => {
    // Start with null query first
    store = mockStore({ search: { query: null } });

    const { getByTestId, rerender } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    // Change to filter query
    store = mockStore({ search: { query: 'filter' } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    // Wait for fetch with query: 'filter'
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: 'filter' })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    // Simulate scroll for pagination
    const flatList = getByTestId('flatlist-expenses');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, query: 'filter' })
      );
    });
  });

  it('should stop fetching when no more data', async () => {
    getLastExpensesWithPaginate.mockImplementation(({ page }) => {
      if (page === 1) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              value: `Expense ${i + 1}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    store = mockStore({ search: { query: null } });

    const { getByTestId } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });

    const flatList = getByTestId('flatlist-expenses');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    expect(getLastExpensesWithPaginate).not.toHaveBeenCalled();
  });

  it('should reset data when query changes from value to null', async () => {
    // Start with null query first
    store = mockStore({ search: { query: null } });

    const { rerender } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    // Change to test query
    store = mockStore({ search: { query: 'test' } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: 'test' })
      );
    });

    getLastExpensesWithPaginate.mockClear();

    // Change query back to null
    store = mockStore({ search: { query: null } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });
  });
});
