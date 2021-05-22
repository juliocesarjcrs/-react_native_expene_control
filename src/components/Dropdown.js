import React from "react";
import RNPickerSelect from "react-native-picker-select";

const Dropdown = ({ data, sendDataToParent }) => {
  return (
      <RNPickerSelect
        useNativeAndroidPickerStyle={false}
        placeholder={{}}
        onValueChange={(value) => sendDataToParent(value)}
        items={data}
      />
  );
};

export default Dropdown;