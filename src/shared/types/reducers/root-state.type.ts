import store from "../../../store/store";
// import { AuthState } from "./auth-reducers.type";
// import { DateState } from "./date-reducers.type";
// import { SearchExpensesState } from "./search-expenses-reducers";

// export type RootState = {
//   auth: AuthState;
//   date: DateState;
//   search: SearchExpensesState;
// }

// Tipos derivados automáticamente por RTK
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;