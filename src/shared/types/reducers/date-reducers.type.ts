
export type MonthlyAction = {
  type: 'SET_MONTH';
  payload: string;
};

export type DateState = {
  month: string;
}