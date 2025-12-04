import { CategoryModel, ExpenseModel, SubcategoryModel } from '../models';

export type CreateSubcategoryPayload = Omit<SubcategoryModel, 'id'>;
export type EditSubcategoryPayload = Partial<SubcategoryModel> & {
  name: string;
};

export type GetSubategoriesByCategoryQuery = {
  withExpenses?: boolean;
};

// GetSubcategoriesByCategory

export type SubcategoriesWithExpenses = {
  id: number;
  createdAt: string;
  name: string;
  icon: string | null;
  categoryId: number;
  userId: number;
  expenses: ExpenseModel[];
  category: CategoryModel;
};

export type GetSubategoriesByCategoryResponse = SubcategoriesWithExpenses | SubcategoryModel[];
