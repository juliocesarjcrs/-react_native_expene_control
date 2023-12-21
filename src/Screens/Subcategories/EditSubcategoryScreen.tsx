import React, { useState } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { Input } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Services
import { EditSubcategory } from '../../services/subcategories';

// Components
import MyLoading from '../../components/loading/MyLoading';
import ShowToast from '../../components/toast/ShowToast';
import MyButton from '../../components/MyButton';

// Types
import { ExpenseStackParamList } from '../../shared/types';

// Utils
import { Errors } from '../../utils/Errors';

// Styles
import { MEDIUM } from '../../styles/fonts';
import { EditSubcategoryPayload } from '../../shared/types/services/subcategories-services.type';

type EditSubcategoryScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'editSubcategory'>;
type EditSubcategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'editSubcategory'>;

interface EditSubcategoryScreenProps {
  navigation: EditSubcategoryScreenNavigationProp;
  route: EditSubcategoryScreenRouteProp;
}
export default function EditSubcategoryScreen({ route, navigation }: EditSubcategoryScreenProps) {
  const subcategoryObj = route.params.subcategoryObject;
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm({
    defaultValues: { name: subcategoryObj.name }
  });
  const [loading, setLoading] = useState(false);

  const editApi = async (payload: EditSubcategoryPayload) => {
    try {
      const idCategory = subcategoryObj.category.id;
      setLoading(true);

      const { data } = await EditSubcategory(subcategoryObj.id, {
        ...payload,
        categoryId: idCategory
      });
      setLoading(false);
      ShowToast();
      Keyboard.dismiss();
      reset();
      navigation.navigate('createSubcategory', { idCategory });
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  return (
    <View style={styles.container}>
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
      {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(editApi)} title="Editar" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  item: {
    padding: 10,
    fontSize: MEDIUM,
    height: 44
  }
});
