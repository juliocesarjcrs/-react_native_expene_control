/**
 * CopagoPatientSelector — Filtro de paciente (Todos / Silvia / Julio)
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/components/CopagoPatientSelector.tsx
 *
 * Las opciones salen de los datos, no están escritas a mano. Si solo hay un
 * paciente en el rango, no se muestra (no hay nada que elegir).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { CopagoPatientOption } from '../hooks/useCopagoData';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface CopagoPatientSelectorProps {
  patients: CopagoPatientOption[];
  /** null = Todos */
  selected: string | null;
  onSelect: (patient: string | null) => void;
}

export default function CopagoPatientSelector({
  patients,
  selected,
  onSelect
}: CopagoPatientSelectorProps) {
  const colors = useThemeColors();

  if (patients.length < 2) return null;

  const totalCount = patients.reduce((sum, p) => sum + p.count, 0);
  const options: { key: string | null; label: string; count: number }[] = [
    { key: null, label: 'Todos', count: totalCount },
    ...patients.map((p) => ({ key: p.name, label: p.name, count: p.count }))
  ];

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option.key === selected;
        return (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.PRIMARY : colors.PRIMARY + '18',
                borderColor: isActive ? colors.PRIMARY : colors.PRIMARY + '40'
              }
            ]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.7}
          >
            <Icon
              type="material-community"
              name={option.key === null ? 'account-group' : 'account'}
              size={14}
              color={isActive ? colors.WHITE : colors.PRIMARY}
              containerStyle={styles.icon}
            />
            <Text style={[styles.label, { color: isActive ? colors.WHITE : colors.PRIMARY }]}>
              {option.label} · {option.count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  icon: {
    marginRight: 4
  },
  label: {
    fontSize: SMALL,
    fontWeight: '600'
  }
});
