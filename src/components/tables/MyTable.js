import React from "react";
import {StyleSheet, View} from 'react-native';
import {
    Table,
    Row,
    Rows,
} from "react-native-table-component";

const MyTable = ({ navigation, tableHead, tableData }) => {

    return (
        <View>
            <Table borderStyle={{ borderWidth: 2, borderColor: "#c8e1ff" }}>
                <Row
                    data={tableHead}
                    style={styles.head}
                    textStyle={styles.text}
                />
                <Rows data={tableData} textStyle={styles.text} />
            </Table>
        </View>
    );
};
const styles = StyleSheet.create({
    iconHeader: {
        paddingHorizontal: 10,
    },
    head: { height: 40, backgroundColor: "#f1f8ff" },
    text: { margin: 6 },
});

export default MyTable;
