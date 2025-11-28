import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
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
      amount: objectIncome.cost.toString(),
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
        amount: parseInt(payload.amount),
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
      <Controller
        name="amount"
        control={control}
        rules={{
          required: { value: true, message: 'El ingreso es obligatorio' },
          min: { value: 1, message: 'Valor mínimo: 1' },
          max: { value: 99999999, message: 'Máximo permitido: 99.999.999' }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Ingreso"
            value={value}
            placeholder="Ej: 20000"
            onChangeText={onChange}
            keyboardType="numeric"
            inputStyle={{ color: colors.TEXT_PRIMARY }}
            labelStyle={{ color: colors.TEXT_PRIMARY }}
            placeholderTextColor={colors.GRAY}
            errorStyle={{ color: colors.ERROR }}
            errorMessage={errors.amount?.message}
            inputContainerStyle={{
              borderBottomColor: colors.GRAY
            }}
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
            message: 'Máximo 200 caracteres'
          }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Comentario"
            value={value}
            placeholder="Ej: Nómina, quincena"
            onChangeText={onChange}
            multiline
            numberOfLines={3}
            inputStyle={{ color: colors.TEXT_PRIMARY }}
            labelStyle={{ color: colors.TEXT_PRIMARY }}
            placeholderTextColor={colors.GRAY}
            errorStyle={{ color: colors.ERROR }}
            errorMessage={errors.commentary?.message}
            inputContainerStyle={{
              borderBottomColor: colors.GRAY
            }}
          />
        )}
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

