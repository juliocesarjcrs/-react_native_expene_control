import { useState } from 'react';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateRangeHandlers {
  startDate: Date;
  endDate: Date;
  showStartDate: boolean;
  showEndDate: boolean;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  openStartDate: () => void;
  closeStartDate: () => void;
  openEndDate: () => void;
  closeEndDate: () => void;
  handleStartDateChange: (date: Date | undefined) => void;
  handleEndDateChange: (date: Date | undefined) => void;
}

/**
 * Hook reutilizable para manejar un rango de fechas con estado de visibilidad
 * de los pickers. Usado por FilterSelector y MultiSubcategoryFilter.
 */
export function useDateRange(defaultDaysBack = 365): DateRangeHandlers {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - defaultDaysBack);

  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const handleStartDateChange = (date: Date | undefined) => {
    setShowStartDate(false);
    if (date) setStartDate(date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setShowEndDate(false);
    if (date) setEndDate(date);
  };

  return {
    startDate,
    endDate,
    showStartDate,
    showEndDate,
    setStartDate,
    setEndDate,
    openStartDate: () => setShowStartDate(true),
    closeStartDate: () => setShowStartDate(false),
    openEndDate: () => setShowEndDate(true),
    closeEndDate: () => setShowEndDate(false),
    handleStartDateChange,
    handleEndDateChange
  };
}
