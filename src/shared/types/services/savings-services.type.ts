export type FinancialRecord = {
  id: number;
  createdAt: string;
  saving: number;
  expense: number;
  income: number;
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
};

export type MonthlyBreakdownItem = {
  id: number;
  month: string; // Format: "Ene 2025"
  date: string; // ISO date
  saving: number;
  income: number;
  expense: number;
  savingPercentage: number;
};

export type TrendData = {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
};

export type ComparisonData = {
  previousPeriod: {
    totalSaving: number;
    avgMonthlySaving: number;
    savingPercentage: number;
  };
  difference: number;
  percentageChange: number;
};

export type SavingsPeriodAnalysisResponse = {
  periodData: PeriodData;
  monthlyBreakdown: MonthlyBreakdownItem[];
  trend: TrendData;
  comparison?: ComparisonData;
};
