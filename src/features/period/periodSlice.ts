import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DateFormat } from '~/utils/Helpers';

export type PeriodState = {
  selectedMonth: string; // formato 'YYYY-MM-01'
};

export type Month = PeriodState['selectedMonth'];

const initialState: PeriodState = {
  selectedMonth: DateFormat(new Date(), 'YYYY-MM-01')
};

const periodSlice = createSlice({
  name: 'period',
  initialState,
  reducers: {
    setSelectedMonth: (state, action: PayloadAction<Month>) => {
      state.selectedMonth = action.payload;
    }
  }
});

export const { setSelectedMonth } = periodSlice.actions;
export default periodSlice.reducer;
