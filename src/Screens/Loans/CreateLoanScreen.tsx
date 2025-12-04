import React, { useEffect, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@apollo/client/react';
import { Input } from 'react-native-elements';

// Graphql
import { GET_LOANS } from '../../graphql/queries';
import { CREATE_LOAN } from '../../graphql/mutations';

// Components
import FlatListLoans from './components/FlatListLoans';
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { ScreenHeader } from '~/components/ScreenHeader';

// Utils
import { showError } from '~/utils/showError';

// Types
import { GetLoanResult } from '../../shared/types/graphql';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

export default function CreateLoanScreen() {
  const config = screenConfigs.createLoan;
  const colors = useThemeColors();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState(0);
  const {
    handleSubmit,
    control,
    reset,

    formState: { errors }
  } = useForm({
    defaultValues: { amount: '', commentary: '' }
  });
  const { loading, error, data, refetch } = useQuery<GetLoanResult>(GET_LOANS);
  const [createLoanMutation] = useMutation(CREATE_LOAN);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const onSubmit = async (payload: Record<string, string>) => {
    try {
      setIsSubmitting(true);
      const variables = {
        amount: Number(payload.amount),
        commentary: payload.commentary,
        type
      };
      console.log('varai', variables);
      const { data } = await createLoanMutation({
        variables
      });

      refetch();
      reset();
      Keyboard.dismiss();
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const updateList = async () => {
    await refetch();
  };
  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <RadioButton.Group
        onValueChange={(newValue) => setType(Number(newValue))}
        value={String(type)}
      >
        <View>
          <Text>Tipo préstamo</Text>
          <RadioButton value="0" />
        </View>
        <View>
          <Text>Tipo desface</Text>
          <RadioButton value="1" />
        </View>
      </RadioButton.Group>
      <Controller
        name="amount"
        control={control}
        rules={{
          required: {
            value: true,
            message: 'El préstamo es obligatorio'
          },
          min: { value: 1, message: 'El minimó valor aceptado es 1' },
          max: {
            value: 99999999,
            message: 'El préstamo no puede superar el valor de 99.999.999 '
          },
          validate: (value) => !isNaN(Number(value)) || 'Debe ser un número válido'
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Préstamo"
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
            placeholder="Ej: Préstamo a ..."
            onChangeText={(text) => onChange(text)}
            multiline
            numberOfLines={2}
            errorStyle={{ color: 'red' }}
            errorMessage={errors?.commentary?.message}
          />
        )}
        defaultValue=""
      />

      {loading || isSubmitting ? (
        <MyLoading />
      ) : (
        <MyButton title="Guardar prestamo" onPress={handleSubmit(onSubmit)} variant="primary" />
      )}
      <FlatListLoans loans={data?.loans} updateList={updateList} />
    </View>
  );
}
