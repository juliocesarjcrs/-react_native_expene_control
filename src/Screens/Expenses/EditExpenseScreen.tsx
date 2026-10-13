import React, { useEffect, useMemo, useState } from 'react';
import type { SetStateAction } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import { Icon } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

// Services
import { editExpense, getOneExpense } from '../../services/expenses';
import { getAllSubcategoriesExpensesByMonth } from '../../services/categories';

// Components
import MyButton from '~/components/MyButton';
import ErrorText from '../../components/ErrorText';
import MyLoading from '~/components/loading/MyLoading';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';
import ExpenseNatureSelector from '~/components/inputs/ExpenseNatureSelector';

// Types
import type { ExpenseStackParamList } from '~/shared/types';
import type { RootState } from '~/shared/types/reducers';
import type {
  CategoryOption,
  FormValues,
  SubcategoryOption
} from '~/shared/types/screens/expenses/edit-expenses.type';
import type { EditExpensePayload } from '~/shared/types/services/expense-service.type';

// Utils
import { DateFormat } from '../../utils/Helpers';
import { showError } from '~/utils/showError';
import { ShowToast } from '../../utils/toastUtils';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type EditExpenseScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'editExpense'>;
type EditExpenseScreenRouteProp = RouteProp<ExpenseStackParamList, 'editExpense'>;

interface EditExpenseScreenProps {
  navigation: EditExpenseScreenNavigationProp;
  route: EditExpenseScreenRouteProp;
}

const ITEM_HEIGHT = 42;
const DEFAULT_NATURE = 'operational';
const SELECTED_ITEM_OPACITY_HEX = '22';
const MIN_COST = 1;
const MAX_COST = 999999999;
const MAX_COMMENTARY_LENGTH = 200;

// DropDownPicker llama a setValue con un valor o con una función (prev) => valor
const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === 'function' ? (next as (prevState: T) => T)(prev) : next;

// Definido fuera del componente para que sea una referencia estable
const LoadingIndicator = (): React.JSX.Element => <MyLoading />;

// La fecha llega en UTC; se ajusta a la zona horaria local
const parseExpenseDate = (value: string): Date => {
  const parsed = new Date(value);
  parsed.setMinutes(parsed.getMinutes() + parsed.getTimezoneOffset());
  return parsed;
};

export default function EditExpenseScreen({
  route,
  navigation
}: EditExpenseScreenProps): React.JSX.Element {
  const config = screenConfigs.editExpense;
  const colors = useThemeColors();
  const { objectExpense } = route.params;
  const idExpense = objectExpense.id;

  const month = useSelector((state: RootState) => state.date.month);

  const { handleSubmit, control, reset } = useForm<FormValues>({
    defaultValues: {
      cost: objectExpense.cost,
      commentary: objectExpense.commentary ?? '',
      nature: objectExpense.nature ?? DEFAULT_NATURE
    }
  });
  const nature = useWatch({ control, name: 'nature' });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [idCategory, setIdCategory] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // carga inicial
  const [saving, setSaving] = useState<boolean>(false); // envío del formulario
  const [open, setOpen] = useState<boolean>(false);
  const [open2, setOpen2] = useState<boolean>(false);

  // DATE PICKER
  const [date, setDate] = useState<Date>(() => parseExpenseDate(objectExpense.date));
  const [show, setShow] = useState<boolean>(false);
  const dateString = DateFormat(date, 'YYYY MMM DD');

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: colors.BACKGROUND },
        card: { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER },
        label: { color: colors.TEXT_PRIMARY },
        textDate: { backgroundColor: colors.PRIMARY, color: colors.WHITE }
      }),
    [colors]
  );

  // Subcategorías derivadas de la categoría seleccionada
  const subcategories = useMemo<SubcategoryOption[]>(() => {
    const selected = categories.find((c) => c.value === idCategory);
    return (selected?.subcategories ?? []).map((e) => ({ label: e.name, value: e.id }));
  }, [categories, idCategory]);

  // Carga de categorías y del gasto
  useEffect(() => {
    let isMounted = true;

    const loadData = async (): Promise<void> => {
      try {
        const [categoriesResponse, expenseResponse] = await Promise.all([
          getAllSubcategoriesExpensesByMonth(month),
          getOneExpense(idExpense)
        ]);
        if (!isMounted) return;

        const withSubcategories = (categoriesResponse.data.data ?? []).filter(
          (f) => (f.subcategories?.length ?? 0) > 0
        );
        setCategories(
          withSubcategories.map((e) => ({
            label: e.name,
            value: e.id,
            subcategories: e.subcategories
          }))
        );

        const { data } = expenseResponse;
        reset({
          cost: data.cost ?? 0,
          commentary: data.commentary ?? '',
          nature: data.nature ?? DEFAULT_NATURE
        });
        setIdCategory(data.subcategory?.category?.id ?? null);
        setSubcategoryId(data.subcategory?.id ?? null);
      } catch (error) {
        if (isMounted) showError(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [month, idExpense, reset]);

  const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date): void => {
    setShow(Platform.OS === 'ios');
    setDate(selectedDate ?? date);
  };

  const handleCategoryChange = (next: number | null): void => {
    setIdCategory(next);
    setSubcategoryId(null); // la subcategoría anterior ya no pertenece a la nueva categoría
  };

  const onSubmit = async (payload: FormValues): Promise<void> => {
    if (!subcategoryId) return;

    const dataSend: EditExpensePayload = {
      ...payload,
      subcategoryId,
      date: DateFormat(date, 'YYYY-MM-DD'),
      nature: payload.nature ?? DEFAULT_NATURE
    };

    try {
      setSaving(true);
      await editExpense(idExpense, dataSend);

      ShowToast();
      Keyboard.dismiss();
      navigation.replace('lastExpenses');
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const submitForm = (): void => {
    void handleSubmit(onSubmit)();
  };

  // Props de estilo compartidas por ambos pickers
  const sharedPickerProps = {
    loading,
    listMode: 'MODAL' as const,
    placeholderStyle: { color: colors.GRAY },
    style: { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER },
    dropDownContainerStyle: { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER },
    modalContentContainerStyle: { backgroundColor: colors.CARD_BACKGROUND },
    selectedItemContainerStyle: {
      backgroundColor: `${colors.PRIMARY}${SELECTED_ITEM_OPACITY_HEX}`
    },
    itemSeparator: true,
    itemSeparatorStyle: { backgroundColor: colors.BORDER },
    selectedItemLabelStyle: { fontWeight: 'bold' as const, color: colors.TEXT_PRIMARY },
    textStyle: { color: colors.TEXT_PRIMARY }
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, dynamicStyles.screen]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, dynamicStyles.card]}>
          {/* COST */}
          <MyInput
            name="cost"
            type="currency"
            control={control}
            label="Gasto"
            placeholder="0"
            rules={{
              required: 'El gasto es obligatorio',
              min: { value: MIN_COST, message: 'El mínimo valor aceptado es 1' },
              max: {
                value: MAX_COST,
                message: 'El gasto no puede superar el valor de 999.999.999'
              }
            }}
            leftIcon="cash"
            autoFocus
          />

          {/* NATURE */}
          <ExpenseNatureSelector control={control} name="nature" defaultValue={nature} />

          {/* COMMENTARY */}
          <MyInput
            name="commentary"
            type="textarea"
            control={control}
            label="Comentario"
            placeholder="Ej: Compra de una camisa"
            rules={{
              maxLength: {
                value: MAX_COMMENTARY_LENGTH,
                message: 'El comentario no puede superar los 200 caracteres'
              }
            }}
            multiline
            numberOfLines={2}
            maxLength={MAX_COMMENTARY_LENGTH}
            leftIcon="text"
          />

          {/* CATEGORY */}
          <Text style={[styles.label, dynamicStyles.label]}>Categoría</Text>

          <DropDownPicker
            {...sharedPickerProps}
            open={open}
            value={idCategory}
            items={categories}
            setOpen={setOpen}
            setValue={(next) => handleCategoryChange(resolve(next, idCategory))}
            maxHeight={ITEM_HEIGHT * Math.max(1, categories.length)}
            placeholder="Seleccione una categoría"
            zIndex={2000}
            zIndexInverse={1000}
            ActivityIndicatorComponent={LoadingIndicator}
            activityIndicatorSize={30}
          />
          {!idCategory && <ErrorText msg="Necesita seleccionar una categoría" />}

          {/* SUBCATEGORY */}
          <Text style={[styles.label, styles.subcategoryLabel, dynamicStyles.label]}>
            Subcategoría
          </Text>

          <DropDownPicker
            {...sharedPickerProps}
            open={open2}
            value={subcategoryId}
            items={subcategories}
            setOpen={setOpen2}
            setValue={(next) => setSubcategoryId(resolve(next, subcategoryId))}
            maxHeight={ITEM_HEIGHT * Math.max(1, subcategories.length)}
            placeholder="Seleccione una subcategoría"
            zIndex={1000}
            zIndexInverse={2000}
          />
          {!subcategoryId && <ErrorText msg="Necesita seleccionar una subcategoría" />}

          {/* DATE PICKER */}
          <View style={styles.containerDate}>
            <MyButton
              title="Fecha"
              onPress={() => setShow(true)}
              icon={
                <Icon
                  type="material-community"
                  name="calendar"
                  size={20}
                  color={colors.TEXT_PRIMARY}
                />
              }
              variant="primary"
              size="medium"
            />
            <Text style={[styles.textDate, dynamicStyles.textDate]}>{dateString}</Text>
          </View>

          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour
              display="default"
              onChange={onChangeDate}
            />
          )}

          {/* SUBMIT */}
          <View style={styles.submit}>
            {saving ? (
              <MyLoading />
            ) : (
              <MyButton
                title="Editar"
                onPress={submitForm}
                variant="primary"
                size="large"
                fullWidth
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  card: {
    flex: 1,
    padding: 12,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1
  },
  containerDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  textDate: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
    overflow: 'hidden'
  },
  label: {
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600'
  },
  subcategoryLabel: {
    marginTop: 12
  },
  submit: {
    marginTop: 10
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  }
});
