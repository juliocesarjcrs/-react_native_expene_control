import { BudgetModel } from '../models';

export type CreateBudgetPayload = Omit<BudgetModel, 'id' | 'createdAt' | 'userId'>;
export type EditBudgetPayload = Partial<BudgetModel>;

export type GetBudgetsQuery = {
  year: number;
  city: string;
};

export type GetBudgetsResponse = {
  data: BudgetModel[];
};

export type BudgetSummaryCategory = {
  categoryId: number;
  categoryName: string;
  budget: number;
  subcategories: Array<{
    subcategoryId: number;
    subcategoryName: string;
    budget: number;
  }>;
};

export type GetBudgetSummaryQuery = {
  year: number;
  city: string;
};

export type GetBudgetSummaryResponse = {
  data: BudgetSummaryCategory[];
  year: number;
  city: string;
  hasData: boolean;
};

export type DetectCityQuery = {
  year: number;
};

export type DetectCityResponse = {
  city: string | null;
  detected: boolean;
};
