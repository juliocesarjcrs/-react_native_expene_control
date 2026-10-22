/**
 * CopagoHistoryItem — Item individual de la lista cronológica
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/components/CopagoHistoryItem.tsx
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { CopagoData } from '~/shared/types/utils/commentaryParser/copago-analysis.types';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import { getItemTitle, getSequenceLabel, getPatientBadge } from '../utils/copagoLabels';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface CopagoHistoryItemProps {
  item: CopagoData;
}

export default function CopagoHistoryItem({ item }: CopagoHistoryItemProps) {
  const colors = useThemeColors();
  const sequenceLabel = getSequenceLabel(item);
  const patientBadge = getPatientBadge(item);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          borderLeftColor: item.hasSequence ? colors.INFO : colors.BORDER
        }
      ]}
    >
      {/* Header: institución · acto + área, y fecha */}
      <View style={styles.header}>
        <Text style={[styles.service, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {getItemTitle(item)}
        </Text>
        <Text style={[styles.date, { color: colors.TEXT_SECONDARY }]}>
          {DateFormat(item.date, 'DD MMM YYYY')}
        </Text>
      </View>

      {/* Nota libre */}
      {item.note ? (
        <Text style={[styles.note, { color: colors.TEXT_SECONDARY }]} numberOfLines={2}>
          {item.note}
        </Text>
      ) : null}

      {/* Footer: número + paciente + costo */}
      <View style={styles.footer}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Icon
              type="material-community"
              name={sequenceLabel ? 'counter' : 'calendar-blank-outline'}
              size={14}
              color={sequenceLabel ? colors.INFO : colors.TEXT_SECONDARY}
            />
            <Text
              style={[
                styles.badgeText,
                { color: sequenceLabel ? colors.INFO : colors.TEXT_SECONDARY }
              ]}
            >
              {sequenceLabel ?? 'Sin número'}
            </Text>
          </View>

          {patientBadge ? (
            <View style={styles.badge}>
              <Icon
                type="material-community"
                name="account"
                size={14}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.badgeText, { color: colors.TEXT_SECONDARY }]}>
                {patientBadge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.cost, { color: colors.TEXT_PRIMARY }]}>{NumberFormat(item.cost)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
    gap: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  service: {
    fontSize: SMALL + 1,
    fontWeight: '500',
    flex: 1
  },
  date: {
    fontSize: SMALL - 1
  },
  note: {
    fontSize: SMALL - 1,
    fontStyle: 'italic'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  badgeText: {
    fontSize: SMALL - 1,
    fontWeight: '500'
  },
  cost: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  }
});
