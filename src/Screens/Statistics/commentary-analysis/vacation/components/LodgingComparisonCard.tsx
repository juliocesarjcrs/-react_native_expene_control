/**
 * LodgingComparisonCard — Comparación de alojamientos ordenados por precio/noche
 * Ubicación: src/Screens/Statistics/commentary-analysis/vacation/components/LodgingComparisonCard.tsx
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { LodgingComparison } from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

const MODALITY_LABELS: Record<string, string> = {
  todo_incluido: 'Todo incluido',
  con_desayuno: 'Con desayuno',
  media_pension: 'Media pensión',
  solo_alojamiento: 'Solo alojamiento',
  solo_habitacion: 'Solo habitación',
  otro: 'Otro'
};

interface LodgingComparisonCardProps {
  lodgings: LodgingComparison[];
}

export default function LodgingComparisonCard({ lodgings }: LodgingComparisonCardProps) {
  const colors = useThemeColors();

  if (lodgings.length === 0) return null;

  const cheapest = lodgings[0];
  const mostExpensive = lodgings[lodgings.length - 1];

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon type="material-community" name="bed" size={20} color={colors.INFO} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Comparación de alojamientos
        </Text>
      </View>

      {/* Insight: más barato vs más caro */}
      {lodgings.length > 1 && (
        <View
          style={[
            styles.insight,
            { backgroundColor: colors.INFO + '15', borderColor: colors.INFO }
          ]}
        >
          <Text style={[styles.insightText, { color: colors.TEXT_SECONDARY }]}>
            El más económico fue{' '}
            <Text style={{ fontWeight: '700', color: colors.TEXT_PRIMARY }}>
              {cheapest.lodgingType} {cheapest.name}
            </Text>{' '}
            a {NumberFormat(cheapest.pricePerNight)}/noche vs{' '}
            <Text style={{ fontWeight: '700', color: colors.TEXT_PRIMARY }}>
              {mostExpensive.lodgingType} {mostExpensive.name}
            </Text>{' '}
            a {NumberFormat(mostExpensive.pricePerNight)}/noche
          </Text>
        </View>
      )}

      {/* Lista de alojamientos */}
      {lodgings.map((lodging, index) => (
        <View
          key={index}
          style={[
            styles.item,
            { borderBottomColor: colors.BORDER },
            index === 0 && styles.itemFirst
          ]}
        >
          {/* Tipo + nombre + destino */}
          <View style={styles.itemHeader}>
            <View style={[styles.typeBadge, { backgroundColor: colors.INFO + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.INFO }]}>
                {lodging.lodgingType}
              </Text>
            </View>
            {index === 0 && lodgings.length > 1 && (
              <View style={[styles.cheapestBadge, { backgroundColor: colors.SUCCESS + '15' }]}>
                <Text style={[styles.cheapestBadgeText, { color: colors.SUCCESS }]}>
                  Más económico
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.itemName, { color: colors.TEXT_PRIMARY }]}>{lodging.name}</Text>
          <Text style={[styles.itemMeta, { color: colors.TEXT_SECONDARY }]}>
            {lodging.destination} · {lodging.nights} {lodging.nights === 1 ? 'noche' : 'noches'} ·{' '}
            {MODALITY_LABELS[lodging.modality]}
          </Text>
          <Text style={[styles.itemDate, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(lodging.date, 'DD MMM YYYY')}
          </Text>

          {/* Precios */}
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.TEXT_SECONDARY }]}>
                Por noche (total)
              </Text>
              <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
                {NumberFormat(lodging.pricePerNight)}
              </Text>
            </View>
            {lodging.baseFarePerNight && (
              <View style={styles.priceRight}>
                <Text style={[styles.priceLabel, { color: colors.TEXT_SECONDARY }]}>
                  Sin impuestos
                </Text>
                <Text style={[styles.priceValue, { color: colors.SUCCESS }]}>
                  {NumberFormat(lodging.baseFarePerNight)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: MEDIUM, fontWeight: '600' },
  insight: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 12
  },
  insightText: { fontSize: SMALL, lineHeight: 20 },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 4
  },
  itemFirst: { paddingTop: 0 },
  itemHeader: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  typeBadgeText: { fontSize: SMALL - 1, fontWeight: '600' },
  cheapestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  cheapestBadgeText: { fontSize: SMALL - 1, fontWeight: '600' },
  itemName: { fontSize: SMALL + 1, fontWeight: '600' },
  itemMeta: { fontSize: SMALL - 1 },
  itemDate: { fontSize: SMALL - 1 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  priceRight: { alignItems: 'flex-end' },
  priceLabel: { fontSize: SMALL - 1, marginBottom: 2 },
  priceValue: { fontSize: SMALL + 1, fontWeight: '700' }
});
