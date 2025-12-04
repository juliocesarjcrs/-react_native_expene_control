import { CategoryModel, IncomeModel } from '../models';

export type AllExpensesByRangeDatesResponse = {
  tableHead: string[];
  rows: (string | number)[][];
};

export type GetCategoriesParams = {
  type: number;
};

export type GetCategoriesResponse = CategoryModel[];

export type CreateCategoryPayload = Omit<CategoryModel, 'id' | 'userId' | 'createdAt' | 'budget'>;
export type EditCategoryPayload = Partial<CategoryModel>;

// GetAllSubcategoriesExpensesByMonth
export type GetAllSubcategoriesExpensesByMonthResponse = {
  data: CategoryExpense[];
  total: number;
};

export type SubcategoryExpense = {
  id: number;
  name: string;
  total: number;
};

export type CategoryExpense = {
  id: number;
  name: string;
  icon: string;
  type: number;
  budget: number;
  userId: number;
  total: number;
  subcategories: SubcategoryExpense[];
};

export type CategoryIncomesSumary = {
  id: number;
  name: string;
  icon: string;
  type: number;
  budget: number;
  userId: number;
  total: number;
  createdAt: string;
  incomes: IncomeModel[];
};
// getCategoryTypeIncome
export type GetCategoryTypeIncomeResponse = {
  data: CategoryIncomesSumary[];
  total: number;
};

export type CateroryFormatIncome = {
  label: string;
  value: number;
  // iconName?: string | null
};
// GetCategoryWithSubcategories
export type GetCategoryWithSubcategoriesResponse = {
  data: CategoryExpense[];
};

export type CategoryWithoutTypeAndSubcategories = Omit<CategoryExpense, 'type' | 'subcategories'>;

export type GetAllExpensesByMonthResponse = {
  data: CategoryWithoutTypeAndSubcategories[];
  total: number;
};
