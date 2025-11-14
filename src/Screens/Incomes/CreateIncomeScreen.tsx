import React, { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Input } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { CreateIncome } from '../../services/incomes';

// Components
import MyLoading from '../../components/loading/MyLoading';
import ErrorText from '../../components/ErrorText';
import MyButton from '~/components/MyButton';
import ShowToast from '../../utils/toastUtils';

// Types
import { IncomeStackParamList } from '../../shared/types';
import { CreateIncomePayload } from '../../shared/types/services/income-service.type';

// Utils
import { DateFormat } from '../../utils/Helpers';
import { Errors } from '../../utils/Errors';

// Styles
import { DateSelector } from '../../components/datePicker';
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import { DropDownSelectFormat } from '../../shared/types/components';
import { IncomesPayloadOnSubmit } from '~/shared/types/screens/incomes';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

type CreateIncomeScreenNavigationProp = StackNavigationProp<
  IncomeStackParamList,
  'lastIncomes'
>;

interface CreateIncomeScreenProps {
  navigation: CreateIncomeScreenNavigationProp;
}

export default function CreateIncomeScreen({ navigation }: CreateIncomeScreenProps) {
  const colors = useThemeColors();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { amount: '', commentary: '' },
  });

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // DATE PICKER
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const handleStartDateChange = (selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCategoryChange = async (foundCategory: DropDownSelectFormat) => {
    setCategoryId(foundCategory.id);
  };

  const onSubmit = async (payload: IncomesPayloadOnSubmit) => {
    try {
      if (!categoryId) return;

      const payloadSend = {
        ...payload,
        amount: parseInt(payload.amount),
      };

      const dataSend: CreateIncomePayload = {
        ...payloadSend,
        categoryId,
        date: DateFormat(date, 'YYYY-MM-DD'),
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
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <SelectOnlyCategory searchType={1} handleCategoryChange={handleCategoryChange} />

      {!categoryId ? <ErrorText msg="Necesita una categoria de ingresos" /> : null}

      {/* AMOUNT */}
      <Controller
        name="amount"
        control={control}
        rules={{
          required: { value: true, message: 'El costo es obligatorio' },
          min: { value: 1, message: 'El minimó valor aceptado es 1' },
          max: {
            value: 99999999,
            message: 'El costo no puede superar los 99.999.999',
          },
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Ingreso"
            value={value}
            placeholder="Ej: 20000"
            onChangeText={onChange}
            keyboardType="numeric"
            errorStyle={{ color: colors.ERROR }}
            errorMessage={errors?.amount?.message}
            labelStyle={{ color: colors.TEXT_PRIMARY }}
            inputStyle={{ color: colors.TEXT_PRIMARY }}
            placeholderTextColor={colors.TEXT_SECONDARY}
          />
        )}
      />

      {/* COMMENTARY */}
      <Controller
        name="commentary"
        control={control}
        rules={{
          maxLength: {
            value: 200,
            message: 'El comentario no puede superar los 200 caracteres.',
          },
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Comentario"
            value={value}
            placeholder="Ej: Nómina, quincena"
            onChangeText={onChange}
            multiline
            numberOfLines={2}
            errorStyle={{ color: colors.ERROR }}
            errorMessage={errors?.commentary?.message}
            labelStyle={{ color: colors.TEXT_PRIMARY }}
            inputStyle={{ color: colors.TEXT_PRIMARY }}
            placeholderTextColor={colors.TEXT_SECONDARY}
          />
        )}
      />

      <DateSelector
        label="Fecha"
        date={date}
        showDatePicker={showDate}
        onPress={() => setShowDate(true)}
        onDateChange={handleStartDateChange}
        onCancel={() => setShowDate(false)}
      />

      {loading ? (
        <MyLoading />
      ) : (
        <MyButton title="Guardar" onPress={handleSubmit(onSubmit)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
