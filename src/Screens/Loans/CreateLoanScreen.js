import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import MyLoading from "~/components/loading/MyLoading";
import { FAB, Input } from "react-native-elements";
import { CreateLoan, GetLoans } from "../../services/loans";
import { Errors } from "../../utils/Errors";
import FlatListLoans from "./components/FlatListLoans";
import { RadioButton } from "react-native-paper";
export default function CreateLoanScreen() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState(0);
    const {
        handleSubmit,
        control,
        reset,

        formState: { errors },
    } = useForm({
        defaultValues: { loan: "", commentary: "" },
    });

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const { data } = await GetLoans();
            setLoans(data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            Errors(error);
        }
    };

    const onSubmit = async (payload) => {
        try {
            setLoading(true);
            const dataTransform = {
                ...payload,
                id: loans.length + 1,
                date: new Date(),
                createdAt: new Date(),
                type,
            };
            await CreateLoan(dataTransform);
            fetchLoans();
            setLoading(false);
            reset();
            Keyboard.dismiss();
        } catch (error) {
            setLoading(false);
            Errors(error);
        }
    };
    const updateList = () => {
        fetchLoans();
    };
    return (
        <View style={styles.container}>
            <RadioButton.Group
                onValueChange={(newValue) => setType(newValue)}
                value={type}
            >
                <View>
                    <Text>Tipo préstamo</Text>
                    <RadioButton value={0} />
                </View>
                <View>
                    <Text>Tipo desface</Text>
                    <RadioButton value={1} />
                </View>
            </RadioButton.Group>
            <Controller
                name="loan"
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
                }}
                render={({ field: { onChange, value } }) => (
                    <Input
                        label="Préstamo"
                        value={value}
                        placeholder="Ej: 20000"
                        onChangeText={(text) => onChange(text)}
                        errorStyle={{ color: "red" }}
                        errorMessage={errors?.loan?.message}
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

            {loading ? (
                <MyLoading />
            ) : (
                <FAB
                    title="Guardar prestamo"
                    onPress={handleSubmit(onSubmit)}
                />
            )}
            <FlatListLoans loans={loans} updateList={updateList} />
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
