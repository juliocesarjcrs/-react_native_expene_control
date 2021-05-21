import React from "react";
import {StyleSheet, View} from 'react-native';

import RNPickerSelect from "react-native-picker-select";


const Dropdown = ({ data, sendDataToParent }) => {
  return (
    <View style={styles.container}>
      <RNPickerSelect
        useNativeAndroidPickerStyle={false}
        placeholder={{}}
        onValueChange={(value) => sendDataToParent(value)}
        items={data}
      />

    </View>
  );
};
const styles = StyleSheet.create({
  container : {
    width:300,
      flex            : 1,
      backgroundColor : "#fff",
      alignItems      : "center",
      justifyContent  : "center",
  },
});
export default Dropdown;