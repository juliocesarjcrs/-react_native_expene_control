import { ExpenseModel } from "../models";

export type CreateExpensePayload = Omit<ExpenseModel, 'id'>;
export type EditExpensePayload = Partial<ExpenseModel>;


export type ExpenseSearchOptionsQuery = {
  subcategoriesId: number[]
  startDate?: Date;
  endDate?: Date;
  searchValue?: string;
  orderBy?: 'date' | 'amount';
  order?: 'ASC' | 'DESC';
}


export type GetExpensesLastMonthsFromSubcategoryQuery = {
  numMonths: number;
}


export type FindLastMonthsFromOnlyCategoryQuery = {
  numMonths: number;
}

export type ExpenseModelWithSubcategories = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  date: string;
  userId: number;
  subcategoryId: number;
  subcategories: SubcategoryShortModel;
};

export type SubcategoryShortModel = {
  id: number;
  name: string;
};

export type FindExpensesBySubcategoriesResponse = {
  expenses: ExpenseModelWithSubcategories[];
  sum: number
}

// getLastExpensesWithPaginate

export type GetLastExpensesWithPaginateQuery = {
  take?: number;
  page?: number;
  query?: string | null;
  orderBy?: string;
}

export type LastExpense = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string;
  date: string;
  dateFormat: string;
  category: string;
  iconCategory: string;
  subcategory: string;
};

export type GetLastExpensesWithPaginateResponse = {
  data: LastExpense[];
};