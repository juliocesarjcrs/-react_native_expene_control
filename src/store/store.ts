import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice';
import dateReducer from '../features/date/dateSlice';
import searchReducer from '../features/search/searchSlice';

// Configuración de la tienda
export const store = configureStore({
  reducer: {
    auth: authReducer,
    date: dateReducer,
    search: searchReducer
  }
});

export default store;
