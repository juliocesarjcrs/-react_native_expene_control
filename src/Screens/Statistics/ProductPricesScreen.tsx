import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useForm } from 'react-hook-form';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import MyInput from '~/components/inputs/MyInput';
import FilterSelector, { AnalysisFilters } from './components/FilterSelector';

// Types
import { StackNavigationProp } from '@react-navigation/stack';
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { ProductPrice } from '~/shared/types/screens/Statistics/commentary-analysis.types';

// Utils
import { showError } from '~/utils/showError';
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import { findBestPrice, parseProductCommentary } from '~/utils/commentaryParser/productParser';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'productPrices'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
}

interface GroupedProducts {
  [key: string]: ProductPrice[];
}

interface ProductSummary {
  name: string;
  normalizedName: string;
  count: number;
  isWeighed: boolean;
  // Para completos: precio promedio real
  avgPrice: number;
  best: ProductPrice | null;
  worst: ProductPrice | null;
  savings: number;
  // Para incompletos: costo total acumulado
  totalCost: number;
  // Tiendas únicas donde se compró
  stores: string[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Devuelve el sufijo de unidad según si el producto se pesa o no */
const unitLabel = (isWeighed: boolean | undefined): string => (isWeighed ? '/kg' : '/un');

/** Formatea precio con su unidad o muestra costo total para incompletos */
const formatPrice = (price: number, isWeighed: boolean | undefined): string =>
  `${NumberFormat(price)}${unitLabel(isWeighed)}`;

// ─── componente ───────────────────────────────────────────────────────────────

export default function ProductPricesScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.productPrices;

  const [loading, setLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ProductPrice[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

  const { control, watch } = useForm({ defaultValues: { search: '' } });
  const searchQuery = watch('search');

  // ── carga de datos ──────────────────────────────────────────────────────────
  const loadData = async (filters: AnalysisFilters) => {
    if (!filters.subcategoryId) return;
    try {
      setLoading(true);
      setCurrentFilters(filters);

      const { data } = await findExpensesBySubcategories({
        subcategoriesId: [filters.subcategoryId],
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const parsed = data.expenses
        .map((expense: any) =>
          parseProductCommentary(expense.commentary, expense.cost, expense.date)
        )
        .filter((item): item is ProductPrice => item !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setParsedData(parsed);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  // ── agrupación y derivados ──────────────────────────────────────────────────

  const groupedProducts: GroupedProducts = parsedData.reduce((acc, item) => {
    const key = item.product
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as GroupedProducts);

  const allSummaries: ProductSummary[] = Object.keys(groupedProducts).map((key) => {
    const items = groupedProducts[key];
    const { best, worst, savings } = findBestPrice(items, key);
    const completeItems = items.filter((i) => !i.isIncomplete);
    const isWeighed = items[0].isWeighed;

    // Promedio solo sobre registros completos; si todos son incompletos → 0
    const avgPrice =
      completeItems.length > 0
        ? Math.round(completeItems.reduce((sum, i) => sum + i.pricePerKg, 0) / completeItems.length)
        : 0;

    // Tiendas únicas (sin undefined, sin duplicados)
    const stores = [...new Set(items.map((i) => i.store).filter(Boolean) as string[])];

    return {
      name: items[0].product,
      normalizedName: key,
      count: items.length,
      isWeighed: isWeighed ?? false,
      avgPrice,
      best,
      worst,
      savings,
      totalCost: items.reduce((s, i) => s + i.cost, 0),
      stores
    };
  });

  // Separar en completos e incompletos
  // Un grupo es "completo" si tiene AL MENOS UN registro con datos de peso/precio
  const completeSummaries = allSummaries.filter((s) => s.best !== null);
  const incompleteSummaries = allSummaries.filter((s) => s.best === null);

  // Aplicar búsqueda a cada grupo
  const q = searchQuery
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const filterBySearch = (s: ProductSummary) => s.normalizedName.includes(q);

  const filteredComplete = completeSummaries.filter(filterBySearch);
  const filteredIncomplete = incompleteSummaries.filter(filterBySearch);
  const hasResults = filteredComplete.length > 0 || filteredIncomplete.length > 0;

  // ── renders parciales ───────────────────────────────────────────────────────

  /** Card de producto COMPLETO: muestra mejor/peor precio, descuento si aplica */
  const renderCompleteCard = (summary: ProductSummary) => {
    const { best, worst, savings, name, count, avgPrice, isWeighed, normalizedName } = summary;

    // Tomamos el descuento del "best" si lo tiene (el precio más bajo con descuento es el más relevante)
    const bestHasDiscount = best?.originalPricePerKg && best?.discountPercent;

    return (
      <View
        key={normalizedName}
        style={[
          styles.productCard,
          { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
        ]}
      >
        {/* Cabecera: nombre + promedio */}
        <View style={styles.productHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: colors.TEXT_PRIMARY }]}>{name}</Text>
            <Text style={[styles.productCount, { color: colors.TEXT_SECONDARY }]}>
              {count} {count === 1 ? 'compra' : 'compras'}
            </Text>
          </View>

          <View style={[styles.avgPriceBadge, { backgroundColor: colors.PRIMARY + '15' }]}>
            <Text style={[styles.avgPriceText, { color: colors.PRIMARY }]}>Promedio</Text>
            <Text style={[styles.avgPriceValue, { color: colors.PRIMARY }]}>
              {formatPrice(avgPrice, isWeighed)}
            </Text>
          </View>
        </View>

        {/* Mejor vs peor precio */}
        {best && worst && (
          <View style={styles.priceComparison}>
            {/* Mejor precio */}
            <View
              style={[
                styles.priceItem,
                { backgroundColor: colors.SUCCESS + '10', borderColor: colors.SUCCESS }
              ]}
            >
              <View style={styles.priceHeader}>
                <Icon
                  type="material-community"
                  name="arrow-down"
                  size={16}
                  color={colors.SUCCESS}
                />
                <Text style={[styles.priceLabel, { color: colors.SUCCESS }]}>Mejor precio</Text>
              </View>

              {/* Precio original tachado + descuento si aplica */}
              {bestHasDiscount && (
                <View style={styles.discountRow}>
                  <Text style={[styles.strikePrice, { color: colors.TEXT_SECONDARY }]}>
                    {formatPrice(best!.originalPricePerKg!, isWeighed)}
                  </Text>
                  <View style={[styles.discountBadge, { backgroundColor: colors.SUCCESS }]}>
                    <Text style={styles.discountText}>-{best!.discountPercent}%</Text>
                  </View>
                </View>
              )}

              <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
                {formatPrice(best.pricePerKg, isWeighed)}
              </Text>
              {best.store && (
                <Text style={[styles.priceStore, { color: colors.TEXT_SECONDARY }]}>
                  📍 {best.store}
                </Text>
              )}
              <Text style={[styles.priceDate, { color: colors.TEXT_SECONDARY }]}>
                {DateFormat(best.date, 'DD MMM YYYY')}
              </Text>
            </View>

            {/* Mayor precio */}
            <View
              style={[
                styles.priceItem,
                { backgroundColor: colors.ERROR + '10', borderColor: colors.ERROR }
              ]}
            >
              <View style={styles.priceHeader}>
                <Icon type="material-community" name="arrow-up" size={16} color={colors.ERROR} />
                <Text style={[styles.priceLabel, { color: colors.ERROR }]}>Mayor precio</Text>
              </View>

              <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
                {formatPrice(worst.pricePerKg, isWeighed)}
              </Text>
              {worst.store && (
                <Text style={[styles.priceStore, { color: colors.TEXT_SECONDARY }]}>
                  📍 {worst.store}
                </Text>
              )}
              <Text style={[styles.priceDate, { color: colors.TEXT_SECONDARY }]}>
                {DateFormat(worst.date, 'DD MMM YYYY')}
              </Text>
            </View>
          </View>
        )}

        {/* Ahorro potencial */}
        {savings > 0 && (
          <View style={[styles.savingsContainer, { backgroundColor: colors.INFO + '15' }]}>
            <Icon type="material-community" name="piggy-bank" size={16} color={colors.INFO} />
            <Text style={[styles.savingsText, { color: colors.INFO }]}>
              Ahorro potencial: {formatPrice(savings, isWeighed)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  /** Card de producto INCOMPLETO: muestra costo total + tiendas si las hay */
  const renderIncompleteCard = (summary: ProductSummary) => {
    const { name, count, totalCost, stores, normalizedName, isWeighed } = summary;

    return (
      <View
        key={normalizedName}
        style={[
          styles.productCard,
          styles.incompleteCard,
          { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
        ]}
      >
        <View style={styles.productHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.productName, { color: colors.TEXT_PRIMARY }]}>{name}</Text>
              <View style={[styles.incompleteBadge, { backgroundColor: colors.WARNING + '20' }]}>
                <Text style={[styles.incompleteBadgeText, { color: colors.WARNING }]}>
                  Sin precio/kg
                </Text>
              </View>
            </View>
            <Text style={[styles.productCount, { color: colors.TEXT_SECONDARY }]}>
              {count} {count === 1 ? 'compra' : 'compras'}
              {stores.length > 0 ? ` · ${stores.join(', ')}` : ''}
            </Text>
          </View>

          {/* Costo total acumulado sin etiqueta de unidad */}
          <View style={[styles.avgPriceBadge, { backgroundColor: colors.WARNING + '15' }]}>
            <Text style={[styles.avgPriceText, { color: colors.WARNING }]}>Total</Text>
            <Text style={[styles.avgPriceValue, { color: colors.WARNING }]}>
              {NumberFormat(totalCost)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ── render principal ────────────────────────────────────────────────────────

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <FilterSelector type="expenses" onAnalyze={loadData} defaultDaysBack={365} />

          {/* Info rango seleccionado */}
          {currentFilters && (
            <View style={[styles.infoBox, { backgroundColor: colors.INFO + '15' }]}>
              <Icon type="material-community" name="information" size={16} color={colors.INFO} />
              <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
                Analizando {currentFilters.subcategoryName} desde{' '}
                {DateFormat(currentFilters.startDate, 'DD MMM YYYY')} hasta{' '}
                {DateFormat(currentFilters.endDate, 'DD MMM YYYY')}
              </Text>
            </View>
          )}

          {/* Búsqueda */}
          {parsedData.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <MyInput
                name="search"
                control={control}
                placeholder="Buscar producto..."
                leftIcon="magnify"
                clearButton
              />
            </View>
          )}

          {/* Estadísticas globales */}
          {!loading && parsedData.length > 0 && (
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.SUCCESS + '15', borderColor: colors.SUCCESS }
                ]}
              >
                <Icon
                  type="material-community"
                  name="package-variant"
                  size={20}
                  color={colors.SUCCESS}
                />
                <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                  {completeSummaries.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Con precio</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.WARNING + '15', borderColor: colors.WARNING }
                ]}
              >
                <Icon
                  type="material-community"
                  name="alert-circle-outline"
                  size={20}
                  color={colors.WARNING}
                />
                <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                  {incompleteSummaries.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                  Sin precio/kg
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.PRIMARY + '15', borderColor: colors.PRIMARY }
                ]}
              >
                <Icon type="material-community" name="chart-bar" size={20} color={colors.PRIMARY} />
                <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                  {parsedData.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Compras</Text>
              </View>
            </View>
          )}

          {/* Contenido principal */}
          {loading ? (
            <MyLoading />
          ) : hasResults ? (
            <View style={{ marginTop: 10 }}>
              {/* ── SECCIÓN: Productos con precio completo ── */}
              {filteredComplete.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Icon
                      type="material-community"
                      name="check-circle"
                      size={16}
                      color={colors.SUCCESS}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                      Comparación de precios
                    </Text>
                    <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                      {filteredComplete.length}
                    </Text>
                  </View>
                  {filteredComplete.map(renderCompleteCard)}
                </>
              )}

              {/* ── SECCIÓN: Productos incompletos ── */}
              {filteredIncomplete.length > 0 && (
                <>
                  <View
                    style={[
                      styles.sectionHeader,
                      { marginTop: filteredComplete.length > 0 ? 8 : 0 }
                    ]}
                  >
                    <Icon
                      type="material-community"
                      name="alert-circle-outline"
                      size={16}
                      color={colors.WARNING}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                      Sin datos de peso/precio
                    </Text>
                    <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                      {filteredIncomplete.length}
                    </Text>
                  </View>
                  <Text style={[styles.sectionHint, { color: colors.TEXT_SECONDARY }]}>
                    Estos registros no tienen kg ni precio/kg. Agrega el formato &ldquo;Producto — X
                    kg @ $Y/kg [Tienda]&rdquo; para incluirlos en el análisis.
                  </Text>
                  {filteredIncomplete.map(renderIncompleteCard)}
                </>
              )}
            </View>
          ) : currentFilters && parsedData.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="cart-outline"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se encontraron registros en este rango de fechas
              </Text>
              <Text style={[styles.emptyHint, { color: colors.TEXT_SECONDARY }]}>
                Formato sugerido:{'\n'}&ldquo;Producto — X kg @ $Y/kg [Tienda]&rdquo;
              </Text>
            </View>
          ) : searchQuery && !hasResults ? (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="magnify"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se encontraron productos con &ldquo;{searchQuery}&rdquo;
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: SMALL,
    lineHeight: 18
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4
  },
  statValue: {
    fontSize: MEDIUM + 2,
    fontWeight: '700',
    marginTop: 4
  },
  statLabel: {
    fontSize: SMALL - 2,
    textAlign: 'center'
  },
  // ── sección ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    flex: 1
  },
  sectionCount: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  sectionHint: {
    fontSize: SMALL - 1,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 17
  },
  // ── product card ──
  productCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10
  },
  incompleteCard: {
    opacity: 0.85
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  productName: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  },
  productCount: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  // ── badge promedio ──
  avgPriceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  avgPriceText: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },
  avgPriceValue: {
    fontSize: SMALL,
    fontWeight: '700',
    marginTop: 2
  },
  // ── comparación precios ──
  priceComparison: {
    flexDirection: 'row',
    gap: 8
  },
  priceItem: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  priceLabel: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  priceValue: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  },
  priceStore: {
    fontSize: SMALL - 2
  },
  priceDate: {
    fontSize: SMALL - 2
  },
  // ── descuento ──
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  strikePrice: {
    fontSize: SMALL - 1,
    textDecorationLine: 'line-through'
  },
  discountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  discountText: {
    fontSize: SMALL - 2,
    fontWeight: '700',
    color: '#fff'
  },
  // ── ahorro ──
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 8
  },
  savingsText: {
    fontSize: SMALL,
    fontWeight: '600',
    flex: 1
  },
  // ── badge incompleto ──
  incompleteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  incompleteBadgeText: {
    fontSize: SMALL - 3,
    fontWeight: '600'
  },
  // ── empty ──
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12
  },
  emptyText: {
    fontSize: SMALL + 1,
    textAlign: 'center'
  },
  emptyHint: {
    fontSize: SMALL - 1,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 20
  }
});
