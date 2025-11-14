import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, IconButton } from 'react-native-paper';
import { useThemeColors } from '~/customHooks/useThemeColors';
import CategorySelector from './components/CategorySelector';
import DateRangeSelector from './components/DateRangeSelector';
import ComparisonSummary from './components/ComparisonSummary';
import { useComparePeriods } from '~/customHooks/useComparePeriods';
import CompareResultsChart from './components/CompareResultsChart';

export default function ComparePeriodsScreen() {
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
    <ScrollView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Comparar Periodos</Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
            Analiza y compara gastos entre dos periodos de tiempo
          </Text>
        </View>
        {(canCompare || hasData) && (
          <IconButton
            icon="refresh"
            size={24}
            iconColor={colors.ERROR}
            onPress={handleReset}
            style={styles.resetButton}
          />
        )}
      </View>

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
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 4 },
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
