import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Keyboard, Switch } from 'react-native';
import { useForm } from 'react-hook-form';
import { RadioButton } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { CreateCategory, getCategories } from '~/services/categories';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';
import ModalIcon from '~/components/modal/ModalIcon';
import MyInput from '~/components/inputs/MyInput';
import CategoryList from './components/CategoryList';

// Types
import { CategoryModel, ExpenseStackParamList } from '~/shared/types';
import { CreateCategoryPayload } from '~/shared/types/services';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export type CreateCategoryScreenNavigationProp = StackNavigationProp<
  ExpenseStackParamList,
  'createCategory'
>;

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
  const [isOperational, setIsOperational] = useState<boolean>(true);

  const { handleSubmit, control, reset } = useForm<CreateCategoryFormData>({
    defaultValues: { name: '' }
  });

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const params = { type };
      const { data } = await getCategories(params);
      setCategories(data);
    } catch (error) {
      showError(error);
    }
  }, [type]);

  useEffect(() => {
    let ignore = false;

    const loadCategories = async (): Promise<void> => {
      try {
        const params = { type };
        const { data } = await getCategories(params);
        if (!ignore) {
          setCategories(data);
        }
      } catch (error) {
        if (!ignore) {
          showError(error);
        }
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, [type]);

  const onSubmit = async (payload: CreateCategoryFormData): Promise<void> => {
    try {
      const dataTransform: CreateCategoryPayload = {
        ...payload,
        icon,
        type,
        isOperational
      };
      setLoading(true);
      const { data } = await CreateCategory(dataTransform);
      setLoading(false);

      const newCategories = [...categories, data];
      setCategories(newCategories);
      reset();
      setIsOperational(true);
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
          <Text style={[styles.radioLabel, { color: colors.TEXT_PRIMARY }]}>
            Tipo de categoría:
          </Text>
          <RadioButton.Group onValueChange={handleTypeChange} value={type.toString()}>
            <View style={styles.radioContainer}>
              <View style={styles.radioOption}>
                <RadioButton.Android
                  value="0"
                  color={colors.WARNING}
                  uncheckedColor={colors.TEXT_SECONDARY}
                />
                <Text style={{ color: colors.TEXT_PRIMARY, fontSize: 14, marginLeft: 4 }}>
                  Gasto
                </Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android
                  value="1"
                  color={colors.SUCCESS}
                  uncheckedColor={colors.TEXT_SECONDARY}
                />
                <Text style={{ color: colors.TEXT_PRIMARY, fontSize: 14, marginLeft: 4 }}>
                  Ingreso
                </Text>
              </View>
            </View>
          </RadioButton.Group>
        </View>

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

        <ModalIcon icon={icon} setIcon={handleIconChange} />

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

        {loading ? <MyLoading /> : <MyButton onPress={handleSubmit(onSubmit)} title="Guardar" />}
        <CategoryList data={categories} updateList={updateList} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  radioGroup: {
    marginVertical: 8,
    marginBottom: 16,
    paddingHorizontal: 10
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center'
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
