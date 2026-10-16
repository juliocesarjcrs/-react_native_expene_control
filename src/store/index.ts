import { configureStore } from '@reduxjs/toolkit';

import authReducer from '~/features/auth/authSlice';
import periodReducer from '~/features/period/periodSlice';
import searchReducer from '~/features/search/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    period: periodReducer,
    search: searchReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
