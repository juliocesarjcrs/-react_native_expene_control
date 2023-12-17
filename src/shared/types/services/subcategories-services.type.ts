import { SubcategoryModel } from "../models";


export type CreateSubcategoryPayload = Omit<SubcategoryModel, 'id'>;
export type EditSubcategoryPayload = Partial<SubcategoryModel>;

export type GetSubategoriesByCategoryQuery= {
  withExpenses?: boolean;
}
export type GetSubategoriesByCategoryResponse = SubcategoryModel[];