import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { RadioButton } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from '@apollo/client/react';
import { FAB, Input } from "react-native-elements";

// Graphql
import { GET_LOANS } from "../../graphql/queries";
import { CREATE_LOAN } from "../../graphql/mutations";

// Components
import FlatListLoans from "./components/FlatListLoans";
import MyLoading from "../../components/loading/MyLoading";


// Utils
import { Errors } from "../../utils/Errors";

// Types
import { GetLoanResult } from "../../shared/types/graphql";
export default function CreateLoanScreen() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [type, setType] = useState(0);
    const {
        handleSubmit,
        control,
        reset,

        formState: { errors },
    } = useForm({
        defaultValues: { amount: "", commentary: "" },
    });
    const { loading, error, data, refetch } = useQuery<GetLoanResult>(GET_LOANS);
    const [createLoanMutation] = useMutation(CREATE_LOAN);

    useEffect(() => {
        if (error) {
            Errors(error);
        }
    }, [error]);

    const onSubmit = async (payload:  Record<string, string>) => {
        try {
            setIsSubmitting(true);
            const variables = {
                amount: Number(payload.amount),
                commentary: payload.commentary,
                type
            }
            console.log('varai', variables)
            const { data } = await createLoanMutation({
                variables
            });

            refetch();
            reset();
            Keyboard.dismiss();
        } catch (error) {
            Errors(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const updateList = async () => {
        await refetch();
    };
    return (
        <View style={styles.container}>
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
                        message: "El préstamo es obligatorio",
                    },
                    min: { value: 1, message: "El minimó valor aceptado es 1" },
                    max: {
                        value: 99999999,
                        message:
                            "El préstamo no puede superar el valor de 99.999.999 ",
                    },
                    validate: (value) => !isNaN(Number(value)) || "Debe ser un número válido"
                }}
                render={({ field: { onChange, value } }) => (
                    <Input
                        label="Préstamo"
                        value={value}
                        placeholder="Ej: 20000"
                        onChangeText={(text) => onChange(text)}
                        errorStyle={{ color: "red" }}
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
                        message:
                            "El comenatario no puede superar los 200 carácteres ",
                    },
                }}
                render={({ field: { onChange, value } }) => (
                    <Input
                        label="Comentario"
                        value={value}
                        placeholder="Ej: Préstamo a ..."
                        onChangeText={(text) => onChange(text)}
                        multiline
                        numberOfLines={2}
                        errorStyle={{ color: "red" }}
                        errorMessage={errors?.commentary?.message}
                    />
                )}
                defaultValue=""
            />

            {loading || isSubmitting  ? (
                <MyLoading />
            ) : (
                <FAB
                    title="Guardar prestamo"
                    onPress={handleSubmit(onSubmit)}
                />
            )}
            <FlatListLoans loans={data?.loans} updateList={updateList} />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F5F7",
        margin: 8,
    },
    containerDate: {
        display: "flex",
        flexDirection: "row",
        marginVertical: 5,
    },
    textDate: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        color: "white",
        backgroundColor: "#c5c5c5",
    },
    subtitle: {
        fontWeight: "bold",
    },
    rows: {
        backgroundColor: "#F3F5F7",
        flexDirection: "row",
    },
    containerCheckbox: {
        paddingVertical: 2,
    },
});
