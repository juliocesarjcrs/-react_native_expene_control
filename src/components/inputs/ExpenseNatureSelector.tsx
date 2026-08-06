// ~/components/inputs/ExpenseNatureSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { Icon } from 'react-native-elements';

// Types
import { ExpenseNature } from '~/shared/types/models/expense.type';
import { EXPENSE_NATURE_META } from '~/constants/expenseNature';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL, MEDIUM } from '~/styles/fonts';

const NATURE_VALUES: ExpenseNature[] = ['operational', 'investment', 'atypical'];

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
        const selectedMeta = EXPENSE_NATURE_META[value as ExpenseNature];

        return (
          <View style={styles.container}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Tipo de gasto</Text>

            <View style={styles.optionsRow}>
              {NATURE_VALUES.map((natureValue) => {
                const meta = EXPENSE_NATURE_META[natureValue];
                const isSelected = value === natureValue;
                const optionColor = colors[meta.colorKey];

                return (
                  <TouchableOpacity
                    key={natureValue}
                    onPress={() => onChange(natureValue)}
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
                      name={meta.icon}
                      size={20}
                      color={isSelected ? optionColor : colors.TEXT_SECONDARY}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? optionColor : colors.TEXT_SECONDARY }
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedMeta ? (
              <Text style={[styles.description, { color: colors.TEXT_SECONDARY }]}>
                {selectedMeta.description}
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
