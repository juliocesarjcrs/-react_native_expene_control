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
import {
  RestaurantEventStats,
  RestaurantStats
} from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';
import { MonthlySummary } from '~/utils/commentaryParser/restaurantAnalysis';

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
/** Meses que se muestran antes de pedir "Ver todos" */
const RECENT_MONTHS = 12;

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

const plural = (count: number, singular: string, pluralForm: string): string =>
  count === 1 ? singular : pluralForm;

export default function RestaurantAnalysisScreen() {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.restaurantAnalysis;

  const { loading, analysis, currentFilters, loadData } = useRestaurantData();

  const defaultStartDate = useMemo(() => getDefaultStartDate(), []);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // El resumen por mes es secundario: arranca oculto y se despliega con un toque
  const [showMonthly, setShowMonthly] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Búsqueda
  const { control } = useForm({ defaultValues: { search: '' } });
  const searchQuery = useWatch({ control, name: 'search' });
  const normalizedSearch = normalizeSearch(searchQuery ?? '');

  const filteredStats = useMemo(
    () => analysis.stats.filter((s) => normalizeSearch(s.label).includes(normalizedSearch)),
    [analysis.stats, normalizedSearch]
  );

  // Más reciente primero
  const monthsNewestFirst = useMemo(() => [...analysis.monthly].reverse(), [analysis.monthly]);
  const visibleMonths = showAllMonths
    ? monthsNewestFirst
    : monthsNewestFirst.slice(0, RECENT_MONTHS);

  const hasRecords = analysis.records.length > 0;
  const hasRestaurants = analysis.stats.length > 0;
  const hasEvents = analysis.events.length > 0;
  const startsBeforeCutoff = currentFilters !== null && currentFilters.startDate < CUTOFF_DATE;

  const toggleExpanded = (key: string) => setExpandedKey((prev) => (prev === key ? null : key));

  const renderSummaryItem = (label: string, value: string) => (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color: colors.TEXT_PRIMARY }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
    </View>
  );

  // ── Resumen mensual (colapsado por defecto) ────────────────────────────
  const renderMonth = (month: MonthlySummary) => {
    const change = month.changePercent;
    const changeColor =
      change === null || change === 0
        ? colors.TEXT_SECONDARY
        : change > 0
          ? colors.ERROR
          : colors.SUCCESS;
    const daysChange = month.daysChange;

    return (
      <View
        key={month.month}
        style={[
          styles.card,
          { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: colors.TEXT_PRIMARY }]}>
              {month.label}
              {month.isPartial ? ' (parcial)' : ''}
            </Text>
            <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
              {month.days} {plural(month.days, 'día', 'días')} · {month.visits}{' '}
              {plural(month.visits, 'registro', 'registros')}
            </Text>
            <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
              {NumberFormat(month.total)}
              {month.days > 0 ? ` · ${NumberFormat(month.avgPerDay)} por día` : ''}
            </Text>
          </View>

          {change !== null && (
            <View style={styles.changeBlock}>
              <Text style={[styles.changeValue, { color: changeColor }]}>
                {change > 0 ? '+' : ''}
                {change}%
              </Text>
              {daysChange !== null && (
                <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
                  {daysChange > 0 ? '+' : ''}
                  {daysChange} {plural(Math.abs(daysChange), 'día', 'días')}
                </Text>
              )}
              <Text style={[styles.changeLabel, { color: colors.TEXT_SECONDARY }]}>
                vs mes anterior
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMonthly = () => {
    if (analysis.monthly.length === 0) return null;

    return (
      <>
        <TouchableOpacity
          style={[styles.collapseRow, { borderColor: colors.BORDER }]}
          activeOpacity={0.7}
          onPress={() => setShowMonthly((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel="Mostrar u ocultar el resumen por mes"
        >
          <Icon
            type="material-community"
            name="calendar-month"
            size={18}
            color={colors.TEXT_SECONDARY}
          />
          <Text style={[styles.collapseText, { color: colors.TEXT_SECONDARY }]}>
            Resumen por mes ({analysis.monthly.length})
          </Text>
          <Icon
            type="material-community"
            name={showMonthly ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.TEXT_SECONDARY}
          />
        </TouchableOpacity>

        {showMonthly && (
          <View style={styles.monthlyContent}>
            <InfoBox
              icon="information"
              text="Cuenta todos los registros del rango, con o sin nombre de restaurante. Un día cuenta una vez aunque tenga varios registros. Los meses parciales no se comparan."
              compact
            />
            {visibleMonths.map(renderMonth)}
            {monthsNewestFirst.length > RECENT_MONTHS && (
              <TouchableOpacity
                style={styles.moreButton}
                activeOpacity={0.7}
                onPress={() => setShowAllMonths((prev) => !prev)}
              >
                <Text style={[styles.moreText, { color: colors.INFO }]}>
                  {showAllMonths ? 'Ver menos' : `Ver todos (${monthsNewestFirst.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  // ── Restaurantes ───────────────────────────────────────────────────────
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
              {stat.visits} {plural(stat.visits, 'visita', 'visitas')} ·{' '}
              {NumberFormat(stat.totalCost)}
            </Text>
            <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
              {stat.regularVisits > 0
                ? `Promedio ${NumberFormat(stat.avgCost)}`
                : 'Solo en eventos'}{' '}
              · última {formatDate(stat.lastDate)}
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
                Viáticos: {stat.viaticosVisits} {plural(stat.viaticosVisits, 'visita', 'visitas')} ·{' '}
                {NumberFormat(stat.viaticosCost)}
              </Text>
            )}
            {stat.eventVisits > 0 && (
              <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
                En eventos: {stat.eventVisits} {plural(stat.eventVisits, 'visita', 'visitas')} ·{' '}
                {NumberFormat(stat.eventCost)}. No entran en el promedio ni en la comparación de
                platos.
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

  const renderRestaurants = () => (
    <>
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
    </>
  );

  // ── Eventos gastronómicos ──────────────────────────────────────────────
  const renderEvent = (event: RestaurantEventStats) => (
    <View
      key={event.eventKey}
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <Text style={[styles.cardTitle, { color: colors.TEXT_PRIMARY }]}>{event.label}</Text>
      <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
        {event.visits} {plural(event.visits, 'visita', 'visitas')} · {NumberFormat(event.totalCost)}{' '}
        · última {formatDate(event.lastDate)}
      </Text>
      <Text style={[styles.detailText, { color: colors.TEXT_SECONDARY }]}>
        {event.restaurants.length > 0
          ? `Restaurantes (${event.restaurants.length}): ${event.restaurants.join(', ')}`
          : 'Sin restaurante anotado'}
      </Text>
    </View>
  );

  const renderEvents = () => (
    <>
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
      {analysis.events.map(renderEvent)}
    </>
  );

  const renderContent = () => {
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
      <View style={styles.resultsContainer}>
        {hasRecords && (
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
        )}

        {analysis.viaticosVisits > 0 && (
          <InfoBox
            icon="briefcase-account"
            text={`Viáticos de Silvia: ${analysis.viaticosVisits} ${plural(
              analysis.viaticosVisits,
              'visita',
              'visitas'
            )} · ${NumberFormat(analysis.viaticosCost)}`}
            compact
          />
        )}

        {analysis.skipped > 0 && (
          <InfoBox
            icon="information"
            text={`${analysis.skipped} ${plural(
              analysis.skipped,
              'registro sin nombre de restaurante',
              'registros sin nombre de restaurante'
            )} (sin comentario, sin nombre en la primera línea o con formato de producto). No cuentan en "Por restaurante", pero sí en el resumen por mes.`}
            compact
          />
        )}

        {renderMonthly()}

        {hasRestaurants && renderRestaurants()}
        {hasEvents && renderEvents()}

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
  collapseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12
  },
  collapseText: { flex: 1, fontSize: SMALL + 1 },
  monthlyContent: { marginBottom: 4 },
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
  changeBlock: { alignItems: 'flex-end', marginLeft: 12 },
  changeValue: { fontSize: MEDIUM, fontWeight: '700' },
  changeLabel: { fontSize: SMALL - 1, marginTop: 2 },
  moreButton: { alignSelf: 'center', paddingVertical: 8, marginBottom: 8 },
  moreText: { fontSize: SMALL + 1, fontWeight: '600', textDecorationLine: 'underline' },
  sectionLabel: { fontSize: SMALL + 1, fontWeight: '600', marginTop: 6 },
  detailText: { fontSize: SMALL, lineHeight: 19 },
  dishRow: { marginTop: 6 },
  dishName: { fontSize: SMALL + 1, fontWeight: '600' },
  similarText: { fontSize: SMALL + 1, marginBottom: 6, paddingLeft: 4 }
});
