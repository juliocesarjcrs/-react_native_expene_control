import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";
import { useDispatch } from "react-redux";
import MyLoading from "~/components/loading/MyLoading";
import { Errors } from "~/utils/Errors";
import { forgotPassword } from "../../services/auth";
import { setUserAction } from "~/actions/authActions";
export default function ForgotPasswordScreen({ navigation }) {
    const EMAIL_REGEX =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const { handleSubmit, control, errors } = useForm({
        defaultValues: { email: "" },
    });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const onSubmit = async (payload) => {
        try {
            setLoading(true);
            const { data } = await forgotPassword(payload);
            setLoading(false);
            dispatch(setUserAction(data.user));
            navigation.navigate("checkCodePassword");
        } catch (error) {
            setLoading(false);
            Errors(error);
        }
    };
    return (
        <View style={styles.container}>
            {loading ? (
                <MyLoading />
            ) : (
                <View style={styles.container2}>
                    <Text>Restablecer su contraseña</Text>
                    <Text>
                        Proporcione la dirección de correo electrónico de su
                        cuenta para solicitar un código de restablecimineto de
                        contraseña. Usted recibirá un código a su dirección de
                        correo electrónico, si este es válido.
                    </Text>
                    <Controller
                        name="email"
                        control={control}
                        rules={{
                            required: {
                                value: true,
                                message: "Email es obligatorio",
                            },
                            pattern: {
                                value: EMAIL_REGEX,
                                message: "Not a valid email",
                            },
                        }}
                        render={({ onChange, value }) => (
                            <Input
                                value={value}
                                placeholder="Email"
                                onChangeText={(text) => onChange(text)}
                                errorStyle={{ color: "red" }}
                                errorMessage={errors?.email?.message}
                            />
                        )}
                        defaultValue=""
                    />
                    {loading ? (
                        <MyLoading />
                    ) : (
                        <MyButton
                            title="Solicitar código de reinicio"
                            onPress={handleSubmit(onSubmit)}
                        />
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
    },
    container2: {
        flexDirection: "column",
        backgroundColor: "#fff",
        margin: 5,
    },
});
