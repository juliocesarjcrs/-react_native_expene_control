import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Button, Icon } from 'react-native-elements';

// Redux
import { selectSelectedMonth } from '~/features/period/periodSelectors';

// Components
import MyButton from '../MyButton';

// Utils
import { DateFormat } from '../../utils/Helpers';

// Hooks
import { useThemeColors } from '~/customHooks/useThemeColors';
import { useAppDispatch, useAppSelector } from '~/store/hooks';

// Types
import { ThemeColors } from '~/shared/types/services/theme-config-service.type';
import { setSelectedMonth } from '~/features/period/periodSlice';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const MyMonthPicker = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const month = useAppSelector(selectSelectedMonth);

  const [visible, setVisible] = useState(false);

  // Parseo directo del string para evitar problemas de zona horaria
  const [yearStr, monthStr] = month.split('-');
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10) - 1;

  const [year, setYear] = useState(currentYear);

  const handleSelect = (index: number) => {
    const formatted = `${year}-${(index + 1).toString().padStart(2, '0')}-01`;
    dispatch(setSelectedMonth(formatted));
    setVisible(false);
  };

  return (
    <View style={{ paddingHorizontal: 12 }}>
      <MyButton
        title={` Mes: ${DateFormat(month, 'MMMM YYYY')}`}
        onPress={() => setVisible(true)}
        variant="primary"
        icon={<Icon type="material-community" name="calendar" size={25} color="white" />}
      />

      <Modal transparent visible={visible} animationType="fade">
        <View style={styles(colors).backdrop}>
          <View style={styles(colors).modal}>
            {/* Selector de año */}
            <View style={styles(colors).yearContainer}>
              <TouchableOpacity onPress={() => setYear(year - 1)}>
                <Text style={styles(colors).arrow}>‹</Text>
              </TouchableOpacity>

              <Text style={styles(colors).yearText}>{year}</Text>

              <TouchableOpacity onPress={() => setYear(year + 1)}>
                <Text style={styles(colors).arrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Selector de meses */}
            <View style={styles(colors).monthGrid}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles(colors).monthItem,
                    i === currentMonth && year === currentYear && styles(colors).selected
                  ]}
                  onPress={() => handleSelect(i)}
                >
                  <Text style={styles(colors).monthText} numberOfLines={1} adjustsFontSizeToFit>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Cerrar" type="clear" onPress={() => setVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)'
    },
    modal: { backgroundColor: colors.CARD_BACKGROUND, borderRadius: 10, padding: 20, width: '85%' },

    yearContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15
    },
    arrow: { fontSize: 28, marginHorizontal: 20, color: colors.TEXT_PRIMARY },
    yearText: { fontSize: 20, fontWeight: 'bold', color: colors.TEXT_PRIMARY },

    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

    monthItem: {
      flexBasis: '30%',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.GRAY,
      marginVertical: 6,
      alignItems: 'center',
      justifyContent: 'center'
    },

    selected: {
      backgroundColor: colors.PRIMARY
    },

    monthText: {
      color: colors.TEXT_PRIMARY,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center'
    }
  });

export default MyMonthPicker;
