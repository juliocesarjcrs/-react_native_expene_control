import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import LastIncomesScreen, { LastIncomesScreenNavigationProp } from '../LastIncomesScreen';
import * as incomesService from '../../../services/incomes';
import { RouteProp } from '@react-navigation/native';
import { IncomeStackParamList } from '../../../shared/types';
import { setQuery } from '../../../features/searchExpenses/searchExpensesSlice';

const mockStore = configureStore([]);

// Mock services
jest.mock('../../../services/incomes');
const getLastIncomesWithPaginate = incomesService.getLastIncomesWithPaginate as jest.Mock;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  canGoBack: jest.fn().mockReturnValue(true),
  getParent: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn()
} as unknown as LastIncomesScreenNavigationProp;

// Mock route
const mockRoute: RouteProp<IncomeStackParamList, 'lastIncomes'> = {
  key: 'mock-key',
  name: 'lastIncomes',
  params: undefined
};

// Mock components
jest.mock('~/components/ScreenHeader', () => ({
  ScreenHeader: () => null
}));

jest.mock('./components/RenderItemIncome', () => {
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

jest.mock('~/customHooks/usePrevious', () => {
  return jest.fn((value) => {
    const ref = React.useRef(undefined);
    React.useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  });
});

jest.mock('~/utils/showError', () => ({
  showError: jest.fn()
}));

jest.mock('~/utils/Helpers', () => ({
  handlerDataSearch: jest.fn((newData, oldData, query, prevQuery, page) => {
    // Simple implementation for testing
    if (page === 1 || query !== prevQuery) {
      return newData;
    }
    return [...oldData, ...newData];
  })
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => void) => {
    React.useEffect(() => {
      callback();
    }, []);
  }
}));

describe('LastIncomesScreen flows', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      search: { query: null }
    });

    // Mock implementation for paginated data
    getLastIncomesWithPaginate.mockImplementation(({ page, query }) => {
      if (page === 1 && !query) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              value: `Ingreso ${i + 1}`,
              description: `Ingreso ${i + 1}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      if (page === 2 && !query) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 11,
                value: 'Ingreso 11',
                description: 'Ingreso 11',
                date: new Date().toISOString()
              }
            ]
          }
        });
      }
      if (page === 1 && query) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 5 }, (_, i) => ({
              id: 100 + i,
              value: `Filtered ${query} ${i}`,
              description: `Filtered ${query} ${i}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('should reset query on mount', () => {
    store = mockStore({ search: { query: 'something' } });

    render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // The first dispatched action should be setQuery(null)
    const actions = store.getActions();
    expect(actions[0].type).toBe(setQuery.type);
    expect(actions[0].payload).toBe(null);
  });

  it('should fetch data on mount with query null', async () => {
    store = mockStore({ search: { query: null } });

    render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({
          query: null,
          page: 1,
          take: 25
        })
      );
    });
  });

  it('should fetch data when query changes', async () => {
    store = mockStore({ search: { query: null } });

    const { rerender } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ query: null })
      );
    });

    // Clear mock
    getLastIncomesWithPaginate.mockClear();

    // Simulate query change
    store = mockStore({ search: { query: 'new-query' } });
    rerender(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'new-query', page: 1 })
      );
    });
  });

  it('should paginate on scroll to end', async () => {
    store = mockStore({ search: { query: null } });

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    // Clear previous calls
    getLastIncomesWithPaginate.mockClear();

    // Simulate scroll to end
    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    // Should call fetch for next page
    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('should fetch last incomes on mount if query is null and paginate on scroll', async () => {
    store = mockStore({ search: { query: null } });
    getLastIncomesWithPaginate.mockClear();

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Wait for initial fetch with query=null
    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0].query).toBe(null);
      expect(calls[0][0].page).toBe(1);
    });

    // Clear and trigger pagination
    getLastIncomesWithPaginate.mockClear();

    // Get FlatList and call onEndReached
    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    // Wait for pagination fetch
    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.some((call) => call[0].page === 2)).toBe(true);
    });
  });

  it('should not fetch with old query after mount reset, only with null', async () => {
    // Start with old query
    store = mockStore({ search: { query: 'old-query' } });
    getLastIncomesWithPaginate.mockClear();

    const { rerender } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Simulate reset to null
    store = mockStore({ search: { query: null } });
    rerender(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      // The last call should be with query null
      expect(calls[calls.length - 1][0].query).toBe(null);
    });
  });

  it('should stop fetching when no more data', async () => {
    // Mock to return empty data on page 2
    getLastIncomesWithPaginate.mockImplementation(({ page }) => {
      if (page === 1) {
        return Promise.resolve({
          data: {
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              value: `Ingreso ${i + 1}`,
              date: new Date().toISOString()
            }))
          }
        });
      }
      return Promise.resolve({ data: { data: [] } }); // No more data
    });

    store = mockStore({ search: { query: null } });

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    // Trigger pagination
    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    // Clear and try to paginate again
    getLastIncomesWithPaginate.mockClear();

    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    // Should not call again because stopeFetch is true
    expect(getLastIncomesWithPaginate).not.toHaveBeenCalled();
  });
});
