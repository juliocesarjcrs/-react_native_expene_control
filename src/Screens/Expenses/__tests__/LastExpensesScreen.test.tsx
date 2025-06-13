import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import LastExpensesScreen from '../LastExpensesScreen';
import * as expensesService from '../../../services/expenses';
import { setQuery } from '../../../features/searchExpenses/searchExpensesSlice';

jest.mock('../../../services/expenses');
const getLastExpensesWithPaginate = expensesService.getLastExpensesWithPaginate as jest.Mock;

const mockStore = configureStore([]);
// Mock navigation con todos los métodos requeridos por LastExpenseScreenNavigationProp
const navigation = {
  addListener: jest.fn(() => () => {}),
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
  // Métodos de StackActionHelpers
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

describe('LastExpensesScreen flows', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ search: { query: null } });
    getLastExpensesWithPaginate.mockImplementation(({ page }) => {
      if (page === 1) {
        return Promise.resolve({ data: { data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, value: `Gasto ${i + 1}` })) } });
      }
      if (page === 2) {
        return Promise.resolve({ data: { data: [{ id: 11, value: 'Gasto 11' }] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('debe resetear el query al montar', () => {
    store = mockStore({ search: { query: 'algo' } });
    render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    const actions = store.getActions();
    expect(actions[0].type).toBe(setQuery.type);
    expect(actions[0].payload).toBe(null);
  });

  it('debe hacer fetch de los últimos gastos al montar y paginar al hacer scroll', async () => {
    store = mockStore({ search: { query: null } });
    getLastExpensesWithPaginate.mockClear();
    const { getByTestId } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    // Espera a que se haga fetch con query=null
    await waitFor(() => {
      const calls = getLastExpensesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0].query).toBe(null);
      expect(calls[0][0].page).toBe(1);
    });
    // Simula paginación
    const flatList = getByTestId('flatlist-expenses');
    if (flatList.props.onEndReached) {
      await act(async () => {
        flatList.props.onEndReached();
      });
    }
    await waitFor(() => {
      const calls = getLastExpensesWithPaginate.mock.calls;
      expect(calls.some(call => call[0].page === 2)).toBe(true);
    });
  });

  it('no debe hacer fetch con un query viejo después del reset, solo con null', async () => {
    store = mockStore({ search: { query: 'viejo-query' } });
    getLastExpensesWithPaginate.mockClear();
    const { rerender } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    // Simula el reset del query a null
    store = mockStore({ search: { query: null } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    await waitFor(() => {
      const calls = getLastExpensesWithPaginate.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[calls.length - 1][0].query).toBe(null);
    });
  });
});
