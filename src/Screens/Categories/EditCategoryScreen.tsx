import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import type { RouteProp } from '@react-navigation/native';

// Services
import { EditCategory, getCategory } from '../../services/categories';

// Components
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import ModalIcon from '../../components/modal/ModalIcon';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';

// Types
import type { ExpenseStackParamList } from '~/shared/types';
import type { EditCategoryPayload } from '~/shared/types/services';

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
interface EditCategoryFormValues {
  name: string;
  budget: number;
}

const DEFAULT_ICON = 'home';
const MAX_NAME_LENGTH = 200;
const MIN_BUDGET = 0;
const MAX_BUDGET = 99999999;

export default function EditCategoryScreen({ route }: EditCategoryScreenProps): React.JSX.Element {
  const screenConfig = screenConfigs.editCategory;
  const colors = useThemeColors();
  const idCategory = route.params.idCategory;

  const { handleSubmit, control, reset } = useForm<EditCategoryFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', budget: 0 }
  });
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [isOperational, setIsOperational] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: colors.BACKGROUND },
        switchCard: { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER },
        switchLabel: { color: colors.TEXT_PRIMARY },
        switchDescription: { color: colors.TEXT_SECONDARY }
      }),
    [colors]
  );

  useEffect(() => {
    let ignore = false;

    const loadCategory = async (): Promise<void> => {
      try {
        const { data } = await getCategory(idCategory);
        if (ignore) return;

        setIcon(data.icon ? data.icon : DEFAULT_ICON);
        setIsOperational(data.isOperational ?? true);
        reset({ name: data.name, budget: data.budget ?? 0 });
      } catch (error) {
        if (!ignore) {
          showError(error);
        }
      }
    };

    void loadCategory();

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
      Keyboard.dismiss();
      ShowToast('Categoría editada exitosamente');
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const submitForm = (): void => {
    void handleSubmit(onSubmit)();
  };

  const setIconHandle = (val: string): void => {
    setIcon(val);
  };

  return (
    <View style={[commonStyles.screenContainer, dynamicStyles.screen]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
      <StatusBar style="auto" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <MyInput
            name="name"
            control={control}
            label="Categoría"
            placeholder="Ej: Vivienda"
            rules={{
              required: 'El nombre de la categoría es obligatorio',
              maxLength: {
                value: MAX_NAME_LENGTH,
                message: 'El nombre no puede superar 200 caracteres'
              }
            }}
            leftIcon="tag"
            maxLength={MAX_NAME_LENGTH}
            autoFocus
          />

          <MyInput
            name="budget"
            type="currency"
            control={control}
            label="Presupuesto"
            placeholder="0"
            rules={{
              min: { value: MIN_BUDGET, message: 'El mínimo valor aceptado es 0' },
              max: {
                value: MAX_BUDGET,
                message: 'El presupuesto no puede superar el valor de 99.999.999'
              }
            }}
            leftIcon="wallet"
          />

          <ModalIcon icon={icon} setIcon={setIconHandle} />

          <View style={[styles.switchCard, dynamicStyles.switchCard]}>
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, dynamicStyles.switchLabel]}>
                Categoría operativa
              </Text>
              <Text style={[styles.switchDescription, dynamicStyles.switchDescription]}>
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

          {loading ? <MyLoading /> : <MyButton onPress={submitForm} title="Editar" />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
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
