import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import { CreateIncome } from '../../services/incomes';

// Components
import MyLoading from '../../components/loading/MyLoading';
import ErrorText from '../../components/ErrorText';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';
import CommentaryInput from '~/components/CommentaryInput';

// Types
import { IncomeStackParamList } from '../../shared/types';
import { CreateIncomePayload } from '../../shared/types/services/income-service.type';
import { DropDownSelectFormat } from '~/shared/types/components';
import { IncomesPayloadOnSubmit } from '~/shared/types/screens/incomes';

// Utils
import { DateFormat } from '../../utils/Helpers';
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { saveCommentaryToHistory } from '~/utils/commentary/commentaryHistory.utils';
import { saveTemplateConfig } from '~/utils/commentary/templateStorage.utils';
import { getDefaultTemplateConfig } from '~/utils/commentary/commentaryTemplates.utils';
import { useFeatureFlag } from '~/contexts/FeatureFlagsContext';

// Components
import { DateSelector } from '../../components/datePicker';
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';

// Styles
import { commonStyles } from '~/styles/common';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type CreateIncomeScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;

interface CreateIncomeScreenProps {
  navigation: CreateIncomeScreenNavigationProp;
}

/**
 * Offset para evitar colisión de IDs entre categorías de ingresos
 * y subcategorías de gastos en AsyncStorage.
 * categoryId 554 → commentaryId 100554
 */
const INCOME_CATEGORY_OFFSET = 100_000;

export default function CreateIncomeScreen({ navigation }: CreateIncomeScreenProps) {
  const config = screenConfigs.createIncome;
  const colors = useThemeColors();
  const { isEnabled: isCommentarySuggestionsEnabled } = useFeatureFlag('commentary_suggestions');

  const { handleSubmit, control, reset, watch, setValue } = useForm({
    defaultValues: { amount: 0, commentary: '' }
  });

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // DATE PICKER
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  // ID con offset para evitar colisión con subcategorías de gastos
  const incomeCommentaryId = categoryId ? categoryId + INCOME_CATEGORY_OFFSET : null;

  const commentaryValue: string = watch('commentary') ?? '';

  const handleStartDateChange = (selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCategoryChange = async (foundCategory: DropDownSelectFormat) => {
    setCategoryId(foundCategory.id);
    setCategoryName(foundCategory.label ?? '');
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

      // Guardar comentario en historial para sugerencias futuras
      if (payload.commentary?.trim() && incomeCommentaryId) {
        saveCommentaryToHistory(
          incomeCommentaryId,
          payload.commentary,
          parseInt(String(payload.amount)),
          DateFormat(date, 'YYYY-MM-DD')
        );
      }

      // Registrar config de la categoría en AsyncStorage para Settings > Plantillas
      if (incomeCommentaryId && categoryName) {
        const existingConfig = await AsyncStorage.getItem(`template_config_${incomeCommentaryId}`);
        if (!existingConfig) {
          const defaultConfig = getDefaultTemplateConfig(
            incomeCommentaryId,
            categoryName,
            'Ingresos' // categoryName para ingresos actúa como categoría padre
          );
          saveTemplateConfig({ ...defaultConfig, isCustomized: false });
        }
      }

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
        label="Monto"
        placeholder="0"
        rules={{
          required: { value: true, message: 'El monto es obligatorio' },
          min: { value: 1, message: 'El mínimo valor aceptado es 1' },
          max: { value: 99999999, message: 'El ingreso no puede superar 99.999.999' }
        }}
        leftIcon="cash"
      />

      {/* COMMENTARY — inteligente si feature flag activo, simple si no */}
      {isCommentarySuggestionsEnabled ? (
        <CommentaryInput
          control={control}
          setValue={setValue as (name: string, value: string) => void}
          currentValue={commentaryValue}
          subcategoryId={incomeCommentaryId}
          subcategoryName={categoryName}
          categoryName="Ingresos"
          recentExpenses={[]}
        />
      ) : (
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
      )}

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
