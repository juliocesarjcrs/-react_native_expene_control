import React, {useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form'
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { CreateIncome } from '../../services/incomes';

// Components
import MyLoading from '../../components/loading/MyLoading';
import ErrorText from '../../components/ErrorText';
import ShowToast from '../../utils/toastUtils';

// Types
import { IncomeStackParamList } from '../../shared/types';
import { CreateIncomePayload } from '../../shared/types/services/income-service.type';

// Utils
import { DateFormat } from '../../utils/Helpers';
import { Errors } from '../../utils/Errors';

// Styles
import { SECUNDARY } from '../../styles/colors';
import { DateSelector } from '../../components/datePicker';
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import { DropDownSelectFormat } from '../../shared/types/components';

type CreateIncomeScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;

interface CreateIncomeScreenProps {
  navigation: CreateIncomeScreenNavigationProp;
}

export default function CreateIncomeScreen({ navigation }: CreateIncomeScreenProps) {
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm({
    defaultValues: { amount: '', commentary: '' }
  });
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataCategory, setDataCategory] = useState<DropDownSelectFormat>();


  //   DATE pIKER ---------------  ///////////////

  const [date, setDate] = useState(new Date());
  const today = DateFormat(new Date(), 'YYYY MMM DD');
  const [dateString, setDateString] = useState(today);
  const [showDate, setShowDate] = useState(false);

  const handleStartDateChange = (selectedDate: Date) => {
    const currentDate = selectedDate || date;

    // setShowDate(Platform.OS === 'ios');
    let newDate = DateFormat(currentDate, 'YYYY MMM DD');
    setDateString(newDate);
    setDate(currentDate);
  };
  const showStartDatePicker = () => {
    setShowDate(true);
  };



  const handleCategoryChange = async (foundCategory: DropDownSelectFormat) => {
    setDataCategory(foundCategory);
    setCategoryId(foundCategory.id);
  };

  const onSubmit = async (payload: any) => {
    try {
      if (!categoryId) {
        return;
      }
      const dataSend: CreateIncomePayload = {
        ...payload,
        categoryId,
        date: DateFormat(date, 'YYYY-MM-DD')
      };
      setLoading(true);
      await CreateIncome(dataSend);
      setLoading(false);
      ShowToast();
      reset();
      Keyboard.dismiss();
      navigation.navigate('sumaryIncomes');
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  return (
    <View style={styles.container}>
      <SelectOnlyCategory searchType={1} handleCategoryChange={handleCategoryChange} />

      {!categoryId ? <ErrorText msg="Necesita una categoria de ingresos" /> : null}
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

      <DateSelector label="  Fecha " date={date} showDatePicker={showDate}  onPress={showStartDatePicker} onDateChange={handleStartDateChange}/>
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
  }
});
