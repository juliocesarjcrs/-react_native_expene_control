import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import dayjs from 'dayjs';

// Components
import { DateSelector } from '~/components/datePicker';
import MyButton from '~/components/MyButton';
import MyChip from '~/components/chip/MyChip';

// Utils
import {
  DEFAULT_PRESET_MONTHS,
  DateRange,
  PeriodPreset,
  getPresetRange
} from '~/utils/periodRange';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface PeriodSelectorProps {
  onChange: (range: DateRange) => void;
}

interface PresetOption {
  value: PeriodPreset;
  label: string;
}

const API_DATE_FORMAT = 'YYYY-MM-DD';

const PRESET_OPTIONS: PresetOption[] = [
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 'custom', label: 'Rango' }
];

export default function PeriodSelector({ onChange }: PeriodSelectorProps) {
  const colors = useThemeColors();
  const [preset, setPreset] = useState<PeriodPreset>(DEFAULT_PRESET_MONTHS);
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState(false);

  const [customStart, setCustomStart] = useState<Date>(() =>
    dayjs().subtract(5, 'month').startOf('month').toDate()
  );
  const [customEnd, setCustomEnd] = useState<Date>(() => new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handlePresetPress = (value: PeriodPreset) => {
    setPreset(value);
    if (value !== 'custom') {
      onChange(getPresetRange(value, includeCurrentMonth));
    }
  };

  const handleIncludeCurrentChange = (value: boolean) => {
    setIncludeCurrentMonth(value);
    if (preset !== 'custom') {
      onChange(getPresetRange(preset, value));
    }
  };

  const handleStartChange = (selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setCustomStart(selectedDate);
    }
  };

  const handleEndChange = (selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setCustomEnd(selectedDate);
    }
  };

  const handleApplyCustom = () => {
    if (dayjs(customStart).isAfter(customEnd, 'day')) {
      Alert.alert('Rango inválido', 'La fecha inicial no puede ser posterior a la final');
      return;
    }
    onChange({
      startDate: dayjs(customStart).format(API_DATE_FORMAT),
      endDate: dayjs(customEnd).format(API_DATE_FORMAT)
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: colors.TEXT_SECONDARY }]}>Periodo</Text>

      <View style={styles.segmentRow}>
        {PRESET_OPTIONS.map((option) => (
          <MyChip
            key={String(option.value)}
            label={option.label}
            selected={preset === option.value}
            onPress={() => handlePresetPress(option.value)}
            style={styles.segment}
          />
        ))}
      </View>

      {preset !== 'custom' && (
        <View style={styles.switchRow}>
          <View style={styles.switchTexts}>
            <Text style={[styles.switchTitle, { color: colors.TEXT_PRIMARY }]}>
              Incluir mes en curso
            </Text>
            <Text style={[styles.caption, { color: colors.TEXT_SECONDARY }]}>
              {includeCurrentMonth
                ? 'El mes en curso está incompleto y baja el promedio'
                : 'Solo meses completos'}
            </Text>
          </View>
          <Switch
            value={includeCurrentMonth}
            onValueChange={handleIncludeCurrentChange}
            trackColor={{ false: colors.BORDER, true: colors.PRIMARY }}
            ios_backgroundColor={colors.BORDER}
            thumbColor={colors.WHITE}
          />
        </View>
      )}

      {preset === 'custom' && (
        <View style={styles.customContainer}>
          <View style={styles.dateRow}>
            <DateSelector
              label="Fecha Inicial"
              date={customStart}
              showDatePicker={showStartPicker}
              onPress={() => setShowStartPicker(true)}
              onDateChange={handleStartChange}
              onCancel={() => setShowStartPicker(false)}
            />
            <DateSelector
              label="Fecha Final"
              date={customEnd}
              showDatePicker={showEndPicker}
              onPress={() => setShowEndPicker(true)}
              onDateChange={handleEndChange}
              onCancel={() => setShowEndPicker(false)}
            />
          </View>
          <Text style={[styles.caption, styles.centered, { color: colors.TEXT_SECONDARY }]}>
            Se incluyen los meses completos de ambas fechas
          </Text>
          <MyButton title="Aplicar" onPress={handleApplyCustom} variant="secondary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  sectionLabel: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8
  },
  segment: {
    flex: 1,
    paddingHorizontal: 4
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  switchTexts: {
    flex: 1
  },
  switchTitle: {
    fontSize: MEDIUM - 2,
    fontWeight: '500'
  },
  caption: {
    fontSize: SMALL,
    marginTop: 2
  },
  centered: {
    textAlign: 'center'
  },
  customContainer: {
    gap: 4
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8
  }
});
