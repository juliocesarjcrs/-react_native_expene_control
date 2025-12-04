import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';

// Services
import { getCategoryWithSubcategories } from '~/services/categories';
import { createBudgets, getBudgets } from '~/services/budgets';

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
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedCity, setSelectedCity] = useState<string>('Pereira');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories();
      setCategories(data.data);
      await fetchGetBudgets();
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
      ShowToast('Presupuesto guardado exitosamente');
    } catch (error) {
      setLoading(false);
      showError(error);
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
            <MyButton title="Consultar" onPress={fetchData} variant="secondary" />
            <MyButton title="Guardar" onPress={handleSaveBudget} variant="primary" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12
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
  getBudgetValue: (categoryId: number, subcategoryId: number | null) => string;
  onBudgetChange: (categoryId: number, subcategoryId: number | null, text: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}

const CategoryBudgetCard = ({
  category,
  expanded,
  onToggle,
  categoryTotal,
  getBudgetValue,
  onBudgetChange,
  colors
}: CategoryBudgetCardProps) => {
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
          <Text style={[cardStyles.categoryName, { color: colors.TEXT_PRIMARY }]}>
            {category.name}
          </Text>
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
    flex: 1
  },
  icon: {
    marginRight: 12
  },
  categoryName: {
    fontSize: MEDIUM,
    fontWeight: '600',
    flex: 1
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8
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
