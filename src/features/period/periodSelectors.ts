import type { RootState } from '~/store';

export const selectSelectedMonth = (state: RootState) => state.period.selectedMonth;
