import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import createMockStore from 'redux-mock-store';
import LastIncomesScreen, { LastIncomesScreenNavigationProp } from '../LastIncomesScreen';
import * as incomesService from '../../../services/incomes';
const mockStore = createMockStore([]);

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

// Mock components
jest.mock('~/components/ScreenHeader', () => ({
  ScreenHeader: () => null
}));

jest.mock('@react-navigation/native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (effect: () => void | (() => void)) => {
      // Se comporta como un useEffect: corre al montar y cuando cambia el callback
      React.useEffect(effect, [effect]);
    }
  };
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

// jest.mock('~/customHooks/usePrevious', () => {
//   return jest.fn((value) => value);
// });

jest.mock('~/utils/showError', () => ({
  showError: jest.fn()
}));

// jest.mock('~/utils/Helpers', () => ({
//   handlerDataSearch: jest.fn((newData, oldData, query, prevQuery, page) => {
//     if (page === 1 || query !== prevQuery) {
//       return newData;
//     }
//     return [...oldData, ...newData];
//   })
// }));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const { useEffect } = jest.requireActual('react');
  return {
    ...actualNav,
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(callback, [callback]);
    }
  };
});

const storeWith = (incomes: string | null) =>
  mockStore({ search: { queries: { expenses: null, incomes: incomes } } });

describe('LastIncomesScreen flows', () => {
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = storeWith(null);

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

  it('should fetch data on mount with query null', async () => {
    store = storeWith(null);

    render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} />
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
    store = storeWith(null);

    const { rerender } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} />
      </Provider>
    );
    await waitFor(() =>
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ query: null })
      )
    );
    getLastIncomesWithPaginate.mockClear();

    const nextStore = storeWith('new-query');
    rerender(
      <Provider store={nextStore}>
        <LastIncomesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'new-query', page: 1 })
      );
    });
  });

  it('should paginate on scroll to end', async () => {
    store = storeWith(null);

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    getLastIncomesWithPaginate.mockClear();

    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('should fetch last incomes on mount if query is null and paginate on scroll', async () => {
    store = storeWith(null);
    getLastIncomesWithPaginate.mockClear();

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0].query).toBe(null);
      expect(calls[0][0].page).toBe(1);
    });

    getLastIncomesWithPaginate.mockClear();

    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.some((call) => call[0].page === 2)).toBe(true);
    });
  });

  // it('should not fetch with old query after mount reset, only with null', async () => {
  //  const realStore = createRealStore('old-query');
  // getLastIncomesWithPaginate.mockClear();

  // console.log('setQuery(null):', JSON.stringify(setQuery(null)));

  // render(
  //   <Provider store={realStore}>
  //     <LastIncomesScreen navigation={mockNavigation} />
  //   </Provider>
  // );

  // // Dale un momento a los efectos y mira el estado SIN esperar una llamada concreta
  // await act(async () => {
  //   await Promise.resolve();
  // });
  // console.log('estado tras montar:', JSON.stringify(realStore.getState().search));
  // console.log('llamadas:', JSON.stringify(getLastIncomesWithPaginate.mock.calls));
  //   expect(realStore.getState().search.query).toBeNull();

  //   // Y la última petición ya no usa el query viejo
  //   const calls = getLastIncomesWithPaginate.mock.calls;
  //   expect(calls[calls.length - 1][0].query).toBeNull();
  // });

  it('should stop fetching when no more data', async () => {
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
      return Promise.resolve({ data: { data: [] } });
    });

    store = storeWith(null);

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={mockNavigation} />
      </Provider>
    );

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    getLastIncomesWithPaginate.mockClear();

    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    expect(getLastIncomesWithPaginate).not.toHaveBeenCalled();
  });
});
