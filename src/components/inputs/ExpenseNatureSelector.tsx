import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Controller } from 'react-hook-form';
import type { Control, FieldValues, Path, PathValue } from 'react-hook-form';
import { Icon } from 'react-native-elements';

// Types
import type { ExpenseNature } from '~/shared/types/models/expense.type';
import { EXPENSE_NATURE_META } from '~/constants/expenseNature';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

const NATURE_VALUES: ExpenseNature[] = ['operational', 'investment', 'atypical'];
const DEFAULT_NATURE_FIELD = 'nature';
const SELECTED_BG_OPACITY_HEX = '20';

// Genérico: acepta el Control de cualquier formulario que tenga un campo de naturaleza
interface ExpenseNatureSelectorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name?: Path<TFieldValues>;
  defaultValue?: ExpenseNature;
}

export default function ExpenseNatureSelector<TFieldValues extends FieldValues>({
  control,
  name = DEFAULT_NATURE_FIELD as unknown as Path<TFieldValues>,
  defaultValue = 'operational'
}: ExpenseNatureSelectorProps<TFieldValues>): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as PathValue<TFieldValues, Path<TFieldValues>>}
      render={({ field: { value, onChange } }) => {
        const currentNature = value as unknown as ExpenseNature;
        const selectedMeta = EXPENSE_NATURE_META[currentNature];

        return (
          <View style={styles.container}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Tipo de gasto</Text>

            <View style={styles.optionsRow}>
              {NATURE_VALUES.map((natureValue) => {
                const meta = EXPENSE_NATURE_META[natureValue];
                const isSelected = currentNature === natureValue;
                const optionColor = colors[meta.colorKey];

                return (
                  <TouchableOpacity
                    key={natureValue}
                    onPress={() => onChange(natureValue)}
                    activeOpacity={0.7}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? `${optionColor}${SELECTED_BG_OPACITY_HEX}`
                          : colors.CARD_BACKGROUND,
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
