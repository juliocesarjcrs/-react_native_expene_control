import { ExpenseModel, SubcategoryModel } from '../models';

export type CreateExpensePayload = Omit<ExpenseModel, 'id' | 'createdAt' | 'userId'> &
  Partial<Pick<ExpenseModel, 'commentary'>>;
export type EditExpensePayload = Partial<ExpenseModel>;

export type ExpenseSearchOptionsQuery = {
  subcategoriesId: string;
  startDate?: Date;
  endDate?: Date;
  searchValue?: string;
  orderBy?: 'date' | 'amount';
  order?: 'ASC' | 'DESC';
};

export type GetExpensesLastMonthsFromSubcategoryQuery = {
  numMonths: number;
};

export type FindLastMonthsFromOnlyCategoryQuery = {
  numMonths: number;
};

export type ExpenseModelWithSubcategories = {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  date: string;
  // userId: number;
  // subcategoryId: number;
  subcategory: SubcategoryShortModel;
};

export type SubcategoryShortModel = {
  id: number;
  name: string;
};

export type FindExpensesBySubcategoriesResponse = {
  expenses: ExpenseModelWithSubcategories[];
  sum: number;
};

// getLastExpensesWithPaginate

export type GetLastExpensesWithPaginateQuery = {
  take?: number;
  page?: number;
  query?: string | null;
  orderBy?: string;
};

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

export type GetExpensesFromSubcategoryResponse = ExpenseModel[];
export type CreateExpenseResponse = ExpenseModel;

export type ComparePeriodsResponse = {
  periodA: {
    range: {
      start: string;
      end: string;
    };
    total: number;
    months: number;
    averageMonthly: number;
  };
  periodB: {
    range: {
      start: string;
      end: string;
    };
    total: number;
    months: number;
    averageMonthly: number;
  };
  comparison: {
    total: {
      difference: number;
      percentageChange: string | null;
      trend: 'increase' | 'decrease' | 'equal';
    };
    monthlyAverage: {
      difference: number;
      percentageChange: string | null;
      trend: 'increase' | 'decrease' | 'equal';
    };
    explanation: string;
  };
  chartData?: {
    labels: string[];
    datasets: {
      data: number[];
      label: string;
      color: string;
    }[];
  };
};

export type ComparePeriodsPayload = {
  categories: {
    categoryId: number;
    subcategoriesId: number[];
  }[];
  periodA: {
    start: Date;
    end: Date;
  };
  periodB: {
    start: Date;
    end: Date;
  };
};

export type GetOneExpenseResponse = ExpenseModel & {
  subcategory: SubcategoryModel;
};
