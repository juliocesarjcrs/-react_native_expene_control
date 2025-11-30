import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Icon } from 'react-native-elements';
import Popover from 'react-native-popover-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

// Utils
import { DateFormat, GetInitialMonth } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Types
import { UserModel } from '~/shared/types';

// Styles
import { SMALL } from '~/styles/fonts';

type CheckboxOption = {
  id: number;
  title: string;
  checked: boolean;
  numMonths: number;
};

interface CheckBoxOptionsProps<T extends StackNavigationProp<ParamListBase>> {
  navigation: T;
  updateNum: (numMonths: number) => void;
}

export default function CheckBoxOptions<T extends StackNavigationProp<ParamListBase>>({
  navigation,
  updateNum,
}: CheckBoxOptionsProps<T>) {
  const colors = useThemeColors();
  const [initialMonth, setInitialMonth] = useState<number>(0);
  const [initialDateMonth, setInitialDateMonth] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const [checkboxes, setCheckboxes] = useState<CheckboxOption[]>([
    {
      id: 1,
      title: 'Últimos 3 meses',
      checked: true,
      numMonths: 3,
    },
    {
      id: 2,
      title: 'Últimos 6 meses',
      checked: false,
      numMonths: 6,
    },
    {
      id: 3,
      title: 'Últimos 12 meses',
      checked: false,
      numMonths: 12,
    },
    {
      id: 4,
      title: `Desde registro`,
      checked: false,
      numMonths: 0,
    },
    {
      id: 5,
      title: 'Personalizada',
      checked: false,
      numMonths: 0,
    },
  ]);

  useEffect(() => {
    fetchUserLogued();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserLogued();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserLogued = async (): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      if (!jsonValue) return;

      const user: UserModel = JSON.parse(jsonValue) as UserModel;
      const tempInitialMonth = GetInitialMonth(user.createdAt, 1);
      setInitialMonth(tempInitialMonth);
      setInitialDateMonth(user.createdAt);

      setCheckboxes((prev) =>
        prev.map((cb) =>
          cb.id === 4
            ? {
                ...cb,
                title: `Desde registro (${tempInitialMonth} meses)`,
                numMonths: tempInitialMonth,
              }
            : cb
        )
      );
    } catch (error) {
      showError(error);
    }
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCustomDate(selectedDate);
      const customMonths = GetInitialMonth(selectedDate, 1);

      setCheckboxes((prev) =>
        prev.map((cb) =>
          cb.id === 5
            ? {
                ...cb,
                title: `Personalizada (${DateFormat(selectedDate, 'DD MMM YYYY')})`,
                numMonths: customMonths,
              }
            : cb
        )
      );

      updateNum(customMonths);
    }
  };

  const toggleCheckbox = (index: number): void => {
    const updatedCheckboxes = checkboxes.map((cb, idx) => ({
      ...cb,
      checked: idx === index,
    }));

    setCheckboxes(updatedCheckboxes);

    if (index === 4) {
      // Opción personalizada
      setShowDatePicker(true);
    } else {
      updateNum(updatedCheckboxes[index].numMonths);
    }
  };

  return (
    <View>
      <Popover
        from={
          <TouchableOpacity style={styles.menuButton}>
            <Icon
              type="material-community"
              name="dots-vertical"
              size={24}
              color={colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>
        }
        popoverStyle={{ backgroundColor: colors.CARD_BACKGROUND }}
      >
        <View style={[styles.popoverContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
          {checkboxes.map((cb, index) => (
            <TouchableOpacity
              key={cb.id}
              style={[
                styles.checkboxItem,
                { borderBottomColor: colors.BORDER }
              ]}
              onPress={() => toggleCheckbox(index)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContent}>
                <Icon
                  type="material-community"
                  name={cb.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={cb.checked ? colors.PRIMARY : colors.TEXT_SECONDARY}
                  containerStyle={styles.checkboxIcon}
                />
                <View style={styles.textContainer}>
                  <Text 
                    style={[
                      styles.checkboxTitle, 
                      { 
                        color: cb.checked ? colors.PRIMARY : colors.TEXT_PRIMARY,
                        fontWeight: cb.checked ? '600' : 'normal'
                      }
                    ]}
                    numberOfLines={2}
                  >
                    {cb.title}
                  </Text>
                  {cb.checked && cb.numMonths > 0 && (
                    <Text style={[styles.monthsLabel, { color: colors.TEXT_SECONDARY }]}>
                      {cb.numMonths} {cb.numMonths === 1 ? 'mes' : 'meses'}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {showDatePicker && (
            <DateTimePicker
              value={customDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </Popover>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 4,
  },
  popoverContainer: {
    minWidth: 250,
    paddingVertical: 8,
    borderRadius: 12,
  },
  checkboxItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  checkboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxIcon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: SMALL + 1,
    lineHeight: 20,
  },
  monthsLabel: {
    fontSize: SMALL - 1,
    marginTop: 2,
  },
});