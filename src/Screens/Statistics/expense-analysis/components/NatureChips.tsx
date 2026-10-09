import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Components
import MyChip from '~/components/chip/MyChip';

// Types
import { ExpenseNature } from '~/shared/types/services';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

export const EXPENSE_NATURES: ExpenseNature[] = ['operational', 'investment', 'atypical'];

/** Selección inicial: solo gastos operativos */
export const DEFAULT_NATURES: ExpenseNature[] = ['operational'];

const NATURE_LABELS: Record<ExpenseNature, string> = {
  operational: 'Operativo',
  investment: 'Inversión',
  atypical: 'Atípico'
};

/** Texto corto que describe qué tipos de gasto incluye la selección */
export const getNaturesSummary = (selected: ExpenseNature[]): string => {
  if (selected.length === EXPENSE_NATURES.length) return 'Todos los tipos de gasto';
  const labels = EXPENSE_NATURES.filter((nature) => selected.includes(nature)).map(
    (nature) => NATURE_LABELS[nature]
  );
  return `Tipo de gasto: ${labels.join(', ')}`;
};

interface NatureChipsProps {
  selected: ExpenseNature[];
  /** Total por naturaleza del periodo (ignora el filtro activo) */
  totals?: Record<ExpenseNature, number>;
  onChange: (next: ExpenseNature[]) => void;
}

export default function NatureChips({ selected, totals, onChange }: NatureChipsProps) {
  const colors = useThemeColors();

  const handleToggle = (nature: ExpenseNature) => {
    if (selected.includes(nature)) {
      // Siempre debe quedar al menos una naturaleza activa
      if (selected.length === 1) return;
      onChange(selected.filter((item) => item !== nature));
      return;
    }
    onChange(EXPENSE_NATURES.filter((item) => item === nature || selected.includes(item)));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.TEXT_SECONDARY }]}>Tipo de gasto</Text>
      <View style={styles.chipsRow}>
        {EXPENSE_NATURES.map((nature) => (
          <MyChip
            key={nature}
            label={NATURE_LABELS[nature]}
            sublabel={totals ? NumberFormat(Math.round(totals[nature])) : undefined}
            selected={selected.includes(nature)}
            onPress={() => handleToggle(nature)}
            style={styles.chip}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  title: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8
  },
  chip: {
    flex: 1,
    paddingHorizontal: 4
  }
});
