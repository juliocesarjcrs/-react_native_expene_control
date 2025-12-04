export type InitialState = {
  query: null;
  fullData: [];
};

export type SetQueryAction = {
  type: 'SET_QUERY';
  payload: string;
};

export type SetFullDataAction = {
  type: 'SET_FULL_DATA';
  payload: any[]; // Cambia este tipo según la estructura real de tu "fullData"
};

export type SearchExpensesState = {
  query: string | null;
};
export type SearchExpensesActionType = SetQueryAction | SetFullDataAction;
