export type CateroryFormat = {
  label: string;
  value: number;
  iconName?: string | null;
  icon?: () => JSX.Element;
};

export type DropDownSelectFormat = {
  id: number;
  label: string;
  iconName?: string | null;
};
