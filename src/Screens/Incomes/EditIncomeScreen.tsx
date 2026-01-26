import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { editIncome } from '../../services/incomes';

// Components
import { DateSelector } from '../../components/datePicker';
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';

// Types
import { EditIncomePayload } from '../../shared/types/services/income-service.type';
import { DropDownSelectFormat } from '../../shared/types/components';
import { IncomeStackParamList } from '../../shared/types';
import { IncomesPayloadOnSubmit } from '~/shared/types/screens/incomes';

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

type EditIncomeScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'editIncome'>;
type EditIncomeScreenRouteProp = RouteProp<IncomeStackParamList, 'editIncome'>;

interface EditIncomeScreenProps {
  navigation: EditIncomeScreenNavigationProp;
  route: EditIncomeScreenRouteProp;
}

export default function EditIncomeScreen({ navigation, route }: EditIncomeScreenProps) {
  const config = screenConfigs.editIncome;
  const colors = useThemeColors();

  const { objectIncome } = route.params;
  const idIncome = objectIncome.id;

  const [initialCategoryId] = useState<number | null>(objectIncome.idCategory);
  const [idCategory, setIdCategory] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  // Default form values
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      amount: objectIncome.cost,
      commentary: objectIncome.commentary
    }
  });

  // DATE PICKER ------------------------------------
  const loadDate = new Date(objectIncome.date);
  loadDate.setMinutes(loadDate.getMinutes() + loadDate.getTimezoneOffset());

  const [date, setDate] = useState<Date>(loadDate);
  const [showDate, setShowDate] = useState(false);

  const handleStartDateChange = (selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCategoryChange = (found: DropDownSelectFormat) => {
    setIdCategory(found.id);
  };

  const onSubmit = async (payload: IncomesPayloadOnSubmit) => {
    try {
      if (!idCategory) return;

      setLoading(true);

      const dataSend: EditIncomePayload = {
        ...payload,
        categoryId: idCategory,
        date: DateFormat(date, 'YYYY-MM-DD')
      };

      await editIncome(idIncome, dataSend);

      setLoading(false);
      reset();
      Keyboard.dismiss();
      ShowToast();

      navigation.goBack();
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      <SelectOnlyCategory
        searchType={1}
        handleCategoryChange={handleCategoryChange}
        selectedCategoryId={initialCategoryId}
      />

      {/* AMOUNT */}
      <MyInput
        name="amount"
        type="currency"
        control={control}
        label="Ingreso"
        placeholder="0"
        rules={{
          required: 'El ingreso es obligatorio',
          min: { value: 1, message: 'El mínimo valor aceptado es 1' },
          max: {
            value: 99999999,
            message: 'El ingreso no puede superar el valor de 99.999.999'
          }
        }}
        leftIcon="cash"
        autoFocus
      />

      {/* COMMENTARY */}

      <MyInput
        name="commentary"
        type="textarea"
        control={control}
        label="Comentario"
        placeholder="Ej: Nómina, quincena"
        rules={{
          maxLength: {
            value: 200,
            message: 'El comentario no puede superar los 200 caracteres'
          }
        }}
        multiline
        numberOfLines={2}
        maxLength={200}
        leftIcon="text"
      />

      {/* DATE SELECTOR */}
      <DateSelector
        label="Fecha"
        date={date}
        showDatePicker={showDate}
        onPress={() => setShowDate(true)}
        onDateChange={handleStartDateChange}
        onCancel={() => setShowDate(false)}
      />

      {/* BUTTON */}
      {loading ? <MyLoading /> : <MyButton title="Guardar" onPress={handleSubmit(onSubmit)} />}
    </View>
  );
}
