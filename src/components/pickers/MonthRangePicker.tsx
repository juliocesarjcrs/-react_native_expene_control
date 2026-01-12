import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { ThemeColors } from '~/shared/types/services/theme-config-service.type';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MONTH_NAMES_FULL = [
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

interface MonthRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  label?: string;
}

export const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Período de Análisis'
}) => {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = new Date(year, monthIndex, 1);

    if (selectingStart) {
      setTempStartDate(selectedDate);
      // Si la fecha de inicio es posterior a la de fin, ajustar la de fin
      if (selectedDate > tempEndDate) {
        setTempEndDate(selectedDate);
      }
      setSelectingStart(false);
    } else {
      // Si la fecha de fin es anterior a la de inicio, ajustar la de inicio
      if (selectedDate < tempStartDate) {
        setTempStartDate(selectedDate);
      }
      setTempEndDate(selectedDate);
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
    setVisible(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setVisible(false);
    setSelectingStart(true);
  };

  const isMonthInRange = (monthIndex: number, checkYear: number): boolean => {
    const checkDate = new Date(checkYear, monthIndex, 1);
    return checkDate >= tempStartDate && checkDate <= tempEndDate;
  };

  const isStartMonth = (monthIndex: number, checkYear: number): boolean => {
    return tempStartDate.getMonth() === monthIndex && tempStartDate.getFullYear() === checkYear;
  };

  const isEndMonth = (monthIndex: number, checkYear: number): boolean => {
    return tempEndDate.getMonth() === monthIndex && tempEndDate.getFullYear() === checkYear;
  };

  const getMonthCount = (): number => {
    const months =
      (tempEndDate.getFullYear() - tempStartDate.getFullYear()) * 12 +
      (tempEndDate.getMonth() - tempStartDate.getMonth()) +
      1;
    return months;
  };

  const formatRangeDisplay = (): string => {
    const startMonth = MONTH_NAMES_FULL[startDate.getMonth()];
    const endMonth = MONTH_NAMES_FULL[endDate.getMonth()];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startYear === endYear) {
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startMonth} ${startYear}`;
      }
      return `${startMonth} - ${endMonth} ${startYear}`;
    }
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  // Calcular meses entre las fechas actuales
  const currentMonthCount =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1;

  return (
    <>
      <TouchableOpacity
        style={[styles(colors).button, { backgroundColor: colors.CARD_BACKGROUND }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles(colors).buttonContent}>
          <View style={[styles(colors).iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
            <Icon
              type="material-community"
              name="calendar-range"
              size={24}
              color={colors.PRIMARY}
            />
          </View>

          <View style={styles(colors).textContainer}>
            <Text style={[styles(colors).label, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
            <Text style={[styles(colors).value, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
              {formatRangeDisplay()}
            </Text>
            <Text style={[styles(colors).subtitle, { color: colors.TEXT_SECONDARY }]}>
              {currentMonthCount} {currentMonthCount === 1 ? 'mes' : 'meses'}
            </Text>
          </View>

          <Icon
            type="material-community"
            name="chevron-right"
            size={24}
            color={colors.TEXT_SECONDARY}
          />
        </View>
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="slide">
        <View style={styles(colors).backdrop}>
          <View style={styles(colors).modal}>
            {/* Header */}
            <View style={styles(colors).header}>
              <Text style={[styles(colors).title, { color: colors.TEXT_PRIMARY }]}>
                Seleccionar Período
              </Text>
              <TouchableOpacity onPress={handleCancel}>
                <Icon
                  type="material-community"
                  name="close"
                  size={24}
                  color={colors.TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            {/* Instrucciones */}
            <View style={[styles(colors).infoBox, { backgroundColor: colors.INFO + '15' }]}>
              <Icon type="material-community" name="information" size={16} color={colors.INFO} />
              <Text style={[styles(colors).infoText, { color: colors.INFO }]}>
                {selectingStart ? 'Selecciona el mes de inicio' : 'Selecciona el mes de fin'}
              </Text>
            </View>

            {/* Resumen de selección */}
            <View style={styles(colors).summaryContainer}>
              <View style={styles(colors).summaryItem}>
                <Text style={[styles(colors).summaryLabel, { color: colors.TEXT_SECONDARY }]}>
                  Inicio
                </Text>
                <Text style={[styles(colors).summaryValue, { color: colors.SUCCESS }]}>
                  {MONTH_NAMES_FULL[tempStartDate.getMonth()]} {tempStartDate.getFullYear()}
                </Text>
              </View>

              <Icon
                type="material-community"
                name="arrow-right"
                size={20}
                color={colors.TEXT_SECONDARY}
              />

              <View style={styles(colors).summaryItem}>
                <Text style={[styles(colors).summaryLabel, { color: colors.TEXT_SECONDARY }]}>
                  Fin
                </Text>
                <Text style={[styles(colors).summaryValue, { color: colors.ERROR }]}>
                  {MONTH_NAMES_FULL[tempEndDate.getMonth()]} {tempEndDate.getFullYear()}
                </Text>
              </View>

              <View style={[styles(colors).badge, { backgroundColor: colors.PRIMARY + '20' }]}>
                <Text style={[styles(colors).badgeText, { color: colors.PRIMARY }]}>
                  {getMonthCount()} {getMonthCount() === 1 ? 'mes' : 'meses'}
                </Text>
              </View>
            </View>

            <ScrollView style={styles(colors).scrollView} showsVerticalScrollIndicator={false}>
              {/* Selector de año */}
              <View style={styles(colors).yearContainer}>
                <TouchableOpacity
                  style={styles(colors).yearButton}
                  onPress={() => setYear(year - 1)}
                >
                  <Icon
                    type="material-community"
                    name="chevron-left"
                    size={24}
                    color={colors.PRIMARY}
                  />
                </TouchableOpacity>

                <Text style={[styles(colors).yearText, { color: colors.TEXT_PRIMARY }]}>
                  {year}
                </Text>

                <TouchableOpacity
                  style={styles(colors).yearButton}
                  onPress={() => setYear(year + 1)}
                >
                  <Icon
                    type="material-community"
                    name="chevron-right"
                    size={24}
                    color={colors.PRIMARY}
                  />
                </TouchableOpacity>
              </View>

              {/* Grid de meses */}
              <View style={styles(colors).monthGrid}>
                {MONTHS.map((month, index) => {
                  const inRange = isMonthInRange(index, year);
                  const isStart = isStartMonth(index, year);
                  const isEnd = isEndMonth(index, year);

                  return (
                    <TouchableOpacity
                      key={`${month}-${index}`}
                      style={[
                        styles(colors).monthItem,
                        inRange && styles(colors).monthInRange,
                        isStart && styles(colors).monthStart,
                        isEnd && styles(colors).monthEnd
                      ]}
                      onPress={() => handleMonthSelect(index)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles(colors).monthText,
                          { color: inRange ? colors.WHITE : colors.TEXT_PRIMARY }
                        ]}
                      >
                        {month}
                      </Text>
                      {isStart && (
                        <View style={styles(colors).indicator}>
                          <Text style={styles(colors).indicatorText}>I</Text>
                        </View>
                      )}
                      {isEnd && (
                        <View style={styles(colors).indicator}>
                          <Text style={styles(colors).indicatorText}>F</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles(colors).actions}>
              <TouchableOpacity
                style={[styles(colors).actionButton, { backgroundColor: colors.GRAY }]}
                onPress={handleCancel}
              >
                <Text style={[styles(colors).actionButtonText, { color: colors.TEXT_PRIMARY }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles(colors).actionButton, { backgroundColor: colors.PRIMARY }]}
                onPress={handleApply}
              >
                <Text style={[styles(colors).actionButtonText, { color: colors.WHITE }]}>
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      marginBottom: 16
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center'
    },
    textContainer: {
      flex: 1,
      gap: 2
    },
    label: {
      fontSize: SMALL - 1,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5
    },
    value: {
      fontSize: MEDIUM,
      fontWeight: '700'
    },
    subtitle: {
      fontSize: SMALL - 1,
      marginTop: 2
    },
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
      backgroundColor: colors.CARD_BACKGROUND,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: 20,
      maxHeight: '85%'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16
    },
    title: {
      fontSize: MEDIUM + 2,
      fontWeight: '700'
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 8
    },
    infoText: {
      fontSize: SMALL,
      fontWeight: '500',
      flex: 1
    },
    summaryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.BACKGROUND,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1
    },
    summaryLabel: {
      fontSize: SMALL - 2,
      fontWeight: '500',
      marginBottom: 4
    },
    summaryValue: {
      fontSize: SMALL,
      fontWeight: '700'
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12
    },
    badgeText: {
      fontSize: SMALL - 1,
      fontWeight: '700'
    },
    scrollView: {
      maxHeight: 400
    },
    yearContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 20
    },
    yearButton: {
      padding: 8
    },
    yearText: {
      fontSize: MEDIUM + 4,
      fontWeight: 'bold',
      marginHorizontal: 32
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 8
    },
    monthItem: {
      width: '22%',
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: colors.BACKGROUND,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.BORDER,
      position: 'relative'
    },
    monthInRange: {
      backgroundColor: colors.PRIMARY + '60',
      borderColor: colors.PRIMARY
    },
    monthStart: {
      backgroundColor: colors.SUCCESS,
      borderColor: colors.SUCCESS
    },
    monthEnd: {
      backgroundColor: colors.ERROR,
      borderColor: colors.ERROR
    },
    monthText: {
      fontSize: SMALL - 1,
      fontWeight: '600'
    },
    indicator: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.9)',
      alignItems: 'center',
      justifyContent: 'center'
    },
    indicatorText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000'
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center'
    },
    actionButtonText: {
      fontSize: MEDIUM,
      fontWeight: '600'
    }
  });

export default MonthRangePicker;
