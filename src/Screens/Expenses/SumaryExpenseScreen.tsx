import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Services
import { getAllSubcategoriesExpensesByMonth } from '~/services/categories';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyAcordeon from './components/MyAcordeon';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { RootState } from '~/shared/types/reducers';
import { CategoryExpense } from '~/shared/types/services';
import { ExpenseStackParamList } from '~/shared/types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';
import { BIG } from '~/styles/fonts';

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
      const { data } = await getAllSubcategoriesExpensesByMonth(month);
      setLoading(false);

      let tempTotalBudget = 0;
      const mapping: CategoryWithData[] = data.data.map((element) => {
        tempTotalBudget += element.budget;
        return { ...element, data: element.subcategories };
      });

      setTotalBudget(tempTotalBudget);
      setCategories(mapping);
      setTotal(data.total);
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

  const screenConfig = screenConfigs.sumary;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <View style={styles.fixToText}>
          <MyButton onPress={sendCreateExpenseScreen} title="Ingresar gasto" />
          <MyButton onPress={sendCreateCategoryScreen} title="Crear Categoría" />
        </View>

        <View style={[styles.header, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            Total gastos: {NumberFormat(total)}
          </Text>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            Presupuesto: {NumberFormat(totalBudget)}
          </Text>
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
  title: {
    fontSize: BIG,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4
  },
  header: {
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 12,
    paddingVertical: 8
  }
});
