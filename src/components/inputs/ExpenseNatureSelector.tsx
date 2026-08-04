import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { Icon } from 'react-native-elements';

// Types
import { ExpenseNature } from '~/shared/types/models/expense.type';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL, MEDIUM } from '~/styles/fonts';

interface ExpenseNatureOption {
  value: ExpenseNature;
  label: string;
  icon: string;
  description: string;
  colorKey: 'PRIMARY' | 'SUCCESS' | 'WARNING';
}

const NATURE_OPTIONS: ExpenseNatureOption[] = [
  {
    value: 'operational',
    label: 'Normal',
    icon: 'cart-outline',
    description: 'Gasto de consumo habitual',
    colorKey: 'PRIMARY'
  },
  {
    value: 'investment',
    label: 'Inversión',
    icon: 'home-city-outline',
    description: 'Compra de un activo: terreno, apartamento, inversión financiera',
    colorKey: 'SUCCESS'
  },
  {
    value: 'atypical',
    label: 'Atípico',
    icon: 'alert-circle-outline',
    description: 'Gasto grande no recurrente: emergencia, reparación mayor',
    colorKey: 'WARNING'
  }
];

interface ExpenseNatureSelectorProps {
  control: Control<any>;
  name?: string;
  defaultValue?: ExpenseNature;
}

export default function ExpenseNatureSelector({
  control,
  name = 'nature',
  defaultValue = 'operational'
}: ExpenseNatureSelectorProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { value, onChange } }) => {
        const selectedOption = NATURE_OPTIONS.find((o) => o.value === value);

        return (
          <View style={styles.container}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Tipo de gasto</Text>

            <View style={styles.optionsRow}>
              {NATURE_OPTIONS.map((option) => {
                const isSelected = value === option.value;
                const optionColor = colors[option.colorKey];

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => onChange(option.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected ? optionColor + '20' : colors.CARD_BACKGROUND,
                        borderColor: isSelected ? optionColor : colors.BORDER
                      }
                    ]}
                  >
                    <Icon
                      type="material-community"
                      name={option.icon}
                      size={20}
                      color={isSelected ? optionColor : colors.TEXT_SECONDARY}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? optionColor : colors.TEXT_SECONDARY }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedOption ? (
              <Text style={[styles.description, { color: colors.TEXT_SECONDARY }]}>
                {selectedOption.description}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 8
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6
  },
  optionLabel: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  description: {
    fontSize: SMALL,
    marginTop: 8
  }
});
