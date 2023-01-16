import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { login } from "~/services/auth";
import { useDispatch } from "react-redux";
import { setUserAction, setAuthAction } from "~/actions/authActions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";
import { useSelector } from "react-redux";
import MyLoading from "~/components/loading/MyLoading";

export default function LoginScreen({ navigation }) {

    const EMAIL_REGEX =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const { handleSubmit, control, errors } = useForm();
    const loadingAuth = useSelector((state) => {
        return state.auth.loadingAuth;
    });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const onSubmit = async (payload) => {
        try {
            setLoading(true);
            const { data } = await login(payload);
            setLoading(false);
            await AsyncStorage.setItem("access_token", data.access_token);
            const jsonValue = JSON.stringify(data.user);
            await AsyncStorage.setItem("user", jsonValue);
            dispatch(setUserAction(data.user));
            dispatch(setAuthAction(true));
        } catch (error) {
            setLoading(false);
            dispatch(setUserAction(null));
            dispatch(setAuthAction(false));
        }
    };
    return (
        <View style={styles.container}>
            {loadingAuth ? (
                <MyLoading />
            ) : (
                <View style={styles.container2}>
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
                        // render={({ onChange, value }) => (
                            render={({ field: { onChange, value } }) => (
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
                    <Controller
                        name="password"
                        control={control}
                        rules={{
                            required: {
                                value: true,
                                message: "La contraseña es obligatorio",
                            },
                        }}
                        // render={({ onChange, value }) => (
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
                            title="Iniciar sesión"
                            onPress={handleSubmit(onSubmit)}
                        />
                     )}

                    <MyButton
                        title="Recuperar contraseña"
                        onPress={() => {
                            navigation.navigate("forgotPassword");
                        }}
                    />
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
        backgroundColor: "#fff"
    },
});
