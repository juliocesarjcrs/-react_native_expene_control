import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Keyboard } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
import { RadioButton } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { CreateCategory, getCategories } from '~/services/categories';
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { screenConfigs } from '~/config/screenConfigs';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import ModalIcon from '~/components/modal/ModalIcon';
import FlatListItem from './components/FlatListItem';
import { CategoryModel, ExpenseStackParamList } from '~/shared/types';
import { CreateCategoryPayload } from '~/shared/types/services';

export type CreateCategoryScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'createCategory'>;

interface CreateCategoryScreenProps {
  navigation: CreateCategoryScreenNavigationProp;
}

type CreateCategoryFormData = {
  name: string;
};

type CategoryType = 0 | 1; // 0 = Gasto, 1 = Ingreso

export default function CreateCategoryScreen({ navigation }: CreateCategoryScreenProps) {
  const colors = useThemeColors();
  const [icon, setIcon] = useState<string>('home');
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [type, setType] = useState<CategoryType>(0);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<CreateCategoryFormData>({
    defaultValues: { name: '' }
  });

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async (): Promise<void> => {
    try {
      const params = { type };
      const { data } = await getCategories(params);
      setCategories(data);
    } catch (error) {
      showError(error);
    }
  };

  const onSubmit = async (payload: CreateCategoryFormData): Promise<void> => {
    try {
      const dataTransform: CreateCategoryPayload = { ...payload, icon, type };
      setLoading(true);
      const { data } = await CreateCategory(dataTransform);
      setLoading(false);

      const newCategories = [...categories, data];
      setCategories(newCategories);
      reset();
      Keyboard.dismiss();
      ShowToast('Categoría creada exitosamente');
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const updateList = (): void => {
    fetchData();
  };

  const handleIconChange = (val: string): void => {
    setIcon(val);
  };

  const handleTypeChange = (newValue: string): void => {
    setType(parseInt(newValue) as CategoryType);
  };

  const screenConfig = screenConfigs.createCategory;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <View style={styles.radioGroup}>
          <RadioButton.Group onValueChange={handleTypeChange} value={type.toString()}>
            <View style={styles.radioOption}>
              <Text style={[styles.radioLabel, { color: colors.TEXT_PRIMARY }]}>Tipo Gasto</Text>
              <RadioButton value="0" />
            </View>
            <View style={styles.radioOption}>
              <Text style={[styles.radioLabel, { color: colors.TEXT_PRIMARY }]}>Tipo Ingreso</Text>
              <RadioButton value="1" />
            </View>
          </RadioButton.Group>
        </View>

        <Controller
          name="name"
          control={control}
          rules={{
            required: {
              value: true,
              message: 'El nombre de la categoría es obligatorio'
            },
            maxLength: {
              value: 200,
              message: 'El nombre no puede superar 200 caracteres'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Categoría"
              value={value}
              placeholder="Ej: Vivienda"
              onChangeText={onChange}
              errorStyle={{ color: 'red' }}
              errorMessage={errors?.name?.message}
            />
          )}
        />

        <ModalIcon icon={icon} setIcon={handleIconChange} />

        {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(onSubmit)} title="Guardar" />}

        <FlatListItem data={categories} updateList={updateList} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  radioGroup: {
    marginVertical: 12
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  radioLabel: {
    fontSize: 16
  }
});
