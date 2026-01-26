import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { CreateIncome } from '../../services/incomes';

// Components
import MyLoading from '../../components/loading/MyLoading';
import ErrorText from '../../components/ErrorText';
import MyButton from '~/components/MyButton';
import { ShowToast } from '~/utils/toastUtils';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';

// Types
import { IncomeStackParamList } from '../../shared/types';
import { CreateIncomePayload } from '../../shared/types/services/income-service.type';

// Utils
import { DateFormat } from '../../utils/Helpers';
import { showError } from '~/utils/showError';

// Styles
import { DateSelector } from '../../components/datePicker';
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import { DropDownSelectFormat } from '../../shared/types/components';
import { IncomesPayloadOnSubmit } from '~/shared/types/screens/incomes';
import { commonStyles } from '~/styles/common';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type CreateIncomeScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;

interface CreateIncomeScreenProps {
  navigation: CreateIncomeScreenNavigationProp;
}

export default function CreateIncomeScreen({ navigation }: CreateIncomeScreenProps) {
  const config = screenConfigs.createIncome;
  const colors = useThemeColors();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { amount: 0, commentary: '' }
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
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <SelectOnlyCategory searchType={1} handleCategoryChange={handleCategoryChange} />

      {!categoryId ? <ErrorText msg="Necesita una categoria de ingresos" /> : null}

      {/* AMOUNT */}
      <MyInput
        name="amount"
        type="currency"
        control={control}
        label="Gasto"
        placeholder="0"
        rules={{
          required: { value: true, message: 'El costo es obligatorio' },
          min: { value: 1, message: 'El mínimo valor aceptado es 1' },
          max: { value: 99999999, message: 'El ingreso no puede superar 99.999.999' }
        }}
        leftIcon="cash"
      />

      {/* COMMENTARY */}
      <MyInput
        name="commentary"
        type="textarea"
        control={control}
        label="Comentario"
        placeholder="Ej: Nómina, quincena"
        rules={{
          maxLength: { value: 200, message: 'El comentario no puede superar 200 caracteres' }
        }}
        multiline
        numberOfLines={2}
        maxLength={200}
        leftIcon="text"
      />

      <DateSelector
        label="Fecha"
        date={date}
        showDatePicker={showDate}
        onPress={() => setShowDate(true)}
        onDateChange={handleStartDateChange}
        onCancel={() => setShowDate(false)}
      />

      {loading ? <MyLoading /> : <MyButton title="Guardar" onPress={handleSubmit(onSubmit)} />}
    </View>
  );
}
