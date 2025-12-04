import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SearchExpensesState = {
  query: string | null;
  fullData: any[]; // Cambia este tipo según la estructura real de tus datos
};

const initialState: SearchExpensesState = {
  query: null,
  fullData: []
};

const searchExpensesSlice = createSlice({
  name: 'searchExpenses',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string | null>) => {
      state.query = action.payload;
    },
    setFullData: (state, action: PayloadAction<any[]>) => {
      state.fullData = action.payload;
    }
  }
});

export const { setQuery, setFullData } = searchExpensesSlice.actions;
export default searchExpensesSlice.reducer;
