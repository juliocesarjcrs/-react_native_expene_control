export type FinancialRecord = {
  id: number;
  createdAt: string;
  saving: number;
  expense: number;
  income: number;
  commentary: string | null;
  date: string;
  userId: number;
};

export type GetSavingsByUserQuery = {
  numMonths: number;
};
export type Graph = {
  labels: string[];
  expenses: number[];
  incomes: number[];
  savings: number[];
};
export type GetSavingsByUserResponse = {
  data: FinancialRecord[];
  graph: Graph;
};

export type GetUpdateAllSavingsByUserQuery = {
  numMonths: number;
};
