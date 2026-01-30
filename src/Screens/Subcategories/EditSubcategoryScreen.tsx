import React, { useState } from 'react';
import { View, Keyboard } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Services
import { EditSubcategory } from '../../services/subcategories';

// Components
import MyLoading from '../../components/loading/MyLoading';
import { ShowToast } from '../../utils/toastUtils';
import MyButton from '../../components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';

// Types
import { ExpenseStackParamList } from '../../shared/types';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { EditSubcategoryPayload } from '../../shared/types/services/subcategories-services.type';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type EditSubcategoryScreenNavigationProp = StackNavigationProp<
  ExpenseStackParamList,
  'editSubcategory'
>;
type EditSubcategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'editSubcategory'>;

interface EditSubcategoryScreenProps {
  navigation: EditSubcategoryScreenNavigationProp;
  route: EditSubcategoryScreenRouteProp;
}
export default function EditSubcategoryScreen({ route, navigation }: EditSubcategoryScreenProps) {
  const screenConfig = screenConfigs.editSubcategory;
  const colors = useThemeColors();
  const subcategoryObj = route.params.subcategoryObject;
  const { handleSubmit, control, reset } = useForm({
    defaultValues: { name: subcategoryObj.name }
  });
  const [loading, setLoading] = useState(false);

  const editApi = async (payload: EditSubcategoryPayload) => {
    try {
      const idCategory = subcategoryObj.category.id;
      setLoading(true);

      await EditSubcategory(subcategoryObj.id, {
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
      showError(error);
    }
  };
  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

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
      {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(editApi)} title="Editar" />}
    </View>
  );
}
