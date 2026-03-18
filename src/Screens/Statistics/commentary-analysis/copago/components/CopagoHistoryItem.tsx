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

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface CopagoHistoryItemProps {
  item: CopagoData;
}

export default function CopagoHistoryItem({ item }: CopagoHistoryItemProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          borderLeftColor: item.hasSessions ? colors.INFO : colors.BORDER
        }
      ]}
    >
      {/* Header: servicio + fecha */}
      <View style={styles.header}>
        <Text style={[styles.service, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {item.institution ? `${item.institution} · ` : ''}
          {item.service}
        </Text>
        <Text style={[styles.date, { color: colors.TEXT_SECONDARY }]}>
          {DateFormat(item.date, 'DD MMM YYYY')}
        </Text>
      </View>

      {/* Footer: sesión + costo */}
      <View style={styles.footer}>
        {/* Progreso de sesión */}
        {item.hasSessions ? (
          <View style={styles.sessionBadge}>
            <Icon type="material-community" name="counter" size={14} color={colors.INFO} />
            <Text style={[styles.sessionText, { color: colors.INFO }]}>
              Sesión {item.sessionNumber}
              {item.totalSessions ? `/${item.totalSessions}` : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.sessionBadge}>
            <Icon
              type="material-community"
              name="calendar-check"
              size={14}
              color={colors.TEXT_SECONDARY}
            />
            <Text style={[styles.sessionText, { color: colors.TEXT_SECONDARY }]}>Cita única</Text>
          </View>
        )}

        {/* Costo */}
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  sessionText: {
    fontSize: SMALL - 1,
    fontWeight: '500'
  },
  cost: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  }
});
