import createMockStoreFactory from 'redux-mock-store';

// Default initial state for searchExpenses reducer
export const initialSearchExpensesState = {
  query: null,
  fullData: []
};

// Root state mock (add more reducers as needed)
export const initialRootState = {
  search: initialSearchExpensesState
};

const mockStore = createMockStoreFactory([]);

export function createMockStore(state = initialRootState) {
  return mockStore(state);
}
