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
  onDateChange: (date?: Date) => void;
  onCancel?: () => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  label,
  date,
  showDatePicker,
  onPress,
  onDateChange,
  onCancel
}) => (
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
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={(event, selectedDate?: Date) => {
          if (event.type === 'set') {
            // Usuario seleccionó una fecha
            onDateChange(selectedDate);
          } else {
            // Usuario canceló
            if (onCancel) onCancel();
          }
        }}
      />
    )}
  </View>
);
const styles = StyleSheet.create({
  containerDate: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'center'
  },
  buttonLabel: {
    fontSize: 14,
    color: 'white'
  },
  buttonDate: {
    marginLeft: 5,
    paddingVertical: 5,
    paddingHorizontal: 5,
    color: 'white',
    backgroundColor: '#c5c5c5'
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: 'white',
    backgroundColor: '#c5c5c5'
  }
});

export default DateSelector;
