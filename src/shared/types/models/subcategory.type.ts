import { CategoryModel } from "./category.type";

export type SubcategoryModel = {
  id: number;
  createdAt?: string;
  name: string;
  icon?: string | null;
  categoryId?: number;

  // RELACIÓN
  category?: CategoryModel;
}