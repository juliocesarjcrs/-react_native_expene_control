import { useState } from 'react';
import { getComparePeriods } from '~/services/expenses';
import {
  ComparePeriodsPayload,
  ComparePeriodsResponse
} from '~/shared/types/services/expense-service.type';

export function useComparePeriods() {
  const [compareResults, setCompareResults] = useState<ComparePeriodsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const comparePeriods = async (payload: ComparePeriodsPayload) => {
    setIsLoading(true);
    try {
      const response = await getComparePeriods(payload);
      setCompareResults(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetComparison = () => {
    setCompareResults(null);
  };

  return {
    compareResults,
    isLoading,
    comparePeriods,
    resetComparison
  };
}
