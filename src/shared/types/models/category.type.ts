export type CategoryModel = {
  id: number;
  createdAt: string;
  name: string;
  icon: string | null;
  type: number;
  budget: number | null;
  isOperational: boolean;
  userId: number;
};
