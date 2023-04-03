import React from "react";

import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Icon, Tooltip } from "react-native-elements";
import { deleteOneLoan } from "../../../services/loans";
import { DateFormat, NumberFormat } from "../../../utils/Helpers";
import { Errors } from "../../../utils/Errors";
import { ICON, PRIMARY } from "../../../styles/colors";
import { MEDIUM, SMALL } from "../../../styles/fonts";

const FlatListLoans = ({ loans, updateList }) => {
    const ListLoan = ({ item }) => {
        const deleteItem = async (idLoan) => {
            try {
                await deleteOneLoan(idLoan);
                updateList();
            } catch (e) {
                Errors(e);
            }
        };
        const createTwoButtonAlert = (id) =>
            Alert.alert("Eliminar", "¿Desea eliminar este préstamo?", [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                { text: "OK", onPress: () => deleteItem(id) },
            ]);
        return (
            <View style={styles.header}>
                <Tooltip popover={<Text>{item.commentary}</Text>}>
                    <Text style={styles.title}>{NumberFormat(item.loan)}</Text>
                </Tooltip>
                <Text style={styles.title}>
                    {item.type === 0 ? "Préstamo" : "Desfase"}
                </Text>

                <Text style={styles.item}>
                    {DateFormat(item.date, "DD MMM")}{" "}
                    {DateFormat(item.createdAt, "hh:mm a")}
                </Text>
                <Icon
                    type="material-community"
                    style={{ paddingRight: 15 }}
                    name="trash-can"
                    size={20}
                    color={ICON}
                    onPress={() => createTwoButtonAlert(item.id)}
                />
            </View>
        );
    };
    const styles = StyleSheet.create({
        header: {
            display: "flex",
            flexDirection: "row",
            // width: 300,
            backgroundColor: PRIMARY,
            padding: 5,
            // alignItems: "center",
            justifyContent: "space-between",
        },
        title: {
            color: "white",
            fontSize: MEDIUM,
            padding: 2,
        },
        item: {
            padding: 2,
            color: "white",
            fontSize: SMALL,
        },
    });
    return (
        <FlatList
            keyExtractor={(item) => item.id.toString()}
            data={loans}
            renderItem={ListLoan}
        ></FlatList>
    );
};

export default FlatListLoans;
