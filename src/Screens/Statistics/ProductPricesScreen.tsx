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

export default function ProductPricesScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.productPrices;

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ProductPrice[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

  const { control, watch } = useForm({
    defaultValues: { search: '' }
  });
  const searchQuery = watch('search');

  const loadData = async (filters: AnalysisFilters) => {
    if (!filters.subcategoryId) return;

    try {
      setLoading(true);
      setCurrentFilters(filters);

      // Llamar al endpoint con filtros
      const { data } = await findExpensesBySubcategories({
        subcategoriesId: [filters.subcategoryId],
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      // Parsear comentarios
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

  // Agrupar productos por nombre (normalizado)
  const groupedProducts: GroupedProducts = parsedData.reduce((acc, item) => {
    // Normalizar nombre del producto (lowercase, sin acentos)
    const normalizedName = item.product
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!acc[normalizedName]) {
      acc[normalizedName] = [];
    }
    acc[normalizedName].push(item);
    return acc;
  }, {} as GroupedProducts);

  // Filtrar por búsqueda
  const filteredProducts = Object.keys(groupedProducts).filter((productName) =>
    productName.includes(searchQuery.toLowerCase())
  );

  // Obtener productos únicos para análisis
  const uniqueProducts = Object.keys(groupedProducts).map((productName) => {
    const items = groupedProducts[productName];
    const analysis = findBestPrice(items, productName);

    return {
      name: items[0].product, // Nombre original (con mayúsculas)
      normalizedName: productName,
      count: items.length,
      avgPrice: Math.round(items.reduce((sum, item) => sum + item.pricePerKg, 0) / items.length),
      ...analysis
    };
  });

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <FilterSelector type="expenses" onAnalyze={loadData} defaultDaysBack={365} />

          {/* Mensaje informativo */}
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

          {/* Estadísticas generales */}
          {!loading && parsedData.length > 0 && (
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.SUCCESS + '15',
                    borderColor: colors.SUCCESS
                  }
                ]}
              >
                <Icon
                  type="material-community"
                  name="package-variant"
                  size={20}
                  color={colors.SUCCESS}
                />
                <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                  {Object.keys(groupedProducts).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Productos</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.WARNING + '15',
                    borderColor: colors.WARNING
                  }
                ]}
              >
                <Icon type="material-community" name="chart-bar" size={20} color={colors.WARNING} />
                <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                  {parsedData.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Compras</Text>
              </View>
            </View>
          )}

          {/* Lista de productos */}
          {loading ? (
            <MyLoading />
          ) : filteredProducts.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                Comparación de Precios
              </Text>
              {filteredProducts.map((productName) => {
                const product = uniqueProducts.find((p) => p.normalizedName === productName);
                if (!product) return null;

                const { best, worst, savings } = product;

                return (
                  <View
                    key={productName}
                    style={[
                      styles.productCard,
                      {
                        backgroundColor: colors.CARD_BACKGROUND,
                        borderColor: colors.BORDER
                      }
                    ]}
                  >
                    <View style={styles.productHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { color: colors.TEXT_PRIMARY }]}>
                          {product.name}
                        </Text>
                        <Text style={[styles.productCount, { color: colors.TEXT_SECONDARY }]}>
                          {product.count} {product.count === 1 ? 'compra' : 'compras'}
                        </Text>
                      </View>
                      <View
                        style={[styles.avgPriceBadge, { backgroundColor: colors.PRIMARY + '15' }]}
                      >
                        <Text style={[styles.avgPriceText, { color: colors.PRIMARY }]}>
                          Promedio
                        </Text>
                        <Text style={[styles.avgPriceValue, { color: colors.PRIMARY }]}>
                          {NumberFormat(product.avgPrice)}/kg
                        </Text>
                      </View>
                    </View>

                    {best && worst && (
                      <View style={styles.priceComparison}>
                        <View
                          style={[
                            styles.priceItem,
                            {
                              backgroundColor: colors.SUCCESS + '10',
                              borderColor: colors.SUCCESS
                            }
                          ]}
                        >
                          <View style={styles.priceHeader}>
                            <Icon
                              type="material-community"
                              name="arrow-down"
                              size={16}
                              color={colors.SUCCESS}
                            />
                            <Text style={[styles.priceLabel, { color: colors.SUCCESS }]}>
                              Mejor precio
                            </Text>
                          </View>
                          <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
                            {NumberFormat(best.pricePerKg)}/kg
                          </Text>
                          <Text style={[styles.priceDate, { color: colors.TEXT_SECONDARY }]}>
                            {DateFormat(best.date, 'DD MMM YYYY')}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.priceItem,
                            {
                              backgroundColor: colors.ERROR + '10',
                              borderColor: colors.ERROR
                            }
                          ]}
                        >
                          <View style={styles.priceHeader}>
                            <Icon
                              type="material-community"
                              name="arrow-up"
                              size={16}
                              color={colors.ERROR}
                            />
                            <Text style={[styles.priceLabel, { color: colors.ERROR }]}>
                              Mayor precio
                            </Text>
                          </View>
                          <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
                            {NumberFormat(worst.pricePerKg)}/kg
                          </Text>
                          <Text style={[styles.priceDate, { color: colors.TEXT_SECONDARY }]}>
                            {DateFormat(worst.date, 'DD MMM YYYY')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {savings > 0 && (
                      <View
                        style={[styles.savingsContainer, { backgroundColor: colors.INFO + '15' }]}
                      >
                        <Icon
                          type="material-community"
                          name="piggy-bank"
                          size={16}
                          color={colors.INFO}
                        />
                        <Text style={[styles.savingsText, { color: colors.INFO }]}>
                          Ahorro potencial: {NumberFormat(savings)}/kg
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
                No se encontraron registros con comentarios válidos
              </Text>
              <Text style={[styles.emptyHint, { color: colors.TEXT_SECONDARY }]}>
                Formato sugerido: &quot;Producto — X kg a $Y/kg&quot;
              </Text>
            </View>
          ) : searchQuery && filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="magnify"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se encontraron productos con &quot;{searchQuery}&quot;
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

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
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
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
    fontSize: SMALL - 1,
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 12
  },
  productCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  productName: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  },
  productCount: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
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
  priceComparison: {
    flexDirection: 'row',
    gap: 8
  },
  priceItem: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6
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
  priceDate: {
    fontSize: SMALL - 2
  },
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
    paddingHorizontal: 20
  }
});
