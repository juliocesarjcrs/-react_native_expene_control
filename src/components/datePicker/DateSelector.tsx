import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Icon } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';

type DateSelectorAlign = 'left' | 'center' | 'right';

interface DateSelectorProps {
  label: string;
  date: Date;
  showDatePicker: boolean;
  onPress: () => void;
  onDateChange: (date?: Date) => void;
  onCancel?: () => void;
  align?: DateSelectorAlign; // Alineación cuando está solo
  fullWidth?: boolean; // Si debe ocupar todo el ancho
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  label,
  date,
  showDatePicker,
  onPress,
  onDateChange,
  onCancel,
  align = 'left',
  fullWidth = false
}) => {
  const colors = useThemeColors();

  const getAlignStyle = () => {
    if (fullWidth) return 'stretch';
    switch (align) {
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      case 'left':
      default:
        return 'flex-start';
    }
  };

  return (
   <View
  style={[
    styles.container,
    fullWidth
      ? { width: '100%' }
      : { alignSelf: getAlignStyle() }
  ]}
>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.PRIMARY,
            opacity: pressed ? 0.8 : 1,
            borderColor: colors.PRIMARY_BLACK,
            shadowColor: colors.BLACK,
            elevation: pressed ? 1 : 3
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon type="material-community" name="calendar-edit" size={20} color={colors.WHITE} />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.label, { color: colors.WHITE }]} numberOfLines={1}>
            {label}
          </Text>
          <View style={styles.dateContainer}>
            <Text
              style={[
                styles.dateText,
                {
                  color: colors.WHITE,
                  backgroundColor: colors.PRIMARY_BLACK
                }
              ]}
              numberOfLines={1}
            >
              {DateFormat(date, 'DD MMM YYYY')}
            </Text>
            <Icon
              type="material-community"
              name="chevron-down"
              size={16}
              color={colors.WHITE}
              containerStyle={styles.chevronIcon}
            />
          </View>
        </View>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate?: Date) => {
            if (event.type === 'set') {
              onDateChange(selectedDate);
            } else {
              if (onCancel) onCancel();
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 160
  },
  iconContainer: {
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 6
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    // textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.9
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 6,
    flex: 1
  },
  chevronIcon: {
    marginLeft: 1
  }
});

export default DateSelector;
