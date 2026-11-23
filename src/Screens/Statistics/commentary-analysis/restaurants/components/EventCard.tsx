import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Types
import { RestaurantEventStats } from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { formatApiDate, pluralize } from '../utils/formatters';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { cardStyles } from './cardStyles';

interface EventCardProps {
  event: RestaurantEventStats;
}

export function EventCard({ event }: EventCardProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          shadowColor: colors.BLACK
        }
      ]}
    >
      <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{event.label}</Text>
      <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
        {event.visits} {pluralize(event.visits, 'visita', 'visitas')} ·{' '}
        {NumberFormat(Math.round(event.totalCost))} · última {formatApiDate(event.lastDate)}
      </Text>
      <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
        {event.restaurants.length > 0
          ? `Restaurantes (${event.restaurants.length}): ${event.restaurants.join(', ')}`
          : 'Sin restaurante anotado'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: MEDIUM, fontWeight: '600', marginBottom: 4 },
  detail: { fontSize: SMALL, lineHeight: 20 }
});
