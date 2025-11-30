import React, { useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';

// Services
import { CreateExpense, getExpensesFromSubcategory } from '~/services/expenses';
import { getExchangeCurrency } from '~/services/external';

// Components
import MyLoading from '~/components/loading/MyLoading';
import SelectJoinCategory from '~/components/dropDown/SelectJoinCategory';
import { ScreenHeader } from '~/components/ScreenHeader';
import { DateSelector } from '~/components/datePicker';
import MyButton from '~/components/MyButton';
import ExpenseList from './components/ExpenseList';

// Types
import { RootState } from '~/shared/types/reducers';
import { ExpenseModel } from '~/shared/types';
import { FormExpensesValues } from '~/shared/types/screens/expenses/create-expenses.type';
import { CreateExpensePayload, GetExpensesFromSubcategoryResponse } from '~/shared/types/services/expense-service.type';
import { DropDownSelectJoinCategoryFormat } from '~/shared/types/components/dropDown/SelectOnlyCategory.type';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export default function CreateExpenseScreen(): React.JSX.Element {
  const config = screenConfigs.createExpense;
  const colors = useThemeColors();
  const selectJoinCategoryRef = useRef<any>(null);

  const month = useSelector((state: RootState) => state.date.month);
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    mode: 'onTouched'
  });

  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [sumCost, setSumCost] = useState<number>(0);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Date picker
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState<boolean>(false);
  
  const handleStartDateChange = (selectedDate?: Date): void => {
    setShowDate(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const showStartDatePicker = (): void => {
    setShowDate(true);
  };
  
  // Currency converter
  const [currencySymbol] = useState<string>('COP');

  const fetchExpensesSubcategory = async (foundSubcategory: DropDownSelectJoinCategoryFormat): Promise<void> => {
    try {
      setLoading(true);
      setSubcategoryId(foundSubcategory.value);
      const { data } = await getExpensesFromSubcategory(foundSubcategory.value, month);
      setLoading(false);
      setExpenses(data);
      calculateTotal(data);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };
  
  const fetchExpensesOnlyCategory = async (): Promise<void> => {
    // Implementation pending
  };
  
  const calculateTotal = (data: GetExpensesFromSubcategoryResponse): void => {
    const total = data.reduce((acu: number, val: ExpenseModel) => {
      return acu + val.cost;
    }, 0);
    setSumCost(total);
  };

  const onSubmit = async (payload: FormExpensesValues): Promise<void> => {
    let newAmount: number | string = payload.cost;
    
    if (currencySymbol !== 'COP') {
      try {
        const values = {
          amount: parseInt(String(payload.cost)),
          from: currencySymbol,
          to: 'COP'
        };
        const { data } = await getExchangeCurrency(values);
        newAmount = data.result;
      } catch (error) {
        console.log('error---', error);
      }
    }
    
    try {
      if (!subcategoryId) {
        ShowToast('Debes seleccionar una subcategoría');
        return;
      }
      
      const dataSend: CreateExpensePayload = {
        ...payload,
        cost: parseInt(String(newAmount)),
        subcategoryId,
        date: DateFormat(date, 'YYYY-MM-DD')
      };
      
      setLoading(true);
      const { data } = await CreateExpense(dataSend);
      setLoading(false);
      
      const newExpense = [data, ...expenses];
      setExpenses(newExpense);
      calculateTotal(newExpense);
      ShowToast('Gasto creado exitosamente');
      reset();
      Keyboard.dismiss();
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };
  
  const updateList = (): void => {
    if (!subcategoryId) {
      return;
    }
    fetchExpenses(subcategoryId);
  };
  
  const fetchExpenses = async (idSubcategory: number): Promise<void> => {
    const { data } = await getExpensesFromSubcategory(idSubcategory, month);
    setExpenses(data);
    calculateTotal(data);
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Controller
            name="cost"
            control={control}
            rules={{
              required: { value: true, message: 'El gasto es obligatorio' },
              min: { value: 1, message: 'El mínimo valor aceptado es 1' },
              max: {
                value: 99999999,
                message: 'El gasto no puede superar 99.999.999'
              }
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Gasto"
                value={value}
                placeholder="Ej: 20000"
                placeholderTextColor={colors.TEXT_SECONDARY}
                onChangeText={onChange}
                errorMessage={errors?.cost?.message as string}
                keyboardType="numeric"
                errorStyle={{ color: colors.ERROR }}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
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
                message: 'El comentario no puede superar 200 caracteres'
              }
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Comentario"
                value={value}
                placeholder="Ej: Compra de una camisa"
                placeholderTextColor={colors.TEXT_SECONDARY}
                onChangeText={onChange}
                multiline
                numberOfLines={2}
                errorMessage={errors?.commentary?.message as string}
                errorStyle={{ color: colors.ERROR }}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
            defaultValue=""
          />

          <SelectJoinCategory
            fetchExpensesSubcategory={fetchExpensesSubcategory}
            fetchExpensesOnlyCategory={fetchExpensesOnlyCategory}
            ref={selectJoinCategoryRef}
          />

          <DateSelector
            label="Fecha"
            date={date}
            showDatePicker={showDate}
            onPress={showStartDatePicker}
            onDateChange={handleStartDateChange}
            onCancel={() => setShowDate(false)}
          />

          {loading ? (
            <MyLoading />
          ) : (
            <MyButton 
              title="Guardar gasto" 
              onPress={handleSubmit(onSubmit as any)} 
              variant="primary" 
            />
          )}

          {/* Total */}
          <View style={[styles.totalContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>
              Total del mes:
            </Text>
            <Text style={[styles.totalAmount, { color: colors.WARNING }]}>
              {NumberFormat(sumCost)}
            </Text>
          </View>

          {/* Lista de gastos */}
          <ExpenseList expenses={expenses} updateList={updateList} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLabel: {
    fontSize: MEDIUM,
  },
  totalAmount: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
  },
});