import React, { useState, useCallback } from 'react';
import { View, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import {DateFormat} from '../../utils/Helpers';
import { Button, Icon } from "react-native-elements";
import DateTimePicker from "@react-native-community/datetimepicker";


const MyMonthPicker = () =>{
  const [date, setDate] = useState(new Date());
  const today = DateFormat(new Date(), "DD MMM YYYY");
  const [dateString, setDateString] = useState(today);
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    // console.log('onChange', selectedDate, date);
    const currentDate = selectedDate || date;

    setShow(Platform.OS === "ios");
    let newDate = DateFormat(currentDate, "DD MMM YYYY");
    setDateString(newDate);
    console.log("currentDate", currentDate, newDate);
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  }

  return (
    <SafeAreaView>
      <Text>{DateFormat(date, "MMMM-YYYY")}</Text>
      <Button
            icon={
              <Icon
                type="material-community"
                name="calendar"
                size={25}
                color="white"
              />
            }
            iconLeft
            title="  Mes "
            onPress={showMode}
          />
     {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </SafeAreaView>
  );

}

export default MyMonthPicker;