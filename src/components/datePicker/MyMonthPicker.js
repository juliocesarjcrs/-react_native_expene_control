import React, { useState } from "react";
import { SafeAreaView } from "react-native";
import { DateFormat } from "../../utils/Helpers";
import { Button, Icon } from "react-native-elements";

import { useDispatch, useSelector } from "react-redux";
import { setMonthAction } from "../../actions/DateActions";
import DatePicker, { getToday } from "react-native-modern-datepicker";

const MyMonthPicker = () => {
  const dispatch = useDispatch();
  const month = useSelector((state) => state.date.month);
  const [date, setDate] = useState(getToday());
  const [show, setShow] = useState(false);

  const onChange = (selectedDate) => {
    const currentDate = selectedDate.replace(" ", "/") || date;
    setDate(currentDate);
    const newMonth = selectedDate + "-01";
    let res = newMonth.replace(" ", "-");
    dispatch(setMonthAction(res));
    setShow(false);
  };
  const showMode = (currentMode) => {
    setShow(true);
  };
  return (
    <SafeAreaView>
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
        title={` Mes: ${DateFormat(month, "MMMM YYYY")}`}
        onPress={showMode}
      />

      {show && (
        <DatePicker
          mode="monthYear"
          selectorStartingYear={2000}
          current={date}
          onMonthYearChange={onChange}
        />
      )}
    </SafeAreaView>
  );
};

export default MyMonthPicker;
