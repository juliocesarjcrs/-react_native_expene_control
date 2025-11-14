import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { DateFormat } from '~/utils/Helpers';
import MyButton from '~/components/MyButton';

interface Props {
  label: string;
  onChange: (range: { start: Date; end: Date } | null) => void;
  value?: { start: Date; end: Date } | null;
}

export default function DateRangeSelector({ label, onChange, value }: Props) {
  const colors = useThemeColors();

  const [start, setStart] = useState<Date | null>(value?.start || null);
  const [end, setEnd] = useState<Date | null>(value?.end || null);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Sincronizar con el valor externo cuando cambie
  useEffect(() => {
    if (value === null) {
      setStart(null);
      setEnd(null);
    }
  }, [value]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      if (showPicker === 'start') {
        setStart(selectedDate);
        if (end) {
          onChange({ start: selectedDate, end });
        }
      } else if (showPicker === 'end') {
        setEnd(selectedDate);
        if (start) {
          onChange({ start, end: selectedDate });
        }
      }
    }
    setShowPicker(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.TEXT_PRIMARY, fontWeight: '600', marginBottom: 4 }}>
        {label}
      </Text>

    <MyButton
        title={start ? DateFormat(start, 'DD MMM') : 'Inicio'}
        onPress={() => setShowPicker('start')}
        variant="outline"
        size="small"
        fullWidth
      />

      <MyButton
        title={end ? DateFormat(end, 'DD MMM') : 'Fin'}
        onPress={() => setShowPicker('end')}
        variant="outline"
        size="small"
        fullWidth
        style={{ marginTop: 8 }}
      />

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? start || new Date() : end || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}