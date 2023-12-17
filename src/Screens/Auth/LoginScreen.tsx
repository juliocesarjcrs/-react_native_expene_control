import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Input } from "react-native-elements";
import { useSelector } from "react-redux";

import {Errors} from '../../utils/Errors';
import ShowToast from '../../components/toast/ShowToast';
import { StackNavigationProp } from "@react-navigation/stack";

// Services
import { login } from "../../services/auth";

// Types
import { PayloadLogin } from "../../shared/types/services";
import { setIsAuthAction, setUserAction } from "../../actions/authActions";

// Components
import MyLoading from "../../components/loading/MyLoading";
import MyButton from "../../components/MyButton";
import { AuthStackParamList } from "../../shared/types";
import { RootState } from "../../shared/types/reducers";

interface LoginFormData {
    email: string;
    password: string;
  }
  type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'login'>;

  interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
  }

export default function LoginScreen({ navigation } : LoginScreenProps)  {

    const EMAIL_REGEX =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const {
        handleSubmit,
        control,

        formState: {
            errors,
        },
    } = useForm<LoginFormData>();
    const loadingAuth = useSelector((state: RootState) => {
        return state.auth.loadingAuth;
    });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const onSubmit = async (payload: PayloadLogin) => {
        try {
            setLoading(true);
            const { data } = await login(payload);
            ShowToast('reponde ok login');
            setLoading(false);
            await AsyncStorage.setItem("access_token", data.access_token);
            const jsonValue = JSON.stringify(data.user);
            await AsyncStorage.setItem("user", jsonValue);
            dispatch(setUserAction(data.user));
            dispatch(setIsAuthAction(true));
        } catch (error) {
            if (typeof error === 'string') {
                ShowToast(`Error: ${error}`);
            } else if (typeof error === 'object' && error !== null) {
                const errorMessage = error.toString ? error.toString() : 'Unknown error';
                ShowToast(`Obj: ${errorMessage}`);
            } else {
                ShowToast('Unknown error');
            }
            setLoading(false);
            dispatch(setUserAction(null));
            dispatch(setIsAuthAction(false));
            Errors(error);
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
