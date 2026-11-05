import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useForm, useWatch } from 'react-hook-form';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import MyInput from '~/components/inputs/MyInput';
import FilterSelector from '../components/FilterSelector';
import { SectionHeader } from '../products/components/shared/SectionHeader';
import { EmptyState } from '../products/components/shared/EmptyState';
import { InfoBox } from '../products/components/shared/InfoBox';

// Hooks
import { useRestaurantData } from './hooks/useRestaurantData';

// Types
import { RestaurantStats } from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Config
import { screenConfigs } from '~/config/screenConfigs';

/**
 * Desde esta fecha rige la convención "primera línea = nombre del restaurante".
 * Es solo el inicio por defecto del rango: se puede mover hacia atrás con el selector.
 */
const CUTOFF_DATE = new Date(2026, 10, 5);
const DATE_FORMAT = 'DD MMM YYYY';

const normalizeSearch = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** 'YYYY-MM-DD' o ISO con hora → Date local (evita el desfase de un día por zona horaria) */
const toLocalDate = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (value: string): string => DateFormat(toLocalDate(value), DATE_FORMAT);

const getDefaultStartDate = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today < CUTOFF_DATE ? today : new Date(CUTOFF_DATE);
};

export default function RestaurantAnalysisScreen() {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.restaurantAnalysis;

  const { loading, analysis, currentFilters, loadData } = useRestaurantData();

  const defaultStartDate = useMemo(() => getDefaultStartDate(), []);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Búsqueda
  const { control } = useForm({ defaultValues: { search: '' } });
  const searchQuery = useWatch({ control, name: 'search' });
  const normalizedSearch = normalizeSearch(searchQuery ?? '');

  const filteredStats = useMemo(
    () => analysis.stats.filter((s) => normalizeSearch(s.label).includes(normalizedSearch)),
    [analysis.stats, normalizedSearch]
  );

  const hasData = analysis.stats.length > 0;
  const startsBeforeCutoff = currentFilters !== null && currentFilters.startDate < CUTOFF_DATE;

  const toggleExpanded = (key: string) => setExpandedKey((prev) => (prev === key ? null : key));

  const renderSummaryItem = (label: string, value: string) => (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: colors.TEXT_PRIMARY }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
    </View>
  );

  const renderDishes = (stat: RestaurantStats) => {
    const dishes = analysis.dishHistory.filter((h) => h.restaurantKey === stat.restaurantKey);

    if (dishes.length === 0) {
      return (
        <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
          Sin platos repetidos. Anota «plato — $precio» en las líneas siguientes para comparar.
        </Text>
      );
    }

    return dishes.map((dish) => {
      const trendColor =
        dish.change > 0 ? colors.ERROR : dish.change < 0 ? colors.SUCCESS : colors.TEXT_SECONDARY;
      const sign = dish.change > 0 ? '+' : '';

      return (
        <View key={dish.dishKey} style={styles.dishRow}>
          <Text style={[styles.dishName, { color: colors.TEXT_PRIMARY }]}>
            {dish.dishLabel} ({dish.count} veces)
          </Text>
          <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
            {NumberFormat(dish.firstPrice)} → {NumberFormat(dish.lastPrice)}{' '}
            <Text style={{ color: trendColor }}>
              ({sign}
              {dish.changePercent}%)
            </Text>
          </Text>
          <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
            Mínimo {NumberFormat(dish.minPrice)} · máximo {NumberFormat(dish.maxPrice)}
          </Text>
        </View>
      );
    });
  };

  const renderRestaurant = (stat: RestaurantStats) => {
    const isExpanded = expandedKey === stat.restaurantKey;

    return (
      <TouchableOpacity
        key={stat.restaurantKey}
        style={[
          styles.card,
          { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
        ]}
        activeOpacity={0.7}
        onPress={() => toggleExpanded(stat.restaurantKey)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: colors.TEXT_PRIMARY }]}>{stat.label}</Text>
            <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
              {stat.visits} {stat.visits === 1 ? 'visita' : 'visitas'} ·{' '}
              {NumberFormat(stat.totalCost)}
            </Text>
            <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
              Promedio {NumberFormat(stat.avgCost)} · última {formatDate(stat.lastDate)}
            </Text>
          </View>
          <Icon
            type="material-community"
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.TEXT_SECONDARY}
          />
        </View>

        {isExpanded && (
          <View style={[styles.cardBody, { borderTopColor: colors.BORDER }]}>
            {stat.variants.length > 1 && (
              <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
                Escrito de varias formas: {stat.variants.join(', ')}
              </Text>
            )}
            {stat.viaticosVisits > 0 && (
              <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
                Viáticos: {stat.viaticosVisits} {stat.viaticosVisits === 1 ? 'visita' : 'visitas'} ·{' '}
                {NumberFormat(stat.viaticosCost)}
              </Text>
            )}
            <Text style={[styles.sectionLabel, { color: colors.TEXT_PRIMARY }]}>
              Precio de platos
            </Text>
            {renderDishes(stat)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) return <MyLoading />;

    if (hasData) {
      return (
        <View style={styles.resultsContainer}>
          {/* Resumen */}
          <View
            style={[
              styles.summary,
              { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
            ]}
          >
            {renderSummaryItem('Visitas', String(analysis.records.length))}
            {renderSummaryItem('Gasto', NumberFormat(analysis.totalCost))}
            {renderSummaryItem('Restaurantes', String(analysis.stats.length))}
          </View>

          {analysis.viaticosVisits > 0 && (
            <InfoBox
              icon="briefcase-account"
              text={`Viáticos de Silvia: ${analysis.viaticosVisits} ${
                analysis.viaticosVisits === 1 ? 'visita' : 'visitas'
              } · ${NumberFormat(analysis.viaticosCost)}`}
              compact
            />
          )}

          {analysis.skipped > 0 && (
            <InfoBox
              icon="information"
              text={`${analysis.skipped} ${
                analysis.skipped === 1 ? 'registro omitido' : 'registros omitidos'
              }: sin comentario o con formato de producto (tienda, kg o un).`}
              compact
            />
          )}

          {/* Posibles duplicados (solo aviso) */}
          {analysis.similar.length > 0 && (
            <>
              <SectionHeader
                title="Posibles duplicados"
                count={analysis.similar.length}
                icon="alert-circle-outline"
                iconColor={colors.WARNING}
              />
              <InfoBox
                type="warning"
                icon="alert"
                text="Nombres casi iguales. Si son el mismo, edita el comentario para escribirlo igual."
                compact
              />
              {analysis.similar.map((pair) => (
                <Text
                  key={`${pair.keyA}-${pair.keyB}`}
                  style={[styles.similarText, { color: colors.TEXT_PRIMARY }]}
                >
                  {pair.labelA} ({pair.visitsA}) ≈ {pair.labelB} ({pair.visitsB})
                </Text>
              ))}
            </>
          )}

          {/* Restaurantes */}
          <SectionHeader
            title="Por restaurante"
            count={filteredStats.length}
            icon="silverware-fork-knife"
            iconColor={colors.SUCCESS}
          />
          {filteredStats.length > 0 ? (
            filteredStats.map(renderRestaurant)
          ) : (
            <EmptyState
              icon="magnify"
              title={`No se encontró "${searchQuery}"`}
              message="Intenta con otro término de búsqueda."
            />
          )}
        </View>
      );
    }

    if (currentFilters) {
      return (
        <EmptyState
          icon="silverware-fork-knife"
          title="No se encontraron registros"
          message={
            analysis.skipped > 0
              ? `Hay ${analysis.skipped} registros, pero ninguno tiene el formato de restaurante.`
              : 'No hay datos en este rango de fechas.'
          }
          hint='Primera línea: nombre del restaurante. Ej: "Crepes & Waffles"'
        />
      );
    }

    return null;
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

          {hasData && (
            <View style={styles.searchContainer}>
              <MyInput
                name="search"
                control={control}
                placeholder="Buscar restaurante..."
                leftIcon="magnify"
                clearButton
              />
            </View>
          )}

          {renderContent()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  content: { paddingHorizontal: 16, paddingTop: 10 },
  searchContainer: { marginBottom: 16 },
  resultsContainer: { marginTop: 10 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: MEDIUM, fontWeight: '700' },
  summaryLabel: { fontSize: SMALL, marginTop: 2 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: MEDIUM, fontWeight: '600', marginBottom: 4 },
  cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 4 },
  sectionLabel: { fontSize: SMALL + 1, fontWeight: '600', marginTop: 6 },
  detailText: { fontSize: SMALL, lineHeight: 19 },
  dishRow: { marginTop: 6 },
  dishName: { fontSize: SMALL + 1, fontWeight: '600' },
  similarText: { fontSize: SMALL + 1, marginBottom: 6, paddingLeft: 4 }
});
