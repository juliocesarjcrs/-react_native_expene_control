import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SearchScope = 'expenses' | 'incomes';

export type SearchState = {
  queries: Record<SearchScope, string | null>;
};

const initialState: SearchState = {
  queries: { expenses: null, incomes: null }
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<{ scope: SearchScope; query: string | null }>) => {
      state.queries[action.payload.scope] = action.payload.query;
    },
    clearQuery: (state, action: PayloadAction<SearchScope>) => {
      state.queries[action.payload] = null;
    }
  }
});

export const { setQuery, clearQuery } = searchSlice.actions;
export default searchSlice.reducer;
