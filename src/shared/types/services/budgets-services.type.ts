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
