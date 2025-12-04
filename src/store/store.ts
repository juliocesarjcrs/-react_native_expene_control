import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice';
import dateReducer from '../features/date/dateSlice';
import searchExpensesReducer from '../features/searchExpenses/searchExpensesSlice';
// import { createStore} from 'redux'

// import reducers from "~/reducers";

// const store = createStore(
//   reducers,
//   window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
// )
// export default store;

// Configuración de la tienda
export const store = configureStore({
  reducer: {
    auth: authReducer,
    date: dateReducer,
    search: searchExpensesReducer
  }
});

// Tipos derivados automáticamente por RTK
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;
