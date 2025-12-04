export type IncomeModel = {
  id: number;
  amount: number;
  categoryId: number;
  date: string;
  commentary: string | null;
  createdAt?: string;
};
