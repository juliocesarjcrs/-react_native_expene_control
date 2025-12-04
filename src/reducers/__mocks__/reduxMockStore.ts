import configureStore from 'redux-mock-store';

// Default initial state for searchExpenses reducer
export const initialSearchExpensesState = {
  query: null,
  fullData: []
};

// Root state mock (add more reducers as needed)
export const initialRootState = {
  search: initialSearchExpensesState
};

const mockStore = configureStore([]);

export function createMockStore(state = initialRootState) {
  return mockStore(state);
}
