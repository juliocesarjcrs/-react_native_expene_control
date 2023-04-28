import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import GraphBySubcategory from "~/Screens/Balances/components/GraphBySubcategory";
import GraphIncomesByCategory from "./components/GraphIncomesByCategory";

export default function GraphBalancesScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <ScrollView>
                <GraphBySubcategory navigation={navigation} />
                <GraphIncomesByCategory navigation={navigation} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 10,
    },
});
