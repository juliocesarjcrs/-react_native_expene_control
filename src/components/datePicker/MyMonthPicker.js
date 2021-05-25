import React, { useState, useCallback } from 'react';
import { View, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import {DateFormat} from '../../utils/Helpers';
import { Button, Icon } from "react-native-elements";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch, useSelector } from "react-redux";
import {setMonthAction} from '../../actions/DateActions';

const MyMonthPicker = () =>{
  const dispatch = useDispatch();
  const month = useSelector((state) => state.date.month);
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    let newDate = DateFormat(currentDate, "DD MMM YYYY");

    setDate(currentDate);
    const newMonth = DateFormat(currentDate, 'YYYY-MM-DD')
    dispatch(setMonthAction(newMonth));
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
      <Text>{DateFormat(month, "MMMM-YYYY")}</Text>
      {/* <Text>{month}</Text> */}
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