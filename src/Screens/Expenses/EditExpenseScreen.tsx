import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { View } from 'react-native';
import { Input, Icon } from 'react-native-elements';

// Services
import { editExpense, getOneExpense } from '../../services/expenses';
import { getAllSubcategoriesExpensesByMonth } from '../../services/categories';

// Components
import MyButton from '~/components/MyButton';
import ErrorText from '../../components/ErrorText';
import MyLoading from '~/components/loading/MyLoading';
import { useThemeColors } from '~/customHooks/useThemeColors';

// Types
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { ExpenseStackParamList, SubcategoryModel } from '~/shared/types';
import { CategoryOption, FormValues, SubcategoryOption } from '~/shared/types/screens/expenses/edit-expenses.type';
import { EditExpensePayload, GetOneExpenseResponse } from '~/shared/types/services/expense-service.type';

// Utils
import { NumberFormat, DateFormat } from '../../utils/Helpers';
import { showError } from '~/utils/showError';
import ShowToast from '../../utils/toastUtils';
// import { CateroryFormat } from '~/shared/types/components';
import SelectJoinCategory from '~/components/dropDown/SelectJoinCategory';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type EditExpenseScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'editExpense'>;
type EditExpenseScreenRouteProp = RouteProp<ExpenseStackParamList, 'editExpense'>;

interface EditExpenseScreenProps {
  navigation: EditExpenseScreenNavigationProp;
  route: EditExpenseScreenRouteProp;
}



export default function EditExpenseScreen({ route, navigation }: EditExpenseScreenProps) {
  const colors = useThemeColors();
  const idExpense = route.params.objectExpense.id;
  const objectExpense = route.params.objectExpense;

  const month = useSelector((state: any) => state.date.month);

  const [expenseEdit, setExpenseEdit] = useState<FormValues>({
    cost: objectExpense.cost.toString(),
    commentary: objectExpense.commentary ?? ''
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: expenseEdit
  });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [sumCost, setSumCost] = useState<number>(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const ITEM_HEIGHT = 42;
  const [open, setOpen] = useState<boolean>(false);
  const [open2, setOpen2] = useState<boolean>(false);
  const [idCategory, setIdCategory] = useState<number | null>(null);

  // DATE PICKER
  let loadDate = new Date(objectExpense.date);
  // Ajuste timezone
  loadDate.setMinutes(loadDate.getMinutes() + loadDate.getTimezoneOffset());

  const [date, setDate] = useState<Date>(loadDate);
  const today = DateFormat(loadDate, 'YYYY MMM DD');
  const [dateString, setDateString] = useState<string>(today);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState<boolean>(false);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    const newDate = DateFormat(currentDate, 'YYYY MMM DD');
    setDateString(newDate);
    setDate(currentDate);
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  // efectos para category/subcategory
  useEffect(() => {
    sendFromDropDownPickerCategory(idCategory);
  }, [idCategory, categories]);

  useEffect(() => {
    sendDataSubcategory(subcategoryId);
  }, [subcategoryId]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---------------------- Fetching ----------------------

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await getAllSubcategoriesExpensesByMonth(month);
      setLoading(false);
      const filter = (data.data ?? []).filter((f: any) => f.subcategories?.length > 0);
      const dataFormat: CategoryOption[] = filter.map((e: any) => {
        return { label: e.name, value: e.id, subcategories: e.subcategories };
      });
      setCategories(dataFormat);

      await defaultIdCategory();
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const defaultIdCategory = async () => {
    try {
      const { data } = await getOneExpense(idExpense);
      // rellena formulario
      setExpenseEdit({
        cost: data.cost?.toString() ?? '',
        commentary: data.commentary ?? ''
      });
      reset({
        cost: data.cost?.toString() ?? '',
        commentary: data.commentary ?? ''
      });

      // data.subcategory existe según contrato
      const idCategoryEdit = data.subcategory?.category?.id ?? null;
      setIdCategory(idCategoryEdit);
      const idsubcategoryEdit = data.subcategory?.id ?? null;
      setSubcategoryId(idsubcategoryEdit);
    } catch (error) {
      showError(error);
    }
  };

  const sendDataSubcategory = (index: number | null) => {
    if (!index || Number.isNaN(index)) {
      setExpenses([]);
      setSumCost(0);
    } else {
      // Si quieres descomentar fetchExpenses
      // fetchExpenses(index);
    }
  };

  const calculateTotal = (data: any[]) => {
    const total = data.reduce((acu, val) => {
      return acu + parseFloat(String(val.cost));
    }, 0);
    setSumCost(total);
  };

  const formatOptionsSubcategories = (data: SubcategoryModel[] = []) => {
    return data.map((e) => {
      return { label: e.name, value: e.id };
    });
  };

  // ---------------------- Submit ----------------------

  const onSubmit = async (payload: FormValues) => {
    try {
      if (!subcategoryId) {
        return;
      }
      const dataSend: EditExpensePayload = {
        ...payload,
        cost: parseFloat(payload.cost),
        subcategoryId,
        date: DateFormat(date, 'YYYY-MM-DD')
      };
      setLoading(true);
      await editExpense(idExpense, dataSend);
      setLoading(false);

      ShowToast();
      reset();
      Keyboard.dismiss();
      navigation.replace('lastExpenses');
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const sendFromDropDownPickerCategory = (index: number | null) => {
    setExpenses([]);
    setSumCost(0);

    const indexArray = categories.findIndex((e) => {
      return e.value === index;
    });
    if (indexArray >= 0) {
      const dataFormat = formatOptionsSubcategories(categories[indexArray].subcategories ?? []);
      setSubcategories(dataFormat);
    } else {
      setSubcategories([]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}>
        {/* COST */}
        <Controller
          name="cost"
          control={control}
          rules={{
            required: { value: true, message: 'El gasto es obligatorio' },
            min: { value: 1, message: 'El minimó valor aceptado es 1' },
            max: {
              value: 99999999,
              message: 'El gasto no puede superar el valor de 99.999.999 '
            }
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Gasto"
              value={value}
              placeholder="Ej: 20000"
              onChangeText={(text) => onChange(text)}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.cost?.message}
              keyboardType="numeric"
              inputContainerStyle={{ borderColor: colors.BORDER }}
              labelStyle={{ color: colors.TEXT_SECONDARY }}
              style={{ color: colors.TEXT_PRIMARY }}
            />
          )}
          defaultValue=""
        />

        {/* COMMENTARY */}
        <Controller
          name="commentary"
          control={control}
          rules={{
            maxLength: {
              value: 200,
              message: 'El comenatario no puede superar los 200 carácteres '
            }
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Comentario"
              value={value}
              placeholder="Ej: Compra de una camisa"
              onChangeText={(text) => onChange(text)}
              multiline
              numberOfLines={2}
              errorStyle={{ color: colors.ERROR }}
              errorMessage={errors?.commentary?.message}
              inputContainerStyle={{ borderColor: colors.BORDER }}
              labelStyle={{ color: colors.TEXT_SECONDARY }}
              style={{ color: colors.TEXT_PRIMARY }}
            />
          )}
          defaultValue=""
        />

    {/* CATEGORY */}
        <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Categoría</Text>

        <DropDownPicker
          open={open}
          value={idCategory}
          items={categories}
          setOpen={setOpen}
          setValue={setIdCategory as any}
          setItems={setCategories as any}
          maxHeight={ITEM_HEIGHT * Math.max(1, categories.length)}
          placeholder="Seleccione una categoría"
          zIndex={2000}
          zIndexInverse={1000}
          loading={loading}
          ActivityIndicatorComponent={() => <MyLoading />}
          activityIndicatorSize={30}
          dropDownContainerStyle={{
            backgroundColor: colors.CARD_BACKGROUND,
            borderColor: colors.BORDER,
          }}
          listMode="MODAL"
          selectedItemContainerStyle={{
            backgroundColor: colors.PRIMARY + "22",
          }}
          itemSeparator={true}
          itemSeparatorStyle={{
            backgroundColor: colors.BORDER,
          }}
          selectedItemLabelStyle={{
            fontWeight: "bold",
            color: colors.TEXT_PRIMARY,
          }}
        />
        {!idCategory ? <ErrorText msg="Necesita seleccionar una  Categoria" /> : null}

        {/* SUBCATEGORY */}
        <Text style={[styles.label, { color: colors.TEXT_PRIMARY, marginTop: 12 }]}>Subcategoría</Text>

        <DropDownPicker
          open={open2}
          value={subcategoryId}
          items={subcategories}
          setOpen={setOpen2}
          setValue={setSubcategoryId as any}
          setItems={setSubcategories as any}
          maxHeight={ITEM_HEIGHT * Math.max(1, subcategories.length)}
          placeholder="Seleccione una subcategoría"
          zIndex={1000}
          zIndexInverse={2000}
          loading={loading}
          listMode="MODAL"
          dropDownContainerStyle={{
            backgroundColor: colors.CARD_BACKGROUND,
            borderColor: colors.BORDER,
          }}
          selectedItemContainerStyle={{
            backgroundColor: colors.PRIMARY + "22",
          }}
          itemSeparator={true}
          itemSeparatorStyle={{
            backgroundColor: colors.BORDER,
          }}
          selectedItemLabelStyle={{
            fontWeight: "bold",
            color: colors.TEXT_PRIMARY,
          }}
        />
        {!subcategoryId ? <ErrorText msg="Necesita seleccionar una subcategoria" /> : null}

        {/* DATE PICKER */}
        <View style={styles.containerDate}>
          <MyButton
            title="Fecha"
            onPress={showDatepicker}
            icon={<Icon type="material-community" name="calendar" size={20} color={colors.TEXT_PRIMARY} />}
            variant="primary"
            size="medium"
          />
          <Text style={[styles.textDate, { backgroundColor: colors.PRIMARY, color: colors.WHITE }]}>{dateString}</Text>
        </View>

        {show && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={mode}
            is24Hour={true}
            display="default"
            onChange={onChange}
          />
        )}

        {/* SUBMIT */}
        <View style={{ marginTop: 10 }}>
          {loading ? (
            <MyLoading />
          ) : (
            <MyButton
              title="Editar"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    display: 'flex',
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
  }
});
