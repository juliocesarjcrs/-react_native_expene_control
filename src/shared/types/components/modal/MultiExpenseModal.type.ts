// types.ts
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';

export type ExpenseModal = {
  cost: number;
  description: string | null;
  categoryId: number | null;
  subcategoryId: number | null;
  date?: Date;
}

export type CategoryDropdown = {
  label: string;
  value: number;
  icon?: () => React.ReactElement;
  subcategories?: SubcategoryDropdown[];
}

export type SubcategoryDropdown = {
  label: string;
  value: number;
}

export type MultiExpenseModalProps = {
  imageUri?: string | null;
  visible: boolean;
  onSave: (expenses: CreateExpensePayload[]) => void;
  onClose: () => void;
  initialExpenses?: ExpenseModal[];
}

export type ExpenseItemProps = {
  item: ExpenseModal;
  index: number;
  categories: CategoryDropdown[];
  onRemove: (index: number) => void;
  onUpdate: <K extends keyof ExpenseModal>(index: number, field: K, value: ExpenseModal[K]) => void;
  isDropdownOpen: number | null;
  setIsDropdownOpen: (index: number | null) => void;
}
