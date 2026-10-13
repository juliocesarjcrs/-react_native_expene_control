import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
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

  const [start, setStart] = useState<Date | null>(value?.start ?? null);
  const [end, setEnd] = useState<Date | null>(value?.end ?? null);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  const [prevValue, setPrevValue] = useState(value);

  // Sincronizar con el valor externo: si el padre lo reinicia a null, limpiamos
  // la selección local. Se hace durante el render, no en un efecto.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value === null) {
      setStart(null);
      setEnd(null);
    }
  }

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(null);

    if (event.type !== 'set' || !selectedDate) return;

    const nextStart = showPicker === 'start' ? selectedDate : start;
    const nextEnd = showPicker === 'end' ? selectedDate : end;

    if (showPicker === 'start') setStart(selectedDate);
    if (showPicker === 'end') setEnd(selectedDate);

    // Solo se notifica al padre cuando el rango está completo
    if (nextStart && nextEnd) {
      onChange({ start: nextStart, end: nextEnd });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>{label}</Text>

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
        style={styles.endButton}
      />

      {showPicker && (
        <DateTimePicker
          value={(showPicker === 'start' ? start : end) ?? new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  label: {
    fontWeight: '600',
    marginBottom: 4
  },
  endButton: {
    marginTop: 8
  }
});
