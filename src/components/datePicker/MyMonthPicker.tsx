import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { DateFormat } from '../../utils/Helpers';
import { Button, Icon } from 'react-native-elements';

import { useDispatch, useSelector } from 'react-redux';
import { setMonth } from '../../features/date/dateSlice';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
// Types
import { RootState } from '../../shared/types/reducers';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';

const MyMonthPicker: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const month = useSelector((state: RootState) => state.date.month);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    // Crear un nuevo mes con formato "YYYY-MM-01"
    const formattedDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-01`;

    // Enviar el mes al estado global
    console.log('formattedDate  new', formattedDate);

    dispatch(setMonth(formattedDate));

    // Cerrar el selector
    hideDatePicker();
  };
  return (
    <SafeAreaView>
      <Button
        icon={<Icon type="material-community" name="calendar" size={25} color="white" />}
        iconPosition="left"
        title={` Mes: ${DateFormat(month, 'MMMM YYYY')}`}
        onPress={showDatePicker}
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </SafeAreaView>
  );
};

export default MyMonthPicker;
