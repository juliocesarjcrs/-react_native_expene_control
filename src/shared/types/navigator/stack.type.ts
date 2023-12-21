export type MainTabParamList = {
  Gastos: undefined;
  Ingresos: undefined;
  Balance: undefined;
  Ajustes: undefined;
};

export type EditSubcategoryScreenRouteParams = {
  subcategoryObject: {
    category: {
      budget: number;
      createdAt: string;
      icon: string | null;
      id: number;
      name: string;
      type: number;
      userId: number;
    };
    categoryId: number;
    createdAt: string;
    expenses?: Array<{
      commentary: string;
      cost: number;
      createdAt: string;
      date: string;
      id: number;
      subcategoryId: number;
      userId: number;
    }>;
    icon: string | null;
    id: number;
    name: string;
    userId?: number;
  };

}

export type CreateSubcategoryScreenRouteParams = {
  idCategory: number
};
export type ExpenseStackParamList = {
  main: undefined;
  sumary: undefined;
  createExpense: undefined;
  createSubcategory: CreateSubcategoryScreenRouteParams;
  createCategory: undefined;
  editCategory: undefined;
  lastExpenses: undefined;
  editExpense: undefined;
  editSubcategory: EditSubcategoryScreenRouteParams;
};

export type EditIncomeScreenRouteParams = {
  objectIncome: {
    category: string;
    commentary: string;
    cost: number;
    createdAt: string;
    date: string;
    dateFormat: string;
    iconCategory: string;
    id: number;
    idCategory: number;
  };
}

export type IncomeStackParamList = {
  sumaryIncomes: undefined;
  createIncome: undefined;
  createCategory: undefined;
  lastIncomes: { data?: any } | undefined;
  editIncome: EditIncomeScreenRouteParams;
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
  advancedSearch: undefined;
};