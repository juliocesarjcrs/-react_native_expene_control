import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, IconButton } from 'react-native-paper';
// Components
import CategorySelector from './components/CategorySelector';
import DateRangeSelector from './components/DateRangeSelector';
import ComparisonSummary from './components/ComparisonSummary';
import { useComparePeriods } from '~/customHooks/useComparePeriods';
import CompareResultsChart from './components/CompareResultsChart';
import { ScreenHeader } from '~/components/ScreenHeader';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import { commonStyles } from '~/styles/common';

export default function ComparePeriodsScreen() {
  const config = screenConfigs.comparePeriods;
  const colors = useThemeColors();

  const [selectedCategories, setSelectedCategories] = useState<
    Array<{
      categoryId: number;
      subcategoriesId: number[];
    }>
  >([]);

  const [periodA, setPeriodA] = useState<{ start: Date; end: Date } | null>(null);
  const [periodB, setPeriodB] = useState<{ start: Date; end: Date } | null>(null);

  const { compareResults, isLoading, comparePeriods, resetComparison } = useComparePeriods();

  const handleCompare = () => {
    if (!periodA || !periodB || selectedCategories.length === 0) return;
    comparePeriods({ categories: selectedCategories, periodA, periodB });
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setPeriodA(null);
    setPeriodB(null);
    if (resetComparison) {
      resetComparison();
    }
  };

  const canCompare = periodA && periodB && selectedCategories.length > 0;
  const hasData = compareResults !== null;

  return (
    <ScrollView style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader
        title={config.title}
        subtitle={config.subtitle}
        rightComponent={
          (canCompare || hasData) && (
            <IconButton
              icon="refresh"
              size={24}
              iconColor={colors.ERROR}
              onPress={handleReset}
              style={styles.resetButton}
            />
          )
        }
      />

      <CategorySelector onChange={setSelectedCategories} />

      <View style={styles.datesRow}>
        <DateRangeSelector label="Periodo A" onChange={setPeriodA} value={periodA} />
        <DateRangeSelector label="Periodo B" onChange={setPeriodB} value={periodB} />
      </View>

      <View style={styles.buttonsRow}>
        <Button
          mode="contained"
          onPress={handleCompare}
          loading={isLoading}
          disabled={!canCompare || isLoading}
          style={[styles.compareButton, { backgroundColor: colors.PRIMARY }]}
          icon="chart-bar"
        >
          Comparar Periodos
        </Button>

        {hasData && (
          <Button
            mode="outlined"
            onPress={handleReset}
            disabled={isLoading}
            style={styles.clearButton}
            icon="close-circle-outline"
            textColor={colors.ERROR}
          >
            Limpiar
          </Button>
        )}
      </View>

      {compareResults && (
        <>
          <ComparisonSummary data={compareResults} />
          <CompareResultsChart data={compareResults} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    margin: 0
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16
  },
  compareButton: {
    flex: 1
  },
  clearButton: {
    flex: 0.4
  }
});
