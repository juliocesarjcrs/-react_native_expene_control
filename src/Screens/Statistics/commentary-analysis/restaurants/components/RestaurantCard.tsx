import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import {
  RestaurantDishHistory,
  RestaurantStats
} from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { formatApiDate, formatSignedPercent, pluralize } from '../utils/formatters';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { cardStyles } from './cardStyles';

interface DishHistoryRowProps {
  dish: RestaurantDishHistory;
}

function DishHistoryRow({ dish }: DishHistoryRowProps): React.JSX.Element {
  const colors = useThemeColors();
  const trendColor =
    dish.change > 0 ? colors.ERROR : dish.change < 0 ? colors.SUCCESS : colors.TEXT_SECONDARY;

  return (
    <View style={styles.dish}>
      <Text style={[styles.dishName, { color: colors.TEXT_PRIMARY }]}>
        {dish.dishLabel} ({dish.count} veces)
      </Text>
      <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
        {NumberFormat(dish.firstPrice)} → {NumberFormat(dish.lastPrice)}{' '}
        <Text style={{ color: trendColor }}>({formatSignedPercent(dish.changePercent)})</Text>
      </Text>
      <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
        Mínimo {NumberFormat(dish.minPrice)} · máximo {NumberFormat(dish.maxPrice)}
      </Text>
    </View>
  );
}

interface RestaurantCardProps {
  stat: RestaurantStats;
  /** Platos que se repiten en este restaurante (sin eventos) */
  dishes: RestaurantDishHistory[];
}

/** Fila expandible: el estado `expanded` vive aquí, no en el padre. */
export function RestaurantCard({ stat, dishes }: RestaurantCardProps): React.JSX.Element {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          shadowColor: colors.BLACK
        }
      ]}
      activeOpacity={0.7}
      onPress={() => setExpanded((prev) => !prev)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{stat.label}</Text>
          <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
            {stat.visits} {pluralize(stat.visits, 'visita', 'visitas')} ·{' '}
            {NumberFormat(Math.round(stat.totalCost))}
          </Text>
          <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
            {stat.regularVisits > 0 ? `Promedio ${NumberFormat(stat.avgCost)}` : 'Solo en eventos'}{' '}
            · última {formatApiDate(stat.lastDate)}
          </Text>
        </View>
        <Icon
          type="material-community"
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.TEXT_SECONDARY}
        />
      </View>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.BORDER }]}>
          {stat.variants.length > 1 && (
            <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
              Escrito de varias formas: {stat.variants.join(', ')}
            </Text>
          )}
          {stat.viaticosVisits > 0 && (
            <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
              Viáticos: {stat.viaticosVisits} {pluralize(stat.viaticosVisits, 'visita', 'visitas')}{' '}
              · {NumberFormat(Math.round(stat.viaticosCost))}
            </Text>
          )}
          {stat.eventVisits > 0 && (
            <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
              En eventos: {stat.eventVisits} {pluralize(stat.eventVisits, 'visita', 'visitas')} ·{' '}
              {NumberFormat(Math.round(stat.eventCost))}. No entran en el promedio ni en la
              comparación de platos.
            </Text>
          )}

          <Text style={[styles.sectionLabel, { color: colors.TEXT_PRIMARY }]}>
            Precio de platos
          </Text>
          {dishes.length === 0 ? (
            <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
              Sin platos repetidos. Anota «plato — $precio» en las líneas siguientes para comparar.
            </Text>
          ) : (
            dishes.map((dish) => <DishHistoryRow key={dish.dishKey} dish={dish} />)
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: MEDIUM, fontWeight: '600', marginBottom: 4 },
  detail: { fontSize: SMALL, lineHeight: 20 },
  body: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 4 },
  sectionLabel: { fontSize: SMALL + 1, fontWeight: '600', marginTop: 8 },
  dish: { marginTop: 8 },
  dishName: { fontSize: SMALL + 1, fontWeight: '600' }
});
