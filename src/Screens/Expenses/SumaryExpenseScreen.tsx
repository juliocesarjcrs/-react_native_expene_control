import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';

// Services
import { getAllSubcategoriesExpensesByMonth } from '~/services/categories';
import { getBudgetSummary, detectCurrentCity } from '~/services/budgets';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyAcordeon from './components/MyAcordeon';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import YearCitySelector from '../Budgest/components/YearCytySelector';

// Types
import { RootState } from '~/shared/types/reducers';
import { CategoryExpense } from '~/shared/types/services';
import { ExpenseStackParamList } from '~/shared/types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';
import { BIG, SMALL } from '~/styles/fonts';

// Styles
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

export default function SumaryExpenseScreen({ navigation }: SumaryExpenseScreenProps) {
  const colors = useThemeColors();
  const month = useSelector((state: RootState) => state.date.month);

  const [categories, setCategories] = useState<CategoryWithData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCity, setSelectedCity] = useState<string>('Pereira');
  const [usingSpecificBudget, setUsingSpecificBudget] = useState<boolean>(false);
  const [showCitySelector, setShowCitySelector] = useState<boolean>(false);

  useEffect(() => {
    detectAndFetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      detectAndFetchData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Cuando cambia año o ciudad manualmente, recargar datos
    if (showCitySelector) {
      fetchData();
    }
  }, [selectedYear, selectedCity]);

  useEffect(() => {
    // Cuando cambia año o ciudad manualmente, recargar datos
    if (showCitySelector) {
      fetchData();
    }
  }, [selectedYear, selectedCity]);

  const detectAndFetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();

      // Intentar detectar ciudad automáticamente
      const { data: cityData } = await detectCurrentCity({ year: currentYear });

      if (cityData.detected && cityData.city) {
        setSelectedYear(currentYear);
        setSelectedCity(cityData.city);
      }

      await fetchData();
    } catch (error) {
      // Si falla la detección, continuar con valores por defecto
      await fetchData();
    }
  };

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);

      // Cargar gastos del mes
      const { data: expensesData } = await getAllSubcategoriesExpensesByMonth(month);

      // Intentar cargar presupuestos específicos de ciudad/año
      let budgetSummary;
      try {
        const { data: budgetData } = await getBudgetSummary({
          year: selectedYear,
          city: selectedCity
        });
        budgetSummary = budgetData;
      } catch (error) {
        // Si no hay presupuestos específicos, usar null
        budgetSummary = { data: [], hasData: false };
      }

      let tempTotalBudget = 0;
      const mapping: CategoryWithData[] = expensesData.data.map((element) => {
        // Buscar presupuesto específico para esta categoría
        const specificBudget = budgetSummary.data.find((b) => b.categoryId === element.id);

        // Usar presupuesto específico si existe, sino usar el de categories
        const budgetToUse = specificBudget ? specificBudget.budget : element.budget;
        tempTotalBudget += budgetToUse;

        return {
          ...element,
          budget: budgetToUse,
          data: element.subcategories
        };
      });

      setUsingSpecificBudget(budgetSummary.hasData);
      setTotalBudget(tempTotalBudget);
      setCategories(mapping);
      setTotal(expensesData.total);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
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
    setShowCitySelector(!showCitySelector);
  };

  const screenConfig = screenConfigs.sumary;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <View style={styles.fixToText}>
          <MyButton onPress={sendCreateExpenseScreen} title="Ingresar gasto" />
          <MyButton onPress={sendCreateCategoryScreen} title="Crear Categoría" />
        </View>

        {/* Indicador de ciudad/año con opción de cambiar */}
        <View style={[styles.cityIndicator, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <View style={styles.cityInfo}>
            <Icon
              type="material-community"
              name="map-marker"
              size={18}
              color={usingSpecificBudget ? colors.SUCCESS : colors.TEXT_SECONDARY}
            />
            <Text style={[styles.cityText, { color: colors.TEXT_PRIMARY }]}>
              {selectedCity} - {selectedYear}
            </Text>
            {usingSpecificBudget && (
              <View style={[styles.specificBadge, { backgroundColor: colors.SUCCESS + '20' }]}>
                <Text style={[styles.specificBadgeText, { color: colors.SUCCESS }]}>
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
          <View style={{ marginBottom: 12 }}>
            <YearCitySelector
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              onConsult={fetchData}
            />
          </View>
        )}

        <View style={[styles.header, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            Total gastos: {NumberFormat(total)}
          </Text>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            Presupuesto: {NumberFormat(totalBudget)}
          </Text>
          {!usingSpecificBudget && totalBudget > 0 && (
            <Text style={[styles.fallbackText, { color: colors.TEXT_SECONDARY }]}>
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
    shadowColor: '#000',
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
