import { SubcategoryModel } from '../../models';

export type FormValues = {
  cost: string;
  commentary: string;
};

// DropDown item type
export type CategoryOption = {
  label: string;
  value: number;
  subcategories?: SubcategoryModel[];
};

export type SubcategoryOption = {
  label: string;
  value: number;
};
