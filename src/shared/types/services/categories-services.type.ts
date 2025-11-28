import { CategoryModel, IncomeModel } from "../models";

export type AllExpensesByRangeDatesResponse = {
  tableHead: string[]
  rows: (string | number)[][];
}

export type GetCategoriesParams = {
  type: number
}

export type GetCategoriesResponse = CategoryModel[];

export type CreateCategoryPayload = Omit<CategoryModel, 'id' | 'userId' | 'createdAt' | 'budget'>;
export type EditCategoryPayload = Partial<CategoryModel>;


// GetAllSubcategoriesExpensesByMonth
export type GetAllSubcategoriesExpensesByMonthResponse = {
  data: Category[];
  total: number;
}

export type Subcategory = {
  id: number;
  name: string;
  total: number;
}

export type Category = {
  id: number;
  name: string;
  icon: string;
  type: number;
  budget: number;
  userId: number;
  total: number;
  subcategories: Subcategory[];
}

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
}

export type CateroryFormatIncome = {
  label: string
  value: number,
  // iconName?: string | null

}
// GetCategoryWithSubcategories
export type GetCategoryWithSubcategoriesResponse = {
  data: Category[];
}

export type CategoryWithoutTypeAndSubcategories = Omit<Category, 'type' | 'subcategories'>;

export type GetAllExpensesByMonthResponse = {
  data: CategoryWithoutTypeAndSubcategories[];
  total: number;
};