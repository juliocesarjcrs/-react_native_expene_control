import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { Input } from "react-native-elements";
import { Errors } from "~/utils/Errors";
import MyLoading from "~/components/loading/MyLoading";
import MyButton from "~/components/MyButton";
import { passwordRecovery } from "../../services/auth";
import { useSelector } from "react-redux";
import ShowToast from '../../components/toast/ShowToast';

export default function ResetPasswordScreen({navigation}) {
    const {
        handleSubmit,
        control,

        formState: {
            errors,
        },
    } = useForm({
        defaultValues: { password: "" },
    });
    const [loading, setLoading] = useState(false);
    const user = useSelector((state) => state.auth.user);

    const onSubmit = async (payload) => {
        try {
            setLoading(true);
            const { data } = await passwordRecovery(user.id, payload);
            setLoading(false);
            if (data.user) {
                ShowToast();
                navigation.navigate("login");
            }
        } catch (error) {
            setLoading(false);
            Errors(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text>
                Ingrese su nueva contraseña
            </Text>
            <Controller
                name="password"
                control={control}
                rules={{
                    required: {
                        value: true,
                        message: "La contraseña es obligatorio",
                    },
                    minLength: {
                      value: 3,
                      message: "La contraseña debe tener mínimo 4 caracteres",
                  },
                }}
                render={({ field: { onChange , value  } }) => (
                    <Input
                        value={value}
                        placeholder="Password"
                        onChangeText={(text) => onChange(text)}
                        secureTextEntry={true}
                        errorStyle={{ color: "red" }}
                        errorMessage={errors?.password?.message}
                    />
                )}
                defaultValue=""
            />
            {loading ? (
                <MyLoading />
            ) : (
                <MyButton
                    onPress={handleSubmit(onSubmit)}
                    title="Restaurar contraseña"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
});
