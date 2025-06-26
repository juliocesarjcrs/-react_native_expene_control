import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { FAB } from 'react-native-elements';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getCategoryTypeIncome } from '../../services/categories';

// Components
import MyAcordeonIncome from './components/MyAcordeonIncome';
import MyLoading from '~/components/loading/MyLoading';
import CardLastIncomes, { CardLastIncomesNavigationProp } from '../Main/components/CardLastIncomes';

// Types
import { RootState } from '~/shared/types/reducers';
import { CategoryIncomesSumary } from '~/shared/types/services';
import { IncomeStackParamList } from '~/shared/types';

// Utils
import { DateFormat, NumberFormat } from '../../utils/Helpers';
import { Errors } from '../../utils/Errors';

// Styles
import { BIG } from '../../styles/fonts';

export type SumaryIncomesScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'sumaryIncomes'>;
type SumaryIncomesScreenRouteProp = RouteProp<IncomeStackParamList, 'sumaryIncomes'>;

interface SumaryIncomesScreenProps {
  navigation: SumaryIncomesScreenNavigationProp;
  route: SumaryIncomesScreenRouteProp;
}

export default function SumaryIncomesScreen({ navigation }: SumaryIncomesScreenProps) {
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<CategoryIncomesSumary[]>([]);
  const [loading, setLoading] = useState(false);
  const month = useSelector((state: RootState) => state.date.month);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [month]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryTypeIncome(month);
      setLoading(false);
      setTotal(data.total);
      setCategories(data.data);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const sendEditCategoryScreen = (id: number) => {
    navigation.navigate('editCategory', { idCategory: id });
  };
  const sendAddIncomeScrenn = () => {
    navigation.navigate('createIncome');
  };
  const sendCreteCategoryScrenn = () => {
    navigation.navigate('createCategory');
  };
  const updateList = () => {
    fetchData();
  };

  return (
    <View style={styles.container}>
      <FAB title="Agregar ingreso" onPress={sendAddIncomeScrenn} />
      <Text
        style={{
          fontSize: BIG,
          fontWeight: 'bold',
          textAlign: 'center',
          marginVertical: 5
        }}
      >
        Total Ingresos mes {DateFormat(month, 'MMMM')}: {NumberFormat(total)}
      </Text>
      {loading ? (
        <MyLoading />
      ) : (
        <ScrollView style={{ marginTop: 20 }}>
          {categories.map((e) => (
            <MyAcordeonIncome key={e.id} data={e} editCategory={sendEditCategoryScreen} updateList={updateList} />
          ))}
        </ScrollView>
      )}
      <ScrollView>
        <FAB title="Nueva categoría" onPress={sendCreteCategoryScrenn} />
        <CardLastIncomes navigation={navigation as CardLastIncomesNavigationProp} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom: 15
  }
});
