import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SearchState = {
  query: string | null;
};

const initialState: SearchState = {
  query: null
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string | null>) => {
      state.query = action.payload;
    },
    clearQuery: (state) => {
      console.log('🔴 Redux Action: clearQuery', {
        previousQuery: state.query,
        timestamp: new Date().toISOString()
      });
      state.query = null;
    }
  }
});

export const { setQuery, clearQuery } = searchSlice.actions;
export default searchSlice.reducer;
