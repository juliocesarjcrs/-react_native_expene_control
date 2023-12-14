import { AuthState } from "./auth-reducers.type";
import { DateState } from "./date-reducers.type";

export type RootState = {
  auth: AuthState;
  date: DateState;
  // search: SearchExpensesState;
}