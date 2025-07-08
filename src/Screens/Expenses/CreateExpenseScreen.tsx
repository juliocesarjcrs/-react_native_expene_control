import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { Input, FAB } from 'react-native-elements';

// Services
import { CreateExpense, getExpensesFromSubcategory } from '../../services/expenses';

import { getExchangeCurrency } from '../../services/external';

// Components
import FlatListData from '../../components/card/FlatListData';
import MyLoading from '~/components/loading/MyLoading';
import SelectJoinCategory from '~/components/dropDown/SelectJoinCategory';

// Types
import { RootState } from '~/shared/types/reducers';
import { ExpenseModel } from '~/shared/types';
import { FormExpensesValues } from '~/shared/types/screens/expenses/create-expenses.type';
import { CreateExpensePayload, GetExpensesFromSubcategoryResponse } from '~/shared/types/services/expense-service.type';
import { DropDownSelectJoinCategoryFormat } from '~/shared/types/components/dropDown/SelectOnlyCategory.type';

// Utils
import { Errors } from '../../utils/Errors';
import ShowToast from '../../utils/toastUtils';
import { NumberFormat, DateFormat } from '../../utils/Helpers';
import { DateSelector } from '~/components/datePicker';

// Styles

export default function CreateExpenseScreen(): React.JSX.Element {
  const selectJoinCategoryRef = useRef();

  const month = useSelector((state: RootState) => state.date.month);
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm({
    defaultValues: { cost: '', commentary: '' }
  });

  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [sumCost, setSumCost] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [loading, setLoading] = useState(false);
  // date picker
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const handleStartDateChange = (selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  const showStartDatePicker = () => {
    setShowDate(true);
  };
  // convertidor de moneda
  const [currencySymbol] = useState('COP');

  const fetchExpensesSubcategory = async (foundSubcategory: DropDownSelectJoinCategoryFormat) => {
    try {
      setLoading(true);
      setSubcategoryId(foundSubcategory.value);
      const { data } = await getExpensesFromSubcategory(foundSubcategory.value, month);
      setLoading(false);
      setExpenses(data);
      calculateTotal(data);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const fetchExpensesOnlyCategory = async () => {
    // setDataCategory(foundCategory);
  };
  const calculateTotal = (data: GetExpensesFromSubcategoryResponse) => {
    const total = data.reduce((acu: number, val: ExpenseModel) => {
      return acu + val.cost;
    }, 0);
    setSumCost(total);
  };

  const onSubmit = async (payload: FormExpensesValues) => {
    let newAmount = null;
    if (currencySymbol !== 'COP') {
      try {
        const values = {
          amount: payload.cost,
          from: currencySymbol,
          to: 'COP'
        };
        const { data } = await getExchangeCurrency(values);
        newAmount = data.result;
        payload.cost = newAmount;
      } catch (error) {
        console.log('error---', error);
      }
    }
    try {
      if (!subcategoryId) {
        return;
      }
      const dataSend: CreateExpensePayload = {
        ...payload,
        cost: parseInt(payload.cost),
        subcategoryId,
        date: DateFormat(date, 'YYYY-MM-DD')
      };
      setLoading(true);
      const { data } = await CreateExpense(dataSend);
      setLoading(false);
      const newExpense = [data, ...expenses];
      setExpenses(newExpense);
      calculateTotal(newExpense);
      ShowToast();
      reset();
      Keyboard.dismiss();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const updateList = () => {
    if (!subcategoryId) {
      return;
    }
    fetchExpenses(subcategoryId);
  };
  const fetchExpenses = async (idSubcategory: number) => {
    const { data } = await getExpensesFromSubcategory(idSubcategory, month);
    setExpenses(data);
    calculateTotal(data);
  };

  return (
    <View style={styles.mainContainer}>
      <Controller
        name="cost"
        control={control}
        rules={{
          required: { value: true, message: 'El gasto es obligatorio' },
          min: { value: 1, message: 'El mínimo valor aceptado es 1' },
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
            errorMessage={errors?.cost ? errors.cost.message : undefined}
            keyboardType="numeric"
            style={{ margin: 0, padding: 0 }}
            errorStyle={{ color: 'red', margin: 0, padding: 0 }} // Ajusta el estilo del error
            containerStyle={{ margin: 0, padding: 0 }} // Ajusta el contenedor principal
          />
        )}
        defaultValue=""
      />
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
            errorMessage={errors?.commentary?.message}
            style={{ margin: 0, padding: 0 }}
            errorStyle={{ color: 'red', margin: 0, padding: 0 }} // Ajusta el estilo del error
            containerStyle={{ margin: 0, padding: 0 }} // Ajusta el contenedor principal
          />
        )}
        defaultValue=""
      />

      <SelectJoinCategory
        fetchExpensesSubcategory={fetchExpensesSubcategory}
        fetchExpensesOnlyCategory={fetchExpensesOnlyCategory}
        ref={selectJoinCategoryRef}
      />

      {/* <View style={styles.rows}>
              {checkboxes.map((cb, index) => {
                  return (
                      <CheckBox
                          center
                          key={cb.id}
                          title={cb.title}
                          iconType="material"
                          checkedIcon="check-box"
                          uncheckedIcon="check-box-outline-blank"
                          checked={cb.checked}
                          onPress={() => toggleCheckbox(cb.id, index)}
                          containerStyle={styles.containerCheckbox}
                      />
                  );
              })}
          </View> */}
      <DateSelector
        label="  Fecha "
        date={date}
        showDatePicker={showDate}
        onPress={showStartDatePicker}
        onDateChange={handleStartDateChange}
        onCancel={() => setShowDate(false)}
      />
      {/* Sección inferior (total y lista) */}
      <View style={styles.bottomSection}>
        {loading ? (
          <MyLoading />
        ) : (
          <FAB title="Guardar gasto" onPress={handleSubmit(onSubmit)} style={styles.saveButton} />
        )}

        <Text style={styles.totalText}>Total: {NumberFormat(sumCost)}</Text>
        <FlatListData expenses={expenses} updateList={updateList} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#fff'
  },
  bottomSection: {
    flex: 1
  },
  saveButton: {
    alignSelf: 'center',
    marginBottom: 1
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 0
  }
});
