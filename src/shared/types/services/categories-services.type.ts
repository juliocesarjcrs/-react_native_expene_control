import { CategoryModel } from "../models";

export type AllExpensesByRangeDatesResponse  = {
  tableHead: string[]
  rows: (string | number)[][];
}

export type GetCategoriesParams = {
  type: number
}

export type GetCategoriesResponse  =  CategoryModel[];

export type CreateCategoryPayload = Omit<CategoryModel, 'id'>;
export type EditCategoryPayload = Partial<CategoryModel>;


// GetAllSubcategoriesExpensesByMonth
export type GetAllSubcategoriesExpensesByMonthResponse  = {
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