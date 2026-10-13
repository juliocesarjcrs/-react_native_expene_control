import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';

// Services
import { getAllSubcategoriesExpensesByMonth } from '~/services/categories';
import { detectCurrentCity, getBudgetSummary } from '~/services/budgets';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyAcordeon from './components/MyAcordeon';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import YearCitySelector from '../Budgest/components/YearCytySelector';

// Types
import type { RootState } from '~/shared/types/reducers';
import type { CategoryExpense } from '~/shared/types/services';
import type { ExpenseStackParamList } from '~/shared/types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Styles
import { BIG, SMALL } from '~/styles/fonts';
import { commonStyles } from '~/styles/common';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { screenConfigs } from '~/config/screenConfigs';

export type SumaryExpenseScreenNavigationProp = StackNavigationProp<
  ExpenseStackParamList,
  'sumary'
>;

interface SumaryExpenseScreenProps {
  navigation: SumaryExpenseScreenNavigationProp;
}

interface CategoryWithData extends CategoryExpense {
  data: CategoryExpense['subcategories'];
}

type BudgetSummary = Awaited<ReturnType<typeof getBudgetSummary>>['data'];

interface SummaryResult {
  key: string;
  categories: CategoryWithData[];
  total: number;
  totalBudget: number;
  usingSpecificBudget: boolean;
}

const BADGE_OPACITY_HEX = '20';
const SHADOW_COLOR = '#000';
const DEFAULT_CITY = 'Pereira';

const EMPTY_RESULT: SummaryResult = {
  key: '',
  categories: [],
  total: 0,
  totalBudget: 0,
  usingSpecificBudget: false
};

const EMPTY_BUDGET_SUMMARY = { data: [], hasData: false } as BudgetSummary;

// Si no hay presupuestos específicos para la ciudad/año, se usa el resumen vacío.
const fetchBudgetSummary = async (year: number, city: string): Promise<BudgetSummary> => {
  try {
    const { data } = await getBudgetSummary({ year, city });
    return data;
  } catch {
    return EMPTY_BUDGET_SUMMARY;
  }
};

