import React from "react";
import {StyleSheet, View} from 'react-native';
import MRow from './MRow';
import MyHead from './MyHead';

const MyTable = ({ navigation, tableHead, tableData }) => {

    return (
        <View>
            <MyHead borderStyle={{ borderWidth: 2, borderColor: "#c8e1ff" }}data={tableHead}></MyHead>
            { tableData.map((e,idx) =>{
                return  <MRow key={idx} data={e} ></MRow>
            })}
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
