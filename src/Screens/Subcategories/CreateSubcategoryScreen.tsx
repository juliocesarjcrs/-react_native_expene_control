import React, { useEffect, useState } from 'react';
import { View, Keyboard } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Services
import { CreateSubcategory, getSubategoriesByCategory } from '~/services/subcategories';

// Components
import MyLoading from '~/components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import SubcategoryList from './components/SubcategoryList';
import MyInput from '~/components/inputs/MyInput';

// Types
import { ExpenseStackParamList } from '~/shared/types';
import { SubcategoriesWithExpenses } from '~/shared/types/services/subcategories-services.type';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type CreateSubcategoryScreenNavigationProp = StackNavigationProp<
  ExpenseStackParamList,
  'createSubcategory'
>;
type CreateSubcategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'createSubcategory'>;

interface CreateSubcategoryScreenProps {
  navigation: CreateSubcategoryScreenNavigationProp;
  route: CreateSubcategoryScreenRouteProp;
}

type FormData = {
  name: string;
};

export default function CreateSubcategoryScreen({
  route,
  navigation
}: CreateSubcategoryScreenProps) {
  const screenConfig = screenConfigs.createSubcategory;
  const colors = useThemeColors();
  const idCategory = route.params.idCategory;

  const [subcategories, setSubcategories] = useState<SubcategoriesWithExpenses[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { handleSubmit, control, reset } = useForm<FormData>({
    defaultValues: { name: '' }
  });

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async (): Promise<void> => {
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

  const create = async (payload: FormData): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await CreateSubcategory({
        ...payload,
        categoryId: idCategory
      });
      setLoading(false);

      const newSubcategories = [...subcategories, data];
      setSubcategories(newSubcategories);
      ShowToast('Subcategoría creada exitosamente');
      Keyboard.dismiss();
      reset();
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const updateList = (): void => {
    fetchData();
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <MyInput
          name="name"
          control={control}
          label="Nombre de la subcategoría"
          placeholder="Ej: Recibo de agua"
          rules={{
            required: {
              value: true,
              message: 'El nombre de la subcategoría es obligatorio'
            },
            minLength: {
              value: 2,
              message: 'El nombre debe tener al menos 2 caracteres'
            },
            maxLength: {
              value: 200,
              message: 'El nombre no puede superar 200 caracteres'
            }
          }}
          leftIcon="tag"
          maxLength={200}
          autoFocus
        />

        {loading ? (
          <MyLoading />
        ) : (
          <MyButton onPress={handleSubmit(create)} title="Crear subcategoría" />
        )}

        <SubcategoryList data={subcategories} updateList={updateList} navigation={navigation} />
      </View>
    </View>
  );
}