export default function SumaryExpenseScreen({ navigation }: SumaryExpenseScreenProps) {
  const colors = useThemeColors();
  const month = useSelector((state: RootState) => state.date.month);
  const screenConfig = screenConfigs.sumary;

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCity, setSelectedCity] = useState<string>(DEFAULT_CITY);
  const [showCitySelector, setShowCitySelector] = useState<boolean>(false);
  // Se incrementa después de detectar la ciudad y cada vez que se quiere recargar.
  const [refreshToken, setRefreshToken] = useState<number>(0);
  const [result, setResult] = useState<SummaryResult | null>(null);

  // `loading` se deriva: hay carga mientras el resultado guardado no corresponda
  // a la petición actual. Así no se llama setState de forma síncrona en un efecto.
  const requestKey = `${month}|${selectedYear}|${selectedCity}|${refreshToken}`;
  const loading = result?.key !== requestKey;

  const { categories, total, totalBudget, usingSpecificBudget } = result ?? EMPTY_RESULT;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: colors.BACKGROUND },
        card: { backgroundColor: colors.CARD_BACKGROUND },
        cityText: { color: colors.TEXT_PRIMARY },
        specificBadge: { backgroundColor: `${colors.SUCCESS}${BADGE_OPACITY_HEX}` },
        specificBadgeText: { color: colors.SUCCESS },
        titleText: { color: colors.TEXT_PRIMARY },
        fallbackText: { color: colors.TEXT_SECONDARY }
      }),
    [colors]
  );

  // Al montar y al enfocar: detectar ciudad y luego pedir recarga.
  useEffect(() => {
    let cancelled = false;

    const detectCity = async (): Promise<void> => {
      try {
        const currentYear = new Date().getFullYear();
        const { data: cityData } = await detectCurrentCity({ year: currentYear });

        if (!cancelled && cityData.detected && cityData.city) {
          setSelectedYear(currentYear);
          setSelectedCity(cityData.city);
        }
      } catch {
        // Si falla la detección, se continúa con los valores actuales
      }

      if (!cancelled) {
        setRefreshToken((prev) => prev + 1);
      }
    };

    void detectCity();
    const unsubscribe = navigation.addListener('focus', () => {
      void detectCity();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigation]);

  // Cargar datos cuando cambian mes, año, ciudad o se pide recarga.
  useEffect(() => {
    // Todavía no terminó la primera detección de ciudad
    if (refreshToken === 0) {
      return undefined;
    }

    let cancelled = false;

    const loadSummary = async (): Promise<void> => {
      try {
        const { data: expensesData } = await getAllSubcategoriesExpensesByMonth(month);
        const budgetSummary = await fetchBudgetSummary(selectedYear, selectedCity);

        const categoriesWithData: CategoryWithData[] = expensesData.data.map((element) => {
          // Presupuesto específico si existe, si no el de la categoría
          const specificBudget = budgetSummary.data.find((b) => b.categoryId === element.id);
          return {
            ...element,
            budget: specificBudget ? specificBudget.budget : element.budget,
            data: element.subcategories
          };
        });

        if (!cancelled) {
          setResult({
            key: requestKey,
            categories: categoriesWithData,
            total: expensesData.total,
            totalBudget: categoriesWithData.reduce((sum, item) => sum + item.budget, 0),
            usingSpecificBudget: budgetSummary.hasData
          });
        }
      } catch (error) {
        if (!cancelled) {
          setResult((prev) => ({ ...(prev ?? EMPTY_RESULT), key: requestKey }));
          showError(error);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [month, selectedYear, selectedCity, refreshToken, requestKey]);

  const reloadData = (): void => {
    setRefreshToken((prev) => prev + 1);
  };

  const sendEditCategoryScreen = (id: number): void => {
    navigation.navigate('editCategory', { idCategory: id });
  };

  const sendCreateCategoryScreen = (): void => {
    navigation.navigate('createCategory');
  };

  const sendCreateSubcategoryScreen = (id: number): void => {
    navigation.navigate('createSubcategory', { idCategory: id });
  };

  const sendCreateExpenseScreen = (): void => {
    navigation.navigate('createExpense');
  };

  const toggleCitySelector = (): void => {
    setShowCitySelector((prev) => !prev);
  };

  return (
    <View style={[commonStyles.screenContainer, dynamicStyles.screen]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <View style={styles.fixToText}>
          <MyButton onPress={sendCreateExpenseScreen} title="Ingresar gasto" />
          <MyButton onPress={sendCreateCategoryScreen} title="Crear Categoría" />
        </View>

        {/* Indicador de ciudad/año con opción de cambiar */}
        <View style={[styles.cityIndicator, dynamicStyles.card]}>
          <View style={styles.cityInfo}>
            <Icon
              type="material-community"
              name="map-marker"
              size={18}
              color={usingSpecificBudget ? colors.SUCCESS : colors.TEXT_SECONDARY}
            />
            <Text style={[styles.cityText, dynamicStyles.cityText]}>
              {selectedCity} - {selectedYear}
            </Text>
            {usingSpecificBudget && (
              <View style={[styles.specificBadge, dynamicStyles.specificBadge]}>
                <Text style={[styles.specificBadgeText, dynamicStyles.specificBadgeText]}>
                  Específico
                </Text>
              </View>
            )}
          </View>
          <Icon
            type="material-community"
            name={showCitySelector ? 'chevron-up' : 'tune'}
            size={22}
            color={colors.PRIMARY}
            onPress={toggleCitySelector}
          />
        </View>

        {/* Selector de ciudad/año (opcional) */}
        {showCitySelector && (
          <View style={styles.selectorWrapper}>
            <YearCitySelector
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              onConsult={reloadData}
            />
          </View>
        )}

        <View style={[styles.header, dynamicStyles.card]}>
          <Text style={[styles.title, dynamicStyles.titleText]}>
            Total gastos: {NumberFormat(total)}
          </Text>
          <Text style={[styles.title, dynamicStyles.titleText]}>
            Presupuesto: {NumberFormat(totalBudget)}
          </Text>
          {!usingSpecificBudget && totalBudget > 0 && (
            <Text style={[styles.fallbackText, dynamicStyles.fallbackText]}>
              (usando presupuesto base)
            </Text>
          )}
        </View>

        {loading ? (
          <MyLoading />
        ) : (
          <ScrollView>
            {categories.map((category) => (
              <MyAcordeon
                key={category.id}
                data={category}
                editCategory={sendEditCategoryScreen}
                createSubcategory={sendCreateSubcategoryScreen}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cityIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  cityText: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 8
  },
  specificBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  specificBadgeText: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  selectorWrapper: {
    marginBottom: 12
  },
  title: {
    fontSize: BIG,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4
  },
  fallbackText: {
    fontSize: SMALL,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4
  },
  header: {
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 12,
    paddingVertical: 8
  }
});
