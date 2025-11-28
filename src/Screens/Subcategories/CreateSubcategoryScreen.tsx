import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
// import {  Inputs } from "~/styles";
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';


import { Keyboard } from 'react-native';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Services
import { CreateSubcategory, getSubategoriesByCategory } from '../../services/subcategories';

// Components
import MyLoading from '../../components/loading/MyLoading';
import FlatListItem from './components/FlatListItem';
import MyButton from '../../components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { ExpenseStackParamList } from '../../shared/types';
import {
  CreateSubcategoryPayload,
  SubcategoriesWithExpenses
} from '../../shared/types/services/subcategories-services.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type CreateSubcategoryScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'createSubcategory'>;
type CreateSubcategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'createSubcategory'>;

interface CreateSubcategoryScreenProps {
  navigation: CreateSubcategoryScreenNavigationProp;
  route: CreateSubcategoryScreenRouteProp;
}

export default function CreateSubcategoryScreen({ route, navigation }: CreateSubcategoryScreenProps) {
  const screenConfig = screenConfigs.createSubcategory;
  const colors = useThemeColors();
  const idCategory = route.params.idCategory;
  const [subcategories, setSubcategories] = useState<SubcategoriesWithExpenses[] | []>([]);
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm({
    defaultValues: { name: '' }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      if (!idCategory) {
        return;
      }
      const { data } = await getSubategoriesByCategory(idCategory);
      setSubcategories(data as SubcategoriesWithExpenses[]);
    } catch (error) {
      showError(error);
    }
  };
  const create = async (payload: CreateSubcategoryPayload) => {
    try {
      setLoading(true);
      const { data } = await CreateSubcategory({
        ...payload,
        categoryId: idCategory
      });
      setLoading(false);
      const newSubcategories = [...subcategories, data];
      setSubcategories(newSubcategories);
      Keyboard.dismiss();
      reset();
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };
  const updateList = () => {
    fetchData();
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <Controller
        name="name"
        control={control}
        rules={{
          required: {
            value: true,
            message: 'El nombre de la subcategoria es obligatorio'
          },
          maxLength: {
            value: 200,
            message: 'El nombre no puede superar 200 caracteres'
          }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Subcategoria"
            value={value}
            placeholder="Ej: Recibo de agua"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: 'red' }}
            errorMessage={errors?.name?.message}
          />
        )}
        defaultValue=""
      />
      {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(create)} title="Guardar" />}
      <FlatListItem data={subcategories} updateList={updateList} navigation={navigation} />
    </View>
  );
}
