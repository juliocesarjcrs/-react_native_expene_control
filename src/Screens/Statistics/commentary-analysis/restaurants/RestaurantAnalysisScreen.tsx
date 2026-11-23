import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import MyInput from '~/components/inputs/MyInput';
import FilterSelector from '../components/FilterSelector';
import { SectionHeader } from '../products/components/shared/SectionHeader';
import { EmptyState } from '../products/components/shared/EmptyState';
import { InfoBox } from '../products/components/shared/InfoBox';
import { SummaryCard } from './components/SummaryCard';
import { MonthlySection } from './components/MonthlySection';
import { RestaurantCard } from './components/RestaurantCard';
import { EventCard } from './components/EventCard';
import { SimilarPairsSection } from './components/SimilarPairsSection';

// Hooks
import { useRestaurantData } from './hooks/useRestaurantData';

// Types
import { RestaurantDishHistory } from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';
import { pluralize } from './utils/formatters';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';

// Config
import { screenConfigs } from '~/config/screenConfigs';

/**
 * Desde esta fecha rige la convención "primera línea = nombre del restaurante".
 * Es solo el inicio por defecto del rango: se puede mover hacia atrás con el selector.
 */
const CUTOFF_DATE = dayjs('2026-11-05').toDate();
const DATE_FORMAT = 'DD MMM YYYY';
const NO_DISHES: RestaurantDishHistory[] = [];

const normalizeSearch = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const getDefaultStartDate = (): Date => {
  const today = dayjs().startOf('day');
  return today.isBefore(CUTOFF_DATE) ? today.toDate() : new Date(CUTOFF_DATE);
};

export default function RestaurantAnalysisScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.restaurantAnalysis;

  const { loading, analysis, currentFilters, loadData } = useRestaurantData();

  const defaultStartDate = useMemo(() => getDefaultStartDate(), []);

  // Búsqueda
  const { control } = useForm({ defaultValues: { search: '' } });
  const searchQuery = useWatch({ control, name: 'search' });
  const normalizedSearch = normalizeSearch(searchQuery ?? '');

  const filteredStats = useMemo(
    () => analysis.stats.filter((s) => normalizeSearch(s.label).includes(normalizedSearch)),
    [analysis.stats, normalizedSearch]
  );

  // Platos repetidos de cada restaurante
  const dishesByRestaurant = useMemo(() => {
    const map = new Map<string, RestaurantDishHistory[]>();
    for (const dish of analysis.dishHistory) {
      const list = map.get(dish.restaurantKey);
      if (list) list.push(dish);
      else map.set(dish.restaurantKey, [dish]);
    }
    return map;
  }, [analysis.dishHistory]);

  const hasRecords = analysis.records.length > 0;
  const hasRestaurants = analysis.stats.length > 0;
  const hasEvents = analysis.events.length > 0;
  const startsBeforeCutoff =
    currentFilters !== null && dayjs(currentFilters.startDate).isBefore(CUTOFF_DATE, 'day');

  const renderResults = () => {
    if (loading) return <MyLoading />;
    if (!currentFilters) return null;

    if (analysis.expenseCount === 0) {
      return (
        <EmptyState
          icon="silverware-fork-knife"
          title="No se encontraron registros"
          message="No hay datos en este rango de fechas."
          hint='Primera línea: nombre del restaurante. Ej: "Crepes & Waffles"'
        />
      );
    }

    return (
      <View style={styles.results}>
        {hasRecords && (
          <SummaryCard
            visits={analysis.records.length}
            totalCost={analysis.totalCost}
            restaurants={analysis.stats.length}
          />
        )}

        {analysis.viaticosVisits > 0 && (
          <InfoBox
            icon="briefcase-account"
            text={`Viáticos de Silvia: ${analysis.viaticosVisits} ${pluralize(
              analysis.viaticosVisits,
              'visita',
              'visitas'
            )} · ${NumberFormat(Math.round(analysis.viaticosCost))}`}
            compact
          />
        )}

        {analysis.skipped > 0 && (
          <InfoBox
            icon="information"
            text={`${analysis.skipped} ${pluralize(
              analysis.skipped,
              'registro sin nombre de restaurante',
              'registros sin nombre de restaurante'
            )} (sin comentario, sin nombre en la primera línea o con formato de producto). No cuentan en "Por restaurante", pero sí en el resumen por mes.`}
            compact
          />
        )}

        <MonthlySection months={analysis.monthly} />

        {hasRestaurants && (
          <View>
            <SimilarPairsSection pairs={analysis.similar} />
            <SectionHeader
              title="Por restaurante"
              count={filteredStats.length}
              icon="silverware-fork-knife"
              iconColor={colors.SUCCESS}
            />
            {filteredStats.length > 0 ? (
              filteredStats.map((stat) => (
                <RestaurantCard
                  key={stat.restaurantKey}
                  stat={stat}
                  dishes={dishesByRestaurant.get(stat.restaurantKey) ?? NO_DISHES}
                />
              ))
            ) : (
              <EmptyState
                icon="magnify"
                title={`No se encontró "${searchQuery}"`}
                message="Intenta con otro término de búsqueda."
              />
            )}
          </View>
        )}

        {hasEvents && (
          <View>
            <SectionHeader
              title="Eventos"
              count={analysis.events.length}
              icon="calendar-star"
              iconColor={colors.INFO}
            />
            <InfoBox
              icon="information"
              text="Sus precios suelen ser más bajos: no entran en el promedio de cada restaurante ni en la comparación de platos."
              compact
            />
            {analysis.events.map((event) => (
              <EventCard key={event.eventKey} event={event} />
            ))}
          </View>
        )}

        {!hasRecords && (
          <InfoBox
            type="warning"
            icon="alert"
            text="Ninguno de los registros tiene nombre de restaurante en la primera línea."
            compact
          />
        )}
      </View>
    );
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <FilterSelector
            type="expenses"
            onAnalyze={loadData}
            defaultDaysBack={30}
            defaultStartDate={defaultStartDate}
          />

          {currentFilters && (
            <InfoBox
              icon="information"
              text={`Analizando ${currentFilters.subcategoryName} desde ${DateFormat(
                currentFilters.startDate,
                DATE_FORMAT
              )} hasta ${DateFormat(currentFilters.endDate, DATE_FORMAT)}`}
            />
          )}

          {startsBeforeCutoff && (
            <InfoBox
              type="warning"
              icon="alert"
              text={`Incluye fechas anteriores al ${DateFormat(
                CUTOFF_DATE,
                DATE_FORMAT
              )}. Los comentarios viejos que no empiezan por el nombre del restaurante aparecen como restaurantes sueltos.`}
              compact
            />
          )}

          {hasRestaurants && (
            <View style={styles.search}>
              <MyInput
                name="search"
                control={control}
                placeholder="Buscar restaurante..."
                leftIcon="magnify"
                clearButton
              />
            </View>
          )}

          {renderResults()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  search: { marginBottom: 16 },
  results: { marginTop: 12 }
});
