import { AuthState } from "./auth-reducers.type";
import { DateState } from "./date-reducers.type";
import { SearchExpensesState } from "./search-expenses-reducers";

export type RootState = {
  auth: AuthState;
  date: DateState;
  search: SearchExpensesState;
}