import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { getExpensesAnalysis } from '~/services/categories';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyChip from '~/components/chip/MyChip';
import MyLoading from '~/components/loading/MyLoading';
import CategoryRankRow from './components/CategoryRankRow';
import NatureChips, {
  DEFAULT_NATURES,
  EXPENSE_NATURES,
  getNaturesSummary
} from './components/NatureChips';
import PeriodSelector from './components/PeriodSelector';
import SummaryCard from './components/SummaryCard';

// Types
import { ExpenseAnalysisResponse, ExpenseNature } from '~/shared/types/services';

// Utils
import { showError } from '~/utils/showError';
import { DEFAULT_PRESET_MONTHS, DateRange, getPresetRange } from '~/utils/periodRange';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

// Cantidad de categorías con mayor gasto que se resaltan en el ranking
const TOP_COUNT = 3;

export default function ExpenseAnalysisScreen() {
  const config = screenConfigs.expenseAnalysis;
  const colors = useThemeColors();

  const [range, setRange] = useState<DateRange>(() => getPresetRange(DEFAULT_PRESET_MONTHS, false));
  const [selectedNatures, setSelectedNatures] = useState<ExpenseNature[]>(DEFAULT_NATURES);
  const [sortDescending, setSortDescending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpenseAnalysisResponse | null>(null);

  useEffect(() => {
    // `cancelled` evita que una respuesta lenta pise a una más reciente
    let cancelled = false;

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const { data: response } = await getExpensesAnalysis({
          startDate: range.startDate,
          endDate: range.endDate,
          // Con las tres naturalezas activas no se envía filtro
          natures: selectedNatures.length === EXPENSE_NATURES.length ? undefined : selectedNatures
        });
        if (!cancelled) {
          setData(response);
        }
      } catch (e) {
        if (!cancelled) {
          showError(e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();
    return () => {
      cancelled = true;
    };
  }, [range, selectedNatures]);

  // El backend ya ordena de mayor a menor
  const topIds = useMemo(
    () => new Set((data?.categories ?? []).slice(0, TOP_COUNT).map((category) => category.id)),
    [data]
  );

  const maxTotal = useMemo(
    () => (data?.categories ?? []).reduce((max, category) => Math.max(max, category.total), 0),
    [data]
  );

  const visibleCategories = useMemo(() => {
    const categories = data?.categories ?? [];
    return sortDescending ? categories : [...categories].reverse();
  }, [data, sortDescending]);

  const hasData = data !== null && data.categories.length > 0;
  const isEmpty = data !== null && data.categories.length === 0;

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Filtros agrupados en una sola card */}
        <View
          style={[
            styles.filtersCard,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <PeriodSelector onChange={setRange} />
          <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
          <NatureChips
            selected={selectedNatures}
            totals={data?.summary.byNature}
            onChange={setSelectedNatures}
          />
        </View>

        {loading && <MyLoading />}

        {!loading && isEmpty && (
          <View style={styles.emptyState}>
            <Icon
              type="material-community"
              name="chart-bar"
              size={48}
              color={colors.TEXT_SECONDARY}
            />
            <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
              No hay gastos en el periodo seleccionado
            </Text>
          </View>
        )}

        {!loading && hasData && data && (
          <View>
            <SummaryCard
              total={data.summary.total}
              monthlyAverage={data.summary.monthlyAverage}
              months={data.period.months}
              startDate={data.period.startDate}
              endDate={data.period.endDate}
              filterText={getNaturesSummary(selectedNatures)}
            />

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>Categorías</Text>
              <MyChip
                label={sortDescending ? 'Mayor a menor' : 'Menor a mayor'}
                icon={sortDescending ? 'sort-descending' : 'sort-ascending'}
                onPress={() => setSortDescending((prev) => !prev)}
              />
            </View>

            {visibleCategories.map((category) => (
              <CategoryRankRow
                key={category.id}
                category={category}
                maxTotal={maxTotal}
                highlighted={topIds.has(category.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20
  },
  filtersCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  divider: {
    height: 1,
    marginVertical: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: SMALL + 2,
    marginTop: 12,
    textAlign: 'center'
  }
});
