import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@apollo/client/react';

// Graphql
import { GET_LOANS } from '../../graphql/queries';
import { CREATE_LOAN } from '../../graphql/mutations';

// Components
import FlatListLoans from './components/FlatListLoans';
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyInput from '~/components/inputs/MyInput';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';

// Types
import { GetLoanResult } from '../../shared/types/graphql';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

// Form data type
interface LoanFormData {
  amount: number;
  commentary: string;
}

// Mutation variables type
interface CreateLoanVariables {
  amount: number;
  commentary: string;
  type: number;
}

export default function CreateLoanScreen() {
  const config = screenConfigs.createLoan;
  const colors = useThemeColors();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<number>(0);

  const { handleSubmit, control, reset } = useForm<LoanFormData>({
    mode: 'onTouched',
    defaultValues: {
      amount: 0,
      commentary: ''
    }
  });

  const { loading, error, data, refetch } = useQuery<GetLoanResult>(GET_LOANS);
  const [createLoanMutation] = useMutation<unknown, CreateLoanVariables>(CREATE_LOAN);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const onSubmit = async (payload: LoanFormData): Promise<void> => {
    try {
      setIsSubmitting(true);
      const variables: CreateLoanVariables = {
        amount: payload.amount,
        commentary: payload.commentary,
        type
      };

      await createLoanMutation({ variables });

      await refetch();
      reset();
      Keyboard.dismiss();
      ShowToast('Préstamo creado exitosamente');
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateList = async (): Promise<void> => {
    await refetch();
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* Radio buttons para tipo */}
      <View style={styles.radioGroup}>
        <Text style={[styles.radioLabel, { color: colors.TEXT_PRIMARY }]}>Tipo:</Text>
        <RadioButton.Group
          onValueChange={(newValue) => setType(Number(newValue))}
          value={String(type)}
        >
          <View style={styles.radioContainer}>
            <View style={styles.radioOption}>
              <RadioButton.Android value="0" color={colors.PRIMARY} />
              <Text style={[styles.radioText, { color: colors.TEXT_PRIMARY }]}>Préstamo</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Android value="1" color={colors.INFO} />
              <Text style={[styles.radioText, { color: colors.TEXT_PRIMARY }]}>Desfase</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>

      {/* Input de monto */}
      <MyInput
        name="amount"
        type="currency"
        control={control}
        label="Monto"
        placeholder="0"
        rules={{
          required: 'El monto es obligatorio',
          min: { value: 1, message: 'El mínimo valor aceptado es 1' },
          max: {
            value: 99999999,
            message: 'El monto no puede superar el valor de 99.999.999'
          }
        }}
        leftIcon="cash"
        autoFocus
      />

      {/* Input de comentario */}
      <MyInput
        name="commentary"
        type="textarea"
        control={control}
        label="Comentario"
        placeholder="Ej: Préstamo a ..."
        rules={{
          maxLength: {
            value: 200,
            message: 'El comentario no puede superar 200 caracteres'
          }
        }}
        multiline
        numberOfLines={2}
        maxLength={200}
        leftIcon="text"
      />

      {/* Botón de guardar */}
      {loading || isSubmitting ? (
        <MyLoading />
      ) : (
        <MyButton title="Guardar préstamo" onPress={handleSubmit(onSubmit)} variant="primary" />
      )}

      {/* Lista de préstamos */}
      <FlatListLoans loans={data?.loans} updateList={updateList} />
    </View>
  );
}

const styles = StyleSheet.create({
  radioGroup: {
    marginVertical: 8,
    marginBottom: 16
  },
  radioLabel: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginBottom: 8
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  radioText: {
    fontSize: SMALL + 1
  }
});
