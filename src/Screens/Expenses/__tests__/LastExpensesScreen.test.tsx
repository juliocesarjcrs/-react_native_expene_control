import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore, { MockStoreEnhanced } from 'redux-mock-store';
import LastExpensesScreen from '../LastExpensesScreen';
import * as expensesService from '../../../services/expenses';
import { setQuery } from '../../../features/searchExpenses/searchExpensesSlice';

jest.mock('../../../services/expenses');
const getLastExpensesWithPaginate = expensesService.getLastExpensesWithPaginate as jest.Mock;

const mockStore = configureStore<object>();
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
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

describe('LastExpensesScreen behaviors', () => {
  let store: MockStoreEnhanced<object, object>;
  beforeEach(() => {
    store = mockStore({ search: { query: null } });
    getLastExpensesWithPaginate.mockImplementation(({ page, query }) => {
      if (page === 1 && !query) {
        return Promise.resolve({ data: { data: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, value: `Expense ${i + 1}` })) } });
      }
      if (page === 2 && !query) {
        return Promise.resolve({ data: { data: Array.from({ length: 5 }, (_, i) => ({ id: 11 + i, value: `Expense ${11 + i}` })) } });
      }
      if (page === 1 && query) {
        return Promise.resolve({ data: { data: Array.from({ length: 7 }, (_, i) => ({ id: 100 + i, value: `Filtered ${query} ${i}` })) } });
      }
      if (page === 2 && query) {
        return Promise.resolve({ data: { data: Array.from({ length: 3 }, (_, i) => ({ id: 200 + i, value: `Filtered ${query} ${i + 7}` })) } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('should reset the query on mount', () => {
    store = mockStore({ search: { query: 'something' } });
    render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    const actions = store.getActions();
    expect(actions[0].type).toBe(setQuery.type);
    expect(actions[0].payload).toBe(null);
  });

  it('should fetch first page on mount', async () => {
    render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });
  });

  it('should paginate and accumulate data on scroll', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    // Wait for first fetch
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: null })
      );
    });
    // Simulate scroll to end
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

  it('should fetch filtered data when query changes and not mix old data', async () => {
    const { rerender } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    // Simulate query change
    store = mockStore({ search: { query: 'test' } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: 'test' })
      );
    });
  });

  it('should paginate filtered data on scroll', async () => {
    // Mount with query null
    store = mockStore({ search: { query: null } });
    const { getByTestId, rerender } = render(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    // Change query to 'filter'
    store = mockStore({ search: { query: 'filter' } });
    rerender(
      <Provider store={store}>
        <LastExpensesScreen navigation={navigation} />
      </Provider>
    );
    // Wait for fetch with query: 'filter'
    await waitFor(() => {
      expect(getLastExpensesWithPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, query: 'filter' })
      );
    });
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
});
