import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';

// Services
import { getCategoryWithSubcategories } from '~/services/categories';
import { createBudgets, getBudgets } from '~/services/budgets';
import { getAverageBySubcategories } from '~/services/expenses';

// Components
import MyLoading from '~/components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import YearCitySelector from './components/YearCytySelector';

// Types
import { SettingsStackParamList } from '~/shared/types';
import { CategoryExpense, CreateBudgetPayload } from '~/shared/types/services';

// Utils
import { NumberFormat, formatNumberInput, parseFormattedNumber } from '~/utils/Helpers';
import { ShowToast } from '~/utils/toastUtils';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type VirtualBudgetScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'exportData'>;

interface VirtualBudgetScreenProps {
  navigation: VirtualBudgetScreenNavigationProp;
}

export default function VirtualBudgetScreen({ navigation }: VirtualBudgetScreenProps) {
  const config = screenConfigs.virtualBudget;
  const colors = useThemeColors();

  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryExpense[]>([]);
  const [budgetValues, setBudgetValues] = useState<CreateBudgetPayload[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCity, setSelectedCity] = useState<string>('Pereira');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [referenceYear, setReferenceYear] = useState<number>(new Date().getFullYear() - 1);
  const [loadingAverage, setLoadingAverage] = useState<boolean>(false);
  const [categoryAverages, setCategoryAverages] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  // Actualizar año de referencia cuando cambia el año seleccionado
  useEffect(() => {
    setReferenceYear(selectedYear - 1);
  }, [selectedYear]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories();
      setCategories(data.data);
      await fetchGetBudgets();
      await fetchCurrentYearAverages(); // Cargar promedios del año en curso
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const fetchGetBudgets = async (): Promise<void> => {
    try {
      const query = { year: selectedYear, city: selectedCity };
      const { data } = await getBudgets(query);
      setBudgetValues(data.data);
    } catch (error) {
      showError(error);
    }
  };

  const handleBudgetChange = (
    categoryId: number,
    subcategoryId: number | null,
    text: string
  ): void => {
    const value = parseFormattedNumber(text);
    const updatedBudgets = [...budgetValues];
    const existingBudgetIndex = updatedBudgets.findIndex(
      (budget) => budget.categoryId === categoryId && budget.subcategoryId === subcategoryId
    );

    if (existingBudgetIndex !== -1) {
      updatedBudgets[existingBudgetIndex].budget = value;
    } else {
      updatedBudgets.push({
        budget: value,
        year: selectedYear,
        city: selectedCity,
        categoryId,
        subcategoryId
      });
    }

    setBudgetValues(updatedBudgets);
    setHasUnsavedChanges(true); // Marcar cambios pendientes
  };

  const calculateTotal = (): string => {
    const total = budgetValues.reduce((acc, budget) => acc + budget.budget, 0);
    return NumberFormat(total);
  };

  const calculateCategoryTotal = (categoryId: number): number => {
    return budgetValues
      .filter((budget) => budget.categoryId === categoryId)
      .reduce((acc, budget) => acc + budget.budget, 0);
  };

  const handleSaveBudget = async (): Promise<void> => {
    try {
      setLoading(true);
      await createBudgets(budgetValues);
      await fetchGetBudgets();
      setLoading(false);
      setHasUnsavedChanges(false); // Quitar marca de cambios pendientes
      ShowToast('Presupuesto guardado exitosamente');
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const handleAutoComplete = (): void => {
    Alert.alert(
      'Auto-completar desde Gastos',
      `¿Calcular el presupuesto basado en el promedio de gastos del año ${referenceYear}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cambiar año',
          onPress: () => showYearPicker()
        },
        {
          text: 'Continuar',
          onPress: () => fetchAverageAndFill(referenceYear),
          style: 'default'
        }
      ]
    );
  };

  const showYearPicker = (): void => {
    // Generar últimos 5 años
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    
    const yearOptions = years.map((year) => ({
      text: year.toString(),
      onPress: () => fetchAverageAndFill(year)
    }));

    Alert.alert(
      'Seleccionar Año de Referencia',
      'Elige el año del cual calcular los promedios:',
      [
        ...yearOptions,
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const fetchAverageAndFill = async (year: number): Promise<void> => {
    try {
      setLoadingAverage(true);
      const { data } = await getAverageBySubcategories({
        year: selectedYear,
        referenceYear: year
      });

      // Crear nuevos valores de presupuesto basados en los promedios
      const newBudgetValues: CreateBudgetPayload[] = [];

      data.data.forEach((category) => {
        category.subcategories.forEach((subcategory) => {
          if (subcategory.averageMonthly > 0) {
            newBudgetValues.push({
              budget: subcategory.averageMonthly,
              year: selectedYear,
              city: selectedCity,
              categoryId: category.categoryId,
              subcategoryId: subcategory.subcategoryId
            });
          }
        });
      });

      setBudgetValues(newBudgetValues);
      setHasUnsavedChanges(true);
      setReferenceYear(year);
      setLoadingAverage(false);
      ShowToast(`Presupuesto calculado desde año ${year}`);
    } catch (error) {
      setLoadingAverage(false);
      showError(error);
    }
  };

  const fetchCurrentYearAverages = async (): Promise<void> => {
    try {
      const currentYear = new Date().getFullYear();
      const { data } = await getAverageBySubcategories({
        year: currentYear,
        referenceYear: currentYear
      });

      // Crear mapa de promedios por categoría
      const averagesMap = new Map<number, number>();
      data.data.forEach((category) => {
        averagesMap.set(category.categoryId, category.averageMonthly);
      });

      setCategoryAverages(averagesMap);
    } catch (error) {
      // Silencioso - no mostrar error si falla la carga de promedios
      console.error('Error loading current year averages:', error);
    }
  };

  const getBudgetValue = (categoryId: number, subcategoryId: number | null): string => {
    const budget = budgetValues.find(
      (b) => b.categoryId === categoryId && b.subcategoryId === subcategoryId
    );
    return budget && budget.budget > 0 ? formatNumberInput(budget.budget) : '';
  };

  const toggleCategory = (categoryId: number): void => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <YearCitySelector
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            onConsult={fetchData}
          />

          <View style={styles.actionButtons}>
            <View style={styles.buttonRow}>
              <View style={{ flex: 1, marginRight: 4 }}>
                <MyButton 
                  title="Consultar" 
                  onPress={fetchData} 
                  variant="secondary"
                  size="small"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <MyButton
                  title="Auto-completar"
                  onPress={handleAutoComplete}
                  variant="outline"
                  icon={<Icon type="material-community" name="calculator" size={16} color={colors.PRIMARY} />}
                  disabled={loadingAverage}
                  loading={loadingAverage}
                  size="small"
                />
              </View>
            </View>
            <View style={{ position: 'relative', marginTop: 8 }}>
              <MyButton 
                title="Guardar Presupuesto" 
                onPress={handleSaveBudget} 
                variant="primary"
                fullWidth
              />
              {hasUnsavedChanges && (
                <View style={[styles.unsavedBadge, { backgroundColor: colors.WARNING }]}>
                  <Text style={styles.unsavedText}>●</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.totalCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>
              Presupuesto total:
            </Text>
            <Text style={[styles.totalAmount, { color: colors.PRIMARY }]}>{calculateTotal()}</Text>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <MyLoading />
            ) : (
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <CategoryBudgetCard
                    key={category.id}
                    category={category}
                    expanded={expandedCategories.includes(category.id)}
                    onToggle={toggleCategory}
                    categoryTotal={calculateCategoryTotal(category.id)}
                    currentYearAverage={categoryAverages.get(category.id) || 0}
                    getBudgetValue={getBudgetValue}
                    onBudgetChange={handleBudgetChange}
                    colors={colors}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10
  },
  actionButtons: {
    marginVertical: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  totalLabel: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  totalAmount: {
    fontSize: MEDIUM + 2,
    fontWeight: 'bold'
  },
  categoriesContainer: {
    marginTop: 8
  },
  unsavedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2
  },
  unsavedText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold'
  }
});

// ====================================
// COMPONENTE: CategoryBudgetCard
// ====================================

interface CategoryBudgetCardProps {
  category: CategoryExpense;
  expanded: boolean;
  onToggle: (id: number) => void;
  categoryTotal: number;
  currentYearAverage: number;
  getBudgetValue: (categoryId: number, subcategoryId: number | null) => string;
  onBudgetChange: (categoryId: number, subcategoryId: number | null, text: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}

const CategoryBudgetCard = ({
  category,
  expanded,
  onToggle,
  categoryTotal,
  currentYearAverage,
  getBudgetValue,
  onBudgetChange,
  colors
}: CategoryBudgetCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleInfoPress = (): void => {
    Alert.alert(
      `Promedio ${category.name}`,
      `Promedio mensual del año ${currentYear}:\n${NumberFormat(currentYearAverage)}\n\nEste promedio se calcula solo con los meses que tienen gastos registrados.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  return (
    <View style={[cardStyles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <TouchableOpacity
        style={cardStyles.header}
        onPress={() => onToggle(category.id)}
        activeOpacity={0.7}
      >
        <View style={cardStyles.headerLeft}>
          <Icon
            type="font-awesome"
            name={category.icon || 'home'}
            size={20}
            color={colors.PRIMARY}
            containerStyle={cardStyles.icon}
          />
          
          <View style={cardStyles.nameAndInfoContainer}>
            <Text 
              style={[cardStyles.categoryName, { color: colors.TEXT_PRIMARY }]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            
            {/* Ícono de info para mostrar promedio actual */}
            {currentYearAverage > 0 && (
              <TouchableOpacity
                onPress={handleInfoPress}
                style={cardStyles.infoButton}
                activeOpacity={0.7}
              >
                <Icon
                  type="material-community"
                  name="information-outline"
                  size={18}
                  color={colors.INFO}
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={[cardStyles.badge, { backgroundColor: colors.INFO + '20' }]}>
            <Text style={[cardStyles.badgeText, { color: colors.INFO }]}>
              {category.subcategories.length}
            </Text>
          </View>
        </View>

        <View style={cardStyles.headerRight}>
          <View style={cardStyles.totalContainer}>
            <Text style={[cardStyles.totalLabel, { color: colors.TEXT_SECONDARY }]}>Total:</Text>
            <Text style={[cardStyles.totalValue, { color: colors.SUCCESS }]}>
              {NumberFormat(categoryTotal)}
            </Text>
          </View>
          <Icon
            type="material-community"
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.TEXT_SECONDARY}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={cardStyles.content}>
          {category.subcategories.map((subcategory) => (
            <SubcategoryBudgetInput
              key={subcategory.id}
              subcategory={subcategory}
              categoryId={category.id}
              value={getBudgetValue(category.id, subcategory.id)}
              onChange={onBudgetChange}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  icon: {
    marginRight: 12
  },
  nameAndInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  categoryName: {
    fontSize: MEDIUM,
    fontWeight: '600',
    flexShrink: 1
  },
  infoButton: {
    marginLeft: 6,
    padding: 2,
    flexShrink: 0
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexShrink: 0
  },
  badgeText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginRight: 8
  },
  totalLabel: {
    fontSize: SMALL
  },
  totalValue: {
    fontSize: SMALL + 1,
    fontWeight: 'bold'
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12
  }
});

// ====================================
// COMPONENTE: SubcategoryBudgetInput
// ====================================

interface SubcategoryBudgetInputProps {
  subcategory: { id: number; name: string };
  categoryId: number;
  value: string;
  onChange: (categoryId: number, subcategoryId: number, text: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}

const SubcategoryBudgetInput = ({
  subcategory,
  categoryId,
  value,
  onChange,
  colors
}: SubcategoryBudgetInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={inputStyles.container}>
      <View style={inputStyles.labelContainer}>
        <Icon
          type="material-community"
          name="label-outline"
          size={16}
          color={colors.TEXT_SECONDARY}
          containerStyle={{ marginRight: 6 }}
        />
        <Text style={[inputStyles.label, { color: colors.TEXT_PRIMARY }]}>{subcategory.name}</Text>
      </View>
      <TextInput
        style={[
          inputStyles.input,
          {
            backgroundColor: colors.BACKGROUND,
            color: colors.TEXT_PRIMARY,
            borderColor: isFocused ? colors.PRIMARY : colors.BORDER
          }
        ]}
        placeholder="0"
        placeholderTextColor={colors.TEXT_SECONDARY}
        keyboardType="numeric"
        value={value}
        onChangeText={(text) => onChange(categoryId, subcategory.id, text)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const inputStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 12
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  label: {
    fontSize: SMALL + 1
  },
  input: {
    width: 120,
    height: 42,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: SMALL + 1,
    fontWeight: '600'
  }
});