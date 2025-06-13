import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import LastIncomesScreen, { LastIncomesScreenNavigationProp } from '../LastIncomesScreen';
import * as incomesService from '../../../services/incomes';
import { mockNavigation } from '../__mocks__/navigationMock';
import { RouteProp } from '@react-navigation/native';
import { IncomeStackParamList } from '../../../shared/types';

const mockStore = configureStore([]);

jest.mock('../../../services/incomes');

const getLastIncomesWithPaginate = incomesService.getLastIncomesWithPaginate as jest.Mock;

// Extend navigation mock to satisfy type requirements
const navigation = {
  ...mockNavigation,
  getId: jest.fn(),
  getState: jest.fn(),
} as unknown as LastIncomesScreenNavigationProp;
// Usa RouteProp para el mockRoute, con el tipo correcto para LastIncomesScreen
const mockRoute: RouteProp<IncomeStackParamList, 'lastIncomes'> = {
  key: 'mock-key',
  name: 'lastIncomes',
  params: undefined,
};

describe('LastIncomesScreen flows', () => {
  let store;
  beforeEach(() => {
    store = mockStore({
      search: { query: null },
    });
    // Mock para simular paginación real
    getLastIncomesWithPaginate.mockImplementation(({ page }) => {
      if (page === 1) {
        // Simula que hay más datos (por ejemplo, 10 elementos)
        return Promise.resolve({ data: { data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, value: `Ingreso ${i + 1}` })) } });
      }
      if (page === 2) {
        // Simula que hay menos datos, indicando que es la última página
        return Promise.resolve({ data: { data: [{ id: 11, value: 'Ingreso 11' }] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('should reset query on mount', async () => {
    store = mockStore({ search: { query: 'something' } });
    render(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );
    // The first dispatched action should be setQuery(null)
    const actions = store.getActions();
    expect(actions[0].type).toBe('searchExpenses/setQuery');
    expect(actions[0].payload).toBe(null);
  });

  it('should fetch data when query changes', async () => {
    store = mockStore({ search: { query: null } });
    const { rerender } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );
    // Simulate query change
    store = mockStore({ search: { query: 'new-query' } });
    rerender(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );
    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'new-query', page: 1 })
      );
    });
  });

  it('should fetch next page when paginating', async () => {
    store = mockStore({ search: { query: 'test' } });
    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );
    // Simulate scroll to end
    fireEvent.scroll(getByTestId('flatlist-incomes'), {
      nativeEvent: { contentOffset: { y: 1000 }, contentSize: { height: 2000 }, layoutMeasurement: { height: 1000 } }
    });
    // Should call fetch for next page
    await waitFor(() => {
      expect(getLastIncomesWithPaginate).toHaveBeenCalled();
    });
  });

  it('should fetch last incomes on mount if query is null and paginate on scroll', async () => {
    // Inicia el store con query limpio
    store = mockStore({ search: { query: null } });
    getLastIncomesWithPaginate.mockClear();

    const { getByTestId } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );

    // Espera a que se haga fetch con query=null
    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0].query).toBe(null);
      expect(calls[0][0].page).toBe(1);
    });

    // Obtiene el FlatList por testID y llama manualmente a onEndReached
    const flatList = getByTestId('flatlist-incomes');
    await act(async () => {
      if (flatList.props.onEndReached) {
        flatList.props.onEndReached();
      }
    });

    // Espera a que se haga fetch para la siguiente página
    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.some(call => call[0].page === 2)).toBe(true);
    });
  });

  it('should not fetch with old query after mount reset, only with null', async () => {
    // Inicia el store con un query viejo
    store = mockStore({ search: { query: 'old-query' } });
    getLastIncomesWithPaginate.mockClear();

    const { rerender } = render(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );

    // Simula el reset del query a null
    store = mockStore({ search: { query: null } });
    rerender(
      <Provider store={store}>
        <LastIncomesScreen navigation={navigation} route={mockRoute} />
      </Provider>
    );

    await waitFor(() => {
      const calls = getLastIncomesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[calls.length - 1][0].query).toBe(null);
    });
  });
});
