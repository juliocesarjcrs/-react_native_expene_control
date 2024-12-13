import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateState } from '../../shared/types/reducers/date-reducers.type';
import { DateFormat } from '../../utils/Helpers';



const initialState: DateState = {
  month: DateFormat(new Date(), "YYYY-MM-DD"),
};

const dateSlice = createSlice({
  name: 'date',
  initialState,
  reducers: {
    setMonth: (state, action: PayloadAction<string>) => {
      state.month = action.payload;
    },
  },
});

export const { setMonth } = dateSlice.actions;
export default dateSlice.reducer;
