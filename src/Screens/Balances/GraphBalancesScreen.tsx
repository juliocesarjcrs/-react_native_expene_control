import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";

// Components
import GraphIncomesByCategory from "./components/GraphIncomesByCategory";
import GraphBySubcategory from "./components/GraphBySubcategory";

interface GraphBalancesScreenProps {
    navigation: any;
  }


export default function GraphBalancesScreen({ navigation } : GraphBalancesScreenProps) {
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
