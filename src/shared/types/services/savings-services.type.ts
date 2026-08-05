export type FinancialRecord = {
  id: number;
  createdAt: string;
  saving: number;
  expense: number;
  income: number;
  operationalExpense: number;
  operationalSaving: number;
  commentary: string | null;
  date: string;
  userId: number;
};

export type GetSavingsByUserQuery = {
  numMonths: number;
};
export type Graph = {
  labels: string[];
  expenses: number[];
  incomes: number[];
  savings: number[];
  operationalExpenses: number[];
  operationalSavings: number[];
};
export type GetSavingsByUserResponse = {
  data: FinancialRecord[];
  graph: Graph;
};

export type GetUpdateAllSavingsByUserQuery = {
  numMonths: number;
};

// Types for Savings Analysis Service

export type SavingsPeriodAnalysisQuery = {
  startDate: string; // ISO date format
  endDate: string; // ISO date format
  compareWithPrevious?: boolean;
};

export type PeriodData = {
  totalSaving: number;
  totalIncome: number;
  totalExpense: number;
  avgMonthlySaving: number;
  savingPercentage: number;
  monthsCount: number;
  totalOperationalExpense: number;
  totalOperationalSaving: number;
  avgMonthlyOperationalSaving: number;
  operationalSavingPercentage: number;
};

export type MonthlyBreakdownItem = {
  id: number;
  month: string; // Format: "Ene 2025"
  date: string; // ISO date
  saving: number;
  income: number;
  expense: number;
  savingPercentage: number;
  operationalExpense: number;
  operationalSaving: number;
  operationalSavingPercentage: number;
};

export type TrendInfo = {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
};

export type TrendData = TrendInfo & {
  operational: TrendInfo;
};

export type ComparisonData = {
  previousPeriod: {
    totalSaving: number;
    avgMonthlySaving: number;
    savingPercentage: number;
    totalOperationalSaving: number;
    avgMonthlyOperationalSaving: number;
    operationalSavingPercentage: number;
  };
  difference: number;
  percentageChange: number;
  operationalDifference: number;
  operationalPercentageChange: number;
};

export type SavingsPeriodAnalysisResponse = {
  periodData: PeriodData;
  monthlyBreakdown: MonthlyBreakdownItem[];
  trend: TrendData;
  comparison?: ComparisonData;
};
