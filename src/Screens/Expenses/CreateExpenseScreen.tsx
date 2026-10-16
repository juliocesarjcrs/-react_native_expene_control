import React, { useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import * as Crypto from 'expo-crypto';

// Redux
import { selectSelectedMonth } from '~/features/period/periodSelectors';

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
import MyInput from '~/components/inputs/MyInput';
import CommentaryInput from '~/components/CommentaryInput';
import ExpenseNatureSelector from '~/components/inputs/ExpenseNatureSelector';

// Types
import type { ExpenseModel } from '~/shared/types';
import type { FormExpensesValues } from '~/shared/types/screens/expenses/create-expenses.type';
import type { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import type { SubcategorySelection } from '~/shared/types/components/dropDown/SelectJoinCategory.type';
import type { RecentExpenseForSuggestion } from '~/shared/types/screens/settings/commentary-templates.types';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { DateFormat, NumberFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';
import { saveCommentaryToHistory } from '~/utils/commentary/commentaryHistory.utils';
import { registerDefaultTemplateConfig } from '~/utils/commentary/templateStorage.utils';
import { getDefaultTemplateConfig } from '~/utils/commentary/commentaryTemplates.utils';

// Hooks
import { useAppSelector } from '~/store/hooks';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

// Hooks
import { useFeatureFlag } from '~/contexts/FeatureFlagsContext';
import { createLogger } from '~/utils/logger';

const BASE_CURRENCY = 'COP';
const DATE_API_FORMAT = 'YYYY-MM-DD';
const DEFAULT_NATURE = 'operational';
const MIN_COST = 1;
const MAX_COST = 999999999;
const MAX_COMMENTARY_LENGTH = 200;
const SHADOW_COLOR = '#000';

const sumExpenses = (items: ExpenseModel[]): number =>
  items.reduce((acc, item) => acc + item.cost, 0);

export default function CreateExpenseScreen(): React.JSX.Element {
  const log = createLogger('screen', 'CreateExpense');
  const config = screenConfigs.createExpense;
  const colors = useThemeColors();

  const month = useAppSelector(selectSelectedMonth);
  const { handleSubmit, control, reset, setValue } = useForm<FormExpensesValues>({
    mode: 'onTouched'
  });

  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [subcategoryName, setSubcategoryName] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');

  const { isEnabled: isCommentarySuggestionsEnabled } = useFeatureFlag('commentary_suggestions');

  // El total se deriva de la lista de gastos
  const sumCost = sumExpenses(expenses);

  // Valor actual del comentario para el autocompletado
  const commentaryValue = useWatch({ control, name: 'commentary' }) ?? '';

  // Date picker
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState<boolean>(false);

  const idempotencyKeyRef = useRef<string>(Crypto.randomUUID());

  // Currency converter
  const [currencySymbol] = useState<string>(BASE_CURRENCY);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: colors.BACKGROUND },
        totalContainer: { backgroundColor: colors.CARD_BACKGROUND },
        totalLabel: { color: colors.TEXT_SECONDARY },
        totalAmount: { color: colors.WARNING }
      }),
    [colors]
  );

  const handleStartDateChange = (selectedDate?: Date): void => {
    setShowDate(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showStartDatePicker = (): void => {
    setShowDate(true);
  };

  const fetchExpensesSubcategory = async (
    foundSubcategory: SubcategorySelection
  ): Promise<void> => {
    try {
      setLoading(true);
      setSubcategoryId(foundSubcategory.value);
      setSubcategoryName(foundSubcategory.label ?? '');
      setCategoryName(foundSubcategory.categoryName ?? '');
      const { data } = await getExpensesFromSubcategory(foundSubcategory.value, month);
      setExpenses(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Implementación pendiente
  const fetchExpensesOnlyCategory = (): Promise<void> => Promise.resolve();

  const onSubmit = async (payload: FormExpensesValues): Promise<void> => {
    let newAmount: number | string = payload.cost;

    if (currencySymbol !== BASE_CURRENCY) {
      try {
        const values = {
          amount: parseInt(String(payload.cost), 10),
          from: currencySymbol,
          to: BASE_CURRENCY
        };
        const { data } = await getExchangeCurrency(values);
        newAmount = data.result;
      } catch (error) {
        showError(error);
      }
    }

    if (!subcategoryId) {
      ShowToast('Debes seleccionar una subcategoría');
      return;
    }

    try {
      const finalCost = parseInt(String(newAmount), 10);
      const dateString = DateFormat(date, DATE_API_FORMAT);

      const dataSend: CreateExpensePayload = {
        ...payload,
        cost: finalCost,
        subcategoryId,
        date: dateString,
        nature: payload.nature ?? DEFAULT_NATURE,
        idempotencyKey: idempotencyKeyRef.current
      };

      setLoading(true);
      const { data } = await CreateExpense(dataSend);

      // Guardar comentario en historial local para sugerencias futuras
      if (payload.commentary?.trim()) {
        saveCommentaryToHistory(subcategoryId, payload.commentary, finalCost, dateString);
      }

      // Registrar config de la subcategoría en AsyncStorage para que aparezca
      // en Settings > Plantillas. Usa registerDefaultTemplateConfig (no saveTemplateConfig)
      // para NO marcar isCustomized: true. Siempre sobreescribe para mantener
      // configVersion actualizada y evitar cache obsoleta de producción.
      if (subcategoryName && categoryName) {
        const defaultConfig = getDefaultTemplateConfig(
          subcategoryId,
          subcategoryName,
          categoryName
        );
        registerDefaultTemplateConfig(defaultConfig).catch(() => undefined);
      }

      setExpenses([data, ...expenses]);
      ShowToast('Gasto creado exitosamente');
      reset();
      idempotencyKeyRef.current = Crypto.randomUUID();
      Keyboard.dismiss();
    } catch (error) {
      log.error('failed to save expense', error);
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const submitForm = (): void => {
    void handleSubmit(onSubmit)();
  };

  const fetchExpenses = async (idSubcategory: number): Promise<void> => {
    try {
      const { data } = await getExpensesFromSubcategory(idSubcategory, month);
      setExpenses(data);
    } catch (error) {
      showError(error);
    }
  };

  const updateList = (): void => {
    if (!subcategoryId) {
      return;
    }
    void fetchExpenses(subcategoryId);
  };

  return (
    <View style={[commonStyles.screenContainer, dynamicStyles.screen]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <MyInput
            name="cost"
            type="currency"
            control={control}
            label="Gasto"
            placeholder="0"
            rules={{
              required: 'El gasto es obligatorio',
              min: { value: MIN_COST, message: 'El mínimo valor aceptado es 1' },
              max: { value: MAX_COST, message: 'El gasto no puede superar 999.999.999' }
            }}
            leftIcon="cash"
          />

          <ExpenseNatureSelector control={control} name="nature" />

          {isCommentarySuggestionsEnabled ? (
            <CommentaryInput
              control={control}
              setValue={setValue}
              currentValue={commentaryValue}
              subcategoryId={subcategoryId}
              subcategoryName={subcategoryName}
              categoryName={categoryName}
              recentExpenses={expenses as RecentExpenseForSuggestion[]}
            />
          ) : (
            <MyInput
              name="commentary"
              type="textarea"
              control={control}
              label="Comentario"
              placeholder="Ej: Compra de una camisa"
              rules={{
                maxLength: {
                  value: MAX_COMMENTARY_LENGTH,
                  message: 'El comentario no puede superar 200 caracteres'
                }
              }}
              multiline
              numberOfLines={2}
              maxLength={MAX_COMMENTARY_LENGTH}
              leftIcon="text"
            />
          )}

          <SelectJoinCategory
            fetchExpensesSubcategory={fetchExpensesSubcategory}
            fetchExpensesOnlyCategory={fetchExpensesOnlyCategory}
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
            <MyButton title="Guardar gasto" onPress={submitForm} variant="primary" />
          )}

          {/* Total */}
          <View style={[styles.totalContainer, dynamicStyles.totalContainer]}>
            <Text style={[styles.totalLabel, dynamicStyles.totalLabel]}>Total del mes:</Text>
            <Text style={[styles.totalAmount, dynamicStyles.totalAmount]}>
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
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  totalLabel: {
    fontSize: MEDIUM
  },
  totalAmount: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  }
});
