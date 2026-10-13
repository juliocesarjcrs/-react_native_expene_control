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
  numMonths: number;
};

interface CheckBoxOptionsProps<T extends StackNavigationProp<ParamListBase>> {
  navigation: T;
  updateNum: (numMonths: number) => void;
}

const SINCE_REGISTRATION_ID = 4;
const CUSTOM_OPTION_ID = 5;
const DEFAULT_OPTION_ID = 1;

export default function CheckBoxOptions<T extends StackNavigationProp<ParamListBase>>({
  navigation,
  updateNum
}: CheckBoxOptionsProps<T>) {
  const colors = useThemeColors();

  // Datos reales (todo lo demás se deriva)
  const [registeredMonths, setRegisteredMonths] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<number>(DEFAULT_OPTION_ID);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadRegistration = async (): Promise<void> => {
      try {
        const jsonValue = await AsyncStorage.getItem('user');
        if (!jsonValue || !isMounted) return;

        const user = JSON.parse(jsonValue) as UserModel;
        setRegisteredMonths(GetInitialMonth(user.createdAt, 1));
      } catch (error) {
        if (isMounted) showError(error);
      }
    };

    // 'focus' también se dispara en el primer enfoque de la pantalla.
    const unsubscribe = navigation.addListener('focus', loadRegistration);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation]);

  // Opciones derivadas
  const options: CheckboxOption[] = [
    { id: 1, title: 'Últimos 3 meses', numMonths: 3 },
    { id: 2, title: 'Últimos 6 meses', numMonths: 6 },
    { id: 3, title: 'Últimos 12 meses', numMonths: 12 },
    registeredMonths === null
      ? { id: SINCE_REGISTRATION_ID, title: 'Desde registro', numMonths: 0 }
      : {
          id: SINCE_REGISTRATION_ID,
          title: `Desde registro (${registeredMonths} meses)`,
          numMonths: registeredMonths
        },
    customDate
      ? {
          id: CUSTOM_OPTION_ID,
          title: `Personalizada (${DateFormat(customDate, 'DD MMM YYYY')})`,
          numMonths: GetInitialMonth(customDate, 1)
        }
      : { id: CUSTOM_OPTION_ID, title: 'Personalizada', numMonths: 0 }
  ];

  const handleDateChange = (_event: unknown, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCustomDate(selectedDate);
      updateNum(GetInitialMonth(selectedDate, 1));
    }
  };

  const handleSelect = (option: CheckboxOption): void => {
    setSelectedId(option.id);

    if (option.id === CUSTOM_OPTION_ID) {
      setShowDatePicker(true);
    } else {
      updateNum(option.numMonths);
    }
  };

  const popoverStyle = { backgroundColor: colors.CARD_BACKGROUND };

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
        popoverStyle={popoverStyle}
      >
        <View style={[styles.popoverContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
          {options.map((option) => {
            const checked = option.id === selectedId;

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.checkboxItem, { borderBottomColor: colors.BORDER }]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxContent}>
                  <Icon
                    type="material-community"
                    name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={checked ? colors.PRIMARY : colors.TEXT_SECONDARY}
                    containerStyle={styles.checkboxIcon}
                  />
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.checkboxTitle,
                        {
                          color: checked ? colors.PRIMARY : colors.TEXT_PRIMARY,
                          fontWeight: checked ? '600' : 'normal'
                        }
                      ]}
                      numberOfLines={2}
                    >
                      {option.title}
                    </Text>
                    {checked && option.numMonths > 0 && (
                      <Text style={[styles.monthsLabel, { color: colors.TEXT_SECONDARY }]}>
                        {option.numMonths} {option.numMonths === 1 ? 'mes' : 'meses'}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {showDatePicker && (
            <DateTimePicker
              value={customDate ?? new Date()}
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
    padding: 4
  },
  popoverContainer: {
    minWidth: 250,
    paddingVertical: 8,
    borderRadius: 12
  },
  checkboxItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  checkboxContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkboxIcon: {
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  checkboxTitle: {
    fontSize: SMALL + 1,
    lineHeight: 20
  },
  monthsLabel: {
    fontSize: SMALL - 1,
    marginTop: 2
  }
});
