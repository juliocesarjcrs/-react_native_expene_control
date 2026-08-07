import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, View, ScrollView, Text, StyleSheet, Switch } from 'react-native';
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
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type EditCategoryScreenRouteProp = RouteProp<ExpenseStackParamList, 'editCategory'>;

interface EditCategoryScreenProps {
  route: EditCategoryScreenRouteProp;
}

// Solo los campos realmente controlados por react-hook-form.
// Mantenerlo angosto evita el choque de tipos con Control<any> de MyInput.
type EditCategoryFormValues = {
  name: string;
  budget: number;
};

export default function EditCategoryScreen({ route }: EditCategoryScreenProps) {
  const screenConfig = screenConfigs.editCategory;
  const colors = useThemeColors();
  const idCategory = route.params.idCategory;

  const [category, setCategory] = useState<CategoryModel | undefined>(undefined);
  const { handleSubmit, control, reset } = useForm<EditCategoryFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', budget: 0 }
  });
  const [icon, setIcon] = useState<string>('home');
  const [isOperational, setIsOperational] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    const loadCategory = async (): Promise<void> => {
      try {
        const { data } = await getCategory(idCategory);
        if (ignore) return;

        const editIcon = data.icon ? data.icon : 'home';
        setIcon(editIcon);
        setIsOperational(data.isOperational ?? true);
        setCategory(data);
        reset({ name: data.name, budget: data.budget ?? 0 });
      } catch (error) {
        if (!ignore) {
          showError(error);
        }
      }
    };

    loadCategory();

    return () => {
      ignore = true;
    };
  }, [idCategory, reset]);

  const onSubmit = async (payload: EditCategoryFormValues): Promise<void> => {
    try {
      const sendPayload: EditCategoryPayload = {
        ...payload,
        icon,
        isOperational
      };
      setLoading(true);
      await EditCategory(idCategory, sendPayload);
      setLoading(false);
      Keyboard.dismiss();
      ShowToast('Categoría editada exitosamente');
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const setIconHandle = (val: string): void => {
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

          <View
            style={[
              styles.switchCard,
              { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
            ]}
          >
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: colors.TEXT_PRIMARY }]}>
                Categoría operativa
              </Text>
              <Text style={[styles.switchDescription, { color: colors.TEXT_SECONDARY }]}>
                Se incluye en el promedio de ahorro. Desactívala para ingresos o gastos esporádicos
                (ej. cesantías, compra de activos).
              </Text>
            </View>
            <Switch
              value={isOperational}
              onValueChange={setIsOperational}
              trackColor={{ false: colors.GRAY, true: colors.SUCCESS }}
              thumbColor={colors.WHITE}
            />
          </View>

          {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(onSubmit)} title="Editar" />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
    marginBottom: 16
  },
  switchText: {
    flex: 1,
    marginRight: 12
  },
  switchLabel: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  switchDescription: {
    fontSize: SMALL
  }
});
