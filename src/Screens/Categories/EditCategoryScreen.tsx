import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, View, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { RouteProp } from '@react-navigation/native';

// Services
import { EditCategory, getCategory } from '../../services/categories';

// Components
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import ModalIcon from '../../components/modal/ModalIcon';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';

// Types
import { CategoryModel, ExpenseStackParamList } from '~/shared/types';
import { EditCategoryPayload } from '~/shared/types/services';

// Utils
import { ShowToast } from '../../utils/toastUtils';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type EditCategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'editCategory'>;

interface EditCategoryScreenProps {
  route: EditCategoryScreenRouteProp;
}

export type CategoryFormData = Omit<CategoryModel, 'budget'> & { budget: number };

export default function EditCategoryScreen({ route }: EditCategoryScreenProps) {
  const screenConfig = screenConfigs.editCategory;
  const colors = useThemeColors();
  const idCategory = route.params.idCategory;

  const [category, setCategory] = useState<CategoryFormData | undefined>(undefined);
  const { handleSubmit, control, reset } = useForm<CategoryFormData>({
    mode: 'onTouched',
    defaultValues: category
  });
  const [icon, setIcon] = useState('home');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [reset]);

  const fetchData = async () => {
    try {
      const { data } = await getCategory(idCategory);
      const dataTransform: CategoryFormData = {
        ...data,
        budget: data.budget ?? 0
      };
      const editIcon = data.icon ? data.icon : 'home';
      setIcon(editIcon);
      setCategory(dataTransform);
      reset(dataTransform);
    } catch (e) {
      showError(e);
    }
  };

  const onSubmit = async (payload: CategoryFormData) => {
    console.log('[EditCategoryScreen] onSubmit payload:', payload);
    try {
      setLoading(true);
      const sendPayload: EditCategoryPayload = {
        ...payload,
        icon,
        budget: payload.budget
      };
      await EditCategory(idCategory, sendPayload);
      setLoading(false);
      Keyboard.dismiss();
      ShowToast('Categoría editada exitosamente');
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const setIconHandle = (val: string) => {
    setIcon(val);
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
      <StatusBar style="auto" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <MyInput
            name="name"
            control={control}
            label="Categoría"
            placeholder="Ej: Vivienda"
            rules={{
              required: 'El nombre de la categoría es obligatorio',
              maxLength: {
                value: 200,
                message: 'El nombre no puede superar 200 caracteres'
              }
            }}
            leftIcon="tag"
            maxLength={200}
            autoFocus
          />

          <MyInput
            name="budget"
            type="currency"
            control={control}
            label="Presupuesto"
            placeholder="0"
            rules={{
              min: { value: 0, message: 'El mínimo valor aceptado es 0' },
              max: {
                value: 99999999,
                message: 'El presupuesto no puede superar el valor de 99.999.999'
              }
            }}
            leftIcon="wallet"
          />

          <ModalIcon icon={icon} setIcon={setIconHandle} />

          {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(onSubmit)} title="Editar" />}
        </View>
      </ScrollView>
    </View>
  );
}
