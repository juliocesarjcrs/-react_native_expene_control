import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Input } from 'react-native-elements';
import MyLoading from '~/components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import { checkRecoverycode } from '../../services/auth';
import { useSelector } from 'react-redux';
import { showError } from '~/utils/showError';

export default function CheckCodePasswordScreen({ navigation }) {
  const {
    handleSubmit,
    control,

    formState: { errors }
  } = useForm({
    defaultValues: { recoveryCode: '' }
  });
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const onSubmit = async (payload) => {
    try {
      setLoading(true);
      const { data } = await checkRecoverycode(user.id, payload);
      setLoading(false);
      if (data.checkCode) {
        navigation.navigate('resetPassword');
      }
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Ingrese el código de restableciminetoenviado a su dirección de correo electrónico</Text>
      <Controller
        name="recoveryCode"
        control={control}
        rules={{
          required: {
            value: true,
            message: 'El código es obligatorio'
          },
          minLength: {
            value: 4,
            message: 'El código debe tener mínimo 4 caracteres'
          }
        }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Código"
            value={value}
            placeholder="Ej: 1234"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: 'red' }}
            errorMessage={errors?.recoveryCode?.message}
            keyboardType="numeric"
          />
        )}
        defaultValue=""
      />
      {loading ? (
        <MyLoading />
      ) : (
        <MyButton onPress={handleSubmit(onSubmit)} title="Enviar código" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 10
  }
});
