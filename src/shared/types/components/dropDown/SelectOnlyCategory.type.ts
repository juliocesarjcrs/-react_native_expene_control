import { SubcategoryModel } from "../../models"

export type CateroryFormat = {
  label: string
  value: number,
  iconName?: string | null
  // subcategories: SubcategoryModel[]
  icon?: () => JSX.Element;
}

export type DropDownSelectFormat = {
  id: number
  label: string
  iconName?: string | null
}
