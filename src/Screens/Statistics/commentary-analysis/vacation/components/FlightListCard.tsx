/**
 * FlightListCard — Lista de tiquetes con precio por persona
 * Ubicación: src/Screens/Statistics/commentary-analysis/vacation/components/FlightListCard.tsx
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { VacationFlight } from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface FlightListCardProps {
  flights: VacationFlight[];
}

export default function FlightListCard({ flights }: FlightListCardProps) {
  const colors = useThemeColors();

  if (flights.length === 0) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon type="material-community" name="airplane" size={20} color={colors.WARNING} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Tiquetes aéreos</Text>
      </View>

      {flights.map((flight, index) => (
        <View key={index} style={[styles.item, { borderBottomColor: colors.BORDER }]}>
          {/* Ruta */}
          <View style={styles.routeRow}>
            <Text style={[styles.origin, { color: colors.TEXT_PRIMARY }]}>{flight.origin}</Text>
            <Icon
              type="material-community"
              name="arrow-right"
              size={16}
              color={colors.TEXT_SECONDARY}
            />
            <Text style={[styles.destination, { color: colors.TEXT_PRIMARY }]}>
              {flight.destination}
            </Text>
            <View style={[styles.airlineBadge, { backgroundColor: colors.WARNING + '15' }]}>
              <Text style={[styles.airlineText, { color: colors.WARNING }]}>{flight.airline}</Text>
            </View>
          </View>

          {/* Meta */}
          <Text style={[styles.meta, { color: colors.TEXT_SECONDARY }]}>
            {flight.passengers} {flight.passengers === 1 ? 'pasajero' : 'pasajeros'}
            {flight.departureDate && flight.returnDate
              ? ` · ${flight.departureDate} - ${flight.returnDate}`
              : ''}
            {' · '}
            {DateFormat(flight.date, 'DD MMM YYYY')}
          </Text>

          {/* Precios */}
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.TEXT_SECONDARY }]}>Total</Text>
              <Text style={[styles.priceTotal, { color: colors.TEXT_PRIMARY }]}>
                {NumberFormat(flight.cost)}
              </Text>
            </View>
            <View style={styles.priceRight}>
              <Text style={[styles.priceLabel, { color: colors.TEXT_SECONDARY }]}>Por persona</Text>
              <Text style={[styles.pricePerson, { color: colors.SUCCESS }]}>
                {NumberFormat(flight.pricePerPerson)}
              </Text>
            </View>
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
  item: { paddingVertical: 12, borderBottomWidth: 1, gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  origin: { fontSize: SMALL + 1, fontWeight: '600' },
  destination: { fontSize: SMALL + 1, fontWeight: '600', flex: 1 },
  airlineBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  airlineText: { fontSize: SMALL - 1, fontWeight: '600' },
  meta: { fontSize: SMALL - 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  priceRight: { alignItems: 'flex-end' },
  priceLabel: { fontSize: SMALL - 1, marginBottom: 2 },
  priceTotal: { fontSize: SMALL + 1, fontWeight: '600' },
  pricePerson: { fontSize: SMALL + 1, fontWeight: '700' }
});
