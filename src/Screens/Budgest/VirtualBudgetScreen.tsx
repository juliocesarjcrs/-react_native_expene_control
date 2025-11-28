import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, TouchableWithoutFeedback } from 'react-native';

import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getCategoryWithSubcategories } from '../../services/categories';
import { createBudgets, getBudgets } from '../../services/budgets';

// Components
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { SettingsStackParamList } from '../../shared/types';
import { Category, CreateBudgetPayload } from '../../shared/types/services';

// Utils
import { NumberFormat } from '../../utils/Helpers';
import {ShowToast} from '../../utils/toastUtils';
import YearCitySelector from './components/YearCytySelector';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type VirtualBudgetScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'exportData'>;

interface VirtualBudgetScreenProps {
  navigation: VirtualBudgetScreenNavigationProp;
}

export default function VirtualBudgetScreen({ navigation }: VirtualBudgetScreenProps) {
   const config = screenConfigs.virtualBudget;
    const colors = useThemeColors();
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetValues, setBudgetValues] = useState<CreateBudgetPayload[]>([]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedCity, setSelectedCity] = useState('Pereira');

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, []);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories();
      setLoading(false);
      setCategories(data.data);
      fetchGetBudgets();
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };

  const fetchGetBudgets = async () => {
    try {
      setLoading(true);
      const query = {
        year: selectedYear,
        city: selectedCity
      };
      const { data } = await getBudgets(query);
      // console.log('Budget', data.data)
      setLoading(false);
      setBudgetValues(data.data);
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };

  const handleBudgetChange = (categoryId: number, subcategoryId: number | null, text: string) => {
    const value = text !== '' ? parseFloat(text) : 0; // Tratar la cadena vacía como 0 o ajustar según tus necesidades
    const updatedBudgets = [...budgetValues];
    const existingBudgetIndex = updatedBudgets.findIndex(
      (budget) => budget.categoryId === categoryId && budget.subcategoryId === subcategoryId
    );
    if (existingBudgetIndex !== -1) {
      // Si ya existe un presupuesto para esta categoría y subcategoría, actualiza su valor
      updatedBudgets[existingBudgetIndex].budget = value;
      console.log(':::Existe entonces actualiza:::', updatedBudgets)
    } else {
      console.log(':::NO Existe entonces NUEVO:::', value)
      // Si no existe, agrega un nuevo presupuesto
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

  const calculateTotal = () => {
    let total = 0;
    for (const budget of budgetValues) {
      total += budget.budget;
    }
    return NumberFormat(total);
  };

  const handleSaveBudget = async () => {
    await fetchSaveBudget();
    await fetchGetBudgets();
  };

  const fetchSaveBudget = async () => {
    try {
      setLoading(true);
      await createBudgets(budgetValues);
      setLoading(false);
      ShowToast('Presupuesto guardado');
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };

  const getBudgetValue = (categoryId: number, subcategoryId: number | null) => {
    const budget = budgetValues.find(
      (budget) => budget.categoryId === categoryId && budget.subcategoryId === subcategoryId
    );
    return budget ? budget.budget.toString() : '';
  };

  const SubcategoryTotal = ({ categoryId }: { categoryId: number }) => {
    const categoryBudgets = budgetValues.filter((budget) => budget.categoryId === categoryId);

    const total = categoryBudgets.reduce((acc, budget) => acc + budget.budget, 0);

    return <Text style={styles.subcategoryTotalText}>Total: {NumberFormat(total)}</Text>;
  };

  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prevExpanded) => {
      if (prevExpanded.includes(categoryId)) {
        // Si la categoría está expandida, la ocultamos
        return prevExpanded.filter((id) => id !== categoryId);
      } else {
        // Si la categoría no está expandida, la mostramos
        return [...prevExpanded, categoryId];
      }
    });
  };

  return (
   <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
        <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <YearCitySelector
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
      <View style={styles.buttons}>
        <MyButton title="Consultar" onPress={fetchData} variant="secondary" />
        <MyButton title="Guardar" onPress={handleSaveBudget} variant="primary" />
      </View>
      <Text style={styles.totalText}>Total presupuesto: {calculateTotal()}</Text>
      {loading ? (
        <MyLoading />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryContainer}>
              <TouchableWithoutFeedback onPress={() => toggleCategory(category.id)}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryText}>{category.name}</Text>
                  <SubcategoryTotal categoryId={category.id} />
                </View>
              </TouchableWithoutFeedback>
              {expandedCategories.includes(category.id) && (
                <View style={styles.categoryContent}>
                  {category.subcategories.map((subcategory) => (
                    <View key={subcategory.id} style={styles.subcategoryContainer}>
                      <Text style={styles.subcategoryText}>{subcategory.name}</Text>
                      <TextInput
                        style={styles.inputSubcategory}
                        placeholder="Ingrese presupuesto"
                        keyboardType="numeric"
                        value={getBudgetValue(category.id, subcategory.id)}
                        onChangeText={(text) => handleBudgetChange(category.id, subcategory.id, text)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  categoryContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  subcategoryContainer: {
    marginLeft: 20,
    marginBottom: 5
    //backgroundColor: 'pink'
  },
  subcategoryText: {
    fontSize: 16
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10
  },
  inputSubcategory: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 2,
    paddingLeft: 10
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20
  },
  subcategoryTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    //marginTop: 5,
    color: 'green' // Puedes ajustar el color según tus preferencias
  },
  // acordeon
  categoryContent: {
    padding: 10
  },
  categoryHeader: {
    padding: 2
  },
  // buttons
  buttons: {
    flexDirection: 'row',
    marginTop: 15
  }
});
