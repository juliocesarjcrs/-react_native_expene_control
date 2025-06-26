import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
import { RouteProp } from '@react-navigation/native';

// Services
import { EditCategory, getCategory } from '../../services/categories';

// Components
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import ModalIcon from '../../components/modal/ModalIcon';

// Types
import { CategoryModel, ExpenseStackParamList } from '~/shared/types';
import { EditCategoryPayload } from '~/shared/types/services';

// Utils
import { Errors } from '../../utils/Errors';
import ShowToast from '../../utils/toastUtils';

type EditCategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'editCategory'>;

interface EditCategoryScreenProps {
  route: EditCategoryScreenRouteProp;
}
export type CategoryFormData = Omit<CategoryModel, 'budget'> & { budget: string };

export default function EditCategoryScreen({ route }: EditCategoryScreenProps) {
  const idCategory = route.params.idCategory;

  const [category, setCategory] = useState<CategoryFormData | undefined>(undefined);
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm<CategoryFormData>({
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
      const dataTransfor = {
        ...data,
        budget: data.budget !== null && data.budget !== undefined ? data.budget.toString() : ''
      };
      const editIcon = data.icon ? data.icon : 'home';
      setIcon(editIcon);
      setCategory(dataTransfor);
      reset(dataTransfor);
    } catch (e) {
      Errors(e);
    }
  };

  const onSubmit = async (payload: CategoryFormData) => {
    console.log('[EditCategoryScreen] onSubmit payload:', payload);
    try {
      setLoading(true);
      const sendPayload: EditCategoryPayload = { ...payload, icon, budget: parseInt(payload.budget) };
      await EditCategory(idCategory, sendPayload);
      setLoading(false);
      Keyboard.dismiss();
      ShowToast();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const setIconHandle = (val: string) => {
    setIcon(val);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Controller
        name="name"
        control={control}
        rules={{
          required: {
            value: true,
            message: 'El nombre de la categoria es obligatorio'
          },
          maxLength: {
            value: 200,
            message: 'El nombre no puede superar 200 caracteres'
          }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Categoria"
            value={value}
            placeholder="Nombre de la categoria"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: 'red' }}
            errorMessage={typeof errors?.name?.message === 'string' ? errors.name.message : undefined}
          />
        )}
        defaultValue=""
      />
      <Controller
        name="budget"
        control={control}
        rules={{
          min: { value: 0, message: 'El minimó valor aceptado es 1' },
          max: {
            value: 99999999,
            message: 'El presupuesto no puede superar el valor de 99.999.999 '
          }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Presupuesto"
            value={value}
            placeholder="Ej: 200000"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: 'red' }}
            errorMessage={typeof errors?.budget?.message === 'string' ? errors.budget.message : undefined}
            keyboardType="numeric"
          />
        )}
        defaultValue=""
      />
      <ModalIcon icon={icon} setIcon={setIconHandle} />
      {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(onSubmit)} title="Editar" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
