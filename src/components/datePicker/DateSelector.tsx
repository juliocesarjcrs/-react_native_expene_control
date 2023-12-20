import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { DateFormat } from '../../utils/Helpers';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateSelectorProps {
  label: string;
  date: Date;
  showDatePicker: boolean;
  onPress: () => void;
  onDateChange: (date: Date) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ label, date, showDatePicker, onPress, onDateChange }) => (
  <View style={styles.containerDate}>
    <Button
      icon={<Icon type="material-community" name="calendar" size={15} color="white" />}
      title={
        <>
          <Text style={styles.buttonLabel} numberOfLines={2} ellipsizeMode="tail">
            {label}
          </Text>
          <Text style={styles.buttonDate}>{DateFormat(date, 'YYYY MMM DD')}</Text>
        </>
      }
      onPress={onPress}
    />
    {showDatePicker && (
      <DateTimePicker value={date} mode="date" onChange={(event, selectedDate) => onDateChange(selectedDate || date)} />
    )}
  </View>
  // <View style={styles.containerDate}>
  //   <Button
  //     icon={<Icon type="material-community" name="calendar" size={10} color="white" />}
  //     title={` ${label}`}
  //     onPress={onPress}
  //   />
  //   <Text style={styles.textDate}>{DateFormat(date, 'YYYY MMM DD')}</Text>
  //   {showDatePicker && (
  //     <DateTimePicker value={date} mode="date" onChange={(event, selectedDate) => onDateChange(selectedDate || date)} />
  //   )}
  // </View>
);
const styles = StyleSheet.create({
  containerDate: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    color: 'white',
  },
  buttonDate: {
    marginLeft: 5,
    paddingVertical: 5,
    paddingHorizontal: 5,
    color: 'white',
    backgroundColor: '#c5c5c5',
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: 'white',
    backgroundColor: '#c5c5c5'
  }
});

export default DateSelector;
