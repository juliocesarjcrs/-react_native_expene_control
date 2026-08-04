import { SubcategoryModel } from '../../models';
import { ExpenseNature } from '../../models/expense.type';

export type FormValues = {
  cost: number;
  commentary: string;
  nature?: ExpenseNature;
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
