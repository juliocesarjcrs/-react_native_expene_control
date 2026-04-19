/**
 * VacationHistoryItem — Item individual de la lista cronológica
 * Ubicación: src/Screens/Statistics/commentary-analysis/vacation/components/VacationHistoryItem.tsx
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { VacationData } from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';
import { ThemeColors } from '~/shared/types/services/theme-config-service.type';

interface VacationHistoryItemProps {
  item: VacationData;
}

const TYPE_CONFIG = {
  lodging: { icon: 'bed', colorKey: 'INFO' as const },
  flight: { icon: 'airplane', colorKey: 'WARNING' as const },
  expense: { icon: 'map-marker', colorKey: 'SUCCESS' as const }
};

const EXPENSE_CATEGORY_CONFIG: Record<string, { icon: string; colorKey: keyof ThemeColors }> = {
  comida: { icon: 'silverware-fork-knife', colorKey: 'SUCCESS' },
  transporte: { icon: 'bus', colorKey: 'WARNING' },
  atraccion: { icon: 'map-marker-star', colorKey: 'PRIMARY' },
  alojamiento: { icon: 'bed', colorKey: 'INFO' },
  otro: { icon: 'dots-horizontal', colorKey: 'GRAY' }
};

export default function VacationHistoryItem({ item }: VacationHistoryItemProps) {
  const colors = useThemeColors();
  const config = TYPE_CONFIG[item.type];
  const expenseCategoryConfig =
    item.type === 'expense'
      ? (EXPENSE_CATEGORY_CONFIG[item.expenseCategory] ?? EXPENSE_CATEGORY_CONFIG['otro'])
      : null;

  const iconName = expenseCategoryConfig?.icon ?? config.icon;
  const iconColor = colors[expenseCategoryConfig?.colorKey ?? config.colorKey];
  const getMainText = (): string => {
    if (item.type === 'lodging') {
      return `${item.lodgingType} ${item.name} · ${item.nights} ${item.nights === 1 ? 'noche' : 'noches'}`;
    }
    if (item.type === 'flight') {
      return `${item.airline} ${item.origin} → ${item.destination}`;
    }
    return item.description;
  };

  const getSubText = (): string => {
    if (item.type === 'lodging') {
      return `${NumberFormat(item.pricePerNight)}/noche · ${item.destination}`;
    }
    if (item.type === 'flight') {
      return `${item.passengers} pasajeros · ${NumberFormat(item.pricePerPerson)}/persona`;
    }
    return item.destination;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          borderLeftColor: iconColor
        }
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Icon type="material-community" name={iconName} size={16} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.mainText, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
            {getMainText()}
          </Text>
          <Text style={[styles.subText, { color: colors.TEXT_SECONDARY }]} numberOfLines={1}>
            {getSubText()}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.cost, { color: colors.TEXT_PRIMARY }]}>{NumberFormat(item.cost)}</Text>
        <Text style={[styles.date, { color: colors.TEXT_SECONDARY }]}>
          {DateFormat(item.date, 'DD MMM')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
    gap: 8
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: { flex: 1 },
  mainText: { fontSize: SMALL + 1, fontWeight: '500' },
  subText: { fontSize: SMALL - 1, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  cost: { fontSize: SMALL + 1, fontWeight: '700' },
  date: { fontSize: SMALL - 1 }
});
