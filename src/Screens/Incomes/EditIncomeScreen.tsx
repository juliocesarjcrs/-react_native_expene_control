import React, { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input, Button } from 'react-native-elements';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { editIncome } from '../../services/incomes';

// Components
import { DateSelector } from '../../components/datePicker';
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import MyLoading from '../../components/loading/MyLoading';
import ShowToast from '../../utils/toastUtils';

// Types
import { EditIncomePayload } from '../../shared/types/services/income-service.type';
import { DropDownSelectFormat } from '../../shared/types/components';
import { IncomeStackParamList } from '../../shared/types';
import { IncomesPayloadOnSubmit } from '~/shared/types/screens/incomes';

// Utils
import { DateFormat } from '../../utils/Helpers';
import { Errors } from '../../utils/Errors';

// Styles
import { SECUNDARY } from '../../styles/colors';

type EditIncomeScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'editIncome'>;
type EditIncomeScreenRouteProp = RouteProp<IncomeStackParamList, 'editIncome'>;

interface EditIncomeScreenProps {
  navigation: EditIncomeScreenNavigationProp;
  route: EditIncomeScreenRouteProp;
}

export default function EditIncomeScreen({ navigation, route }: EditIncomeScreenProps) {
  const idIncome = route.params.objectIncome.id;
  const objectIncome = route.params.objectIncome;
  const [initialCategoryId] = useState<number | null>(objectIncome.idCategory);
  const [idCategory, setIdCategory] = useState<number | null>(null);

  const [incomeEdit] = useState({
    amount: objectIncome.cost.toString(),
    commentary: objectIncome.commentary
  });
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm({
    defaultValues: incomeEdit
  });

  const [loading, setLoading] = useState(false);

  //   DATE pIKER ---------------  ///////////////
  const loadDate = new Date(objectIncome.date);
  loadDate.setMinutes(loadDate.getMinutes() + loadDate.getTimezoneOffset());
  const [date, setDate] = useState<Date>(loadDate);

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

  const handleCategoryChange = async (foundCategory: DropDownSelectFormat) => {
    setIdCategory(foundCategory.id);
  };

  const onSubmit = async (payload: IncomesPayloadOnSubmit) => {
    try {
      if (!idCategory) {
        return;
      }
      const payloadSend = {
        ...payload,
        amount: parseInt(payload.amount)
      };
      const dataSend: EditIncomePayload = {
        ...payloadSend,
        categoryId: idCategory,
        date: DateFormat(date, 'YYYY-MM-DD')
      };
      setLoading(true);
      const { data } = await editIncome(idIncome, dataSend);
      setLoading(false);
      ShowToast();
      reset();
      Keyboard.dismiss();
      // navigation.navigate('lastIncomes');
      navigation.navigate('lastIncomes', { data });
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  return (
    <View style={styles.container}>
      <SelectOnlyCategory
        searchType={1}
        handleCategoryChange={handleCategoryChange}
        selectedCategoryId={initialCategoryId}
      />
      <Controller
        name="amount"
        control={control}
        rules={{
          required: { value: true, message: 'El costo es obligatorio' },
          min: { value: 1, message: 'El minimó valor aceptado es 1' },
          max: {
            value: 99999999,
            message: 'El costo no puede superar el valor de 99.999.999 '
          }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Ingreso"
            value={value}
            placeholder="Ej: 20000"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: 'red' }}
            errorMessage={errors?.amount?.message}
            keyboardType="numeric"
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
            placeholder="Ej: Nómina, quincena"
            onChangeText={(text) => onChange(text)}
            multiline
            numberOfLines={2}
            errorStyle={{ color: 'red' }}
            errorMessage={errors?.commentary?.message}
          />
        )}
        defaultValue=""
      />
      <DateSelector
        label="  Fecha "
        date={date}
        showDatePicker={showDate}
        onPress={showStartDatePicker}
        onDateChange={handleStartDateChange}
        onCancel={() => setShowDate(false)}
      />
      {loading ? (
        <MyLoading />
      ) : (
        <Button title="Guardar" buttonStyle={{ backgroundColor: SECUNDARY }} onPress={handleSubmit(onSubmit)} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  containerDate: {
    display: 'flex',
    flexDirection: 'row'
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: 'white',
    backgroundColor: '#c5c5c5'
  }
});
