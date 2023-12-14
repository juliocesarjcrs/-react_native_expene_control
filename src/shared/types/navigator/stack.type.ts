export type MainTabParamList = {
  Gastos: undefined;
  Ingresos: undefined;
  Balance: undefined;
  Ajustes: undefined;
};

export type ExpenseStackParamList = {
  main: undefined;
  sumary: undefined;
  createExpense: undefined;
  createSubcategory: undefined;
  createCategory: undefined;
  editCategory: undefined;
  lastExpenses: undefined;
  editExpense: undefined;
  editSubcategory: undefined;
};

export type IncomeStackParamList = {
  sumaryIncomes: undefined;
  createIncome: undefined;
  createCategory: undefined;
  lastIncomes: undefined;
  editIncome: undefined;
};

export type BalanceStackParamList = {
  cashFlow: undefined;
  graphBalances: undefined;
};

export type SettingsStackParamList = {
  settings: undefined;
  editUser: undefined;
  createUser: undefined;
  changePassword: undefined;
  calculeProducts: undefined;
  createLoan: undefined;
  exportData: undefined;
};