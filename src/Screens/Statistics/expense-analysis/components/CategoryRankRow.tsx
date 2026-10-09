import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { ExpenseAnalysisCategory, ExpenseAnalysisSubcategory } from '~/shared/types/services';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

const FALLBACK_ICON = 'tag-outline';

const formatPercent = (value: number): string => `${value.toFixed(1).replace('.', ',')}%`;

// Ancho mínimo de 2% para que las barras muy pequeñas sigan siendo visibles
const barWidth = (ratio: number): `${number}%` => `${Math.min(Math.max(ratio * 100, 2), 100)}%`;

interface SubcategoryRowProps {
  subcategory: ExpenseAnalysisSubcategory;
}

const SubcategoryRow = ({ subcategory }: SubcategoryRowProps) => {
  const colors = useThemeColors();

  return (
    <View>
      <View style={styles.line}>
        <Text style={[styles.subName, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {subcategory.name}
        </Text>
        <Text style={[styles.subAmount, { color: colors.TEXT_PRIMARY }]}>
          {NumberFormat(Math.round(subcategory.total))}
        </Text>
      </View>
      <View style={[styles.subTrack, { backgroundColor: colors.BORDER }]}>
        <View
          style={[
            styles.fill,
            {
              width: barWidth(subcategory.percentageOfCategory / 100),
              backgroundColor: colors.PRIMARY + '80'
            }
          ]}
        />
      </View>
      <View style={styles.line}>
        <Text style={[styles.secondaryText, { color: colors.TEXT_SECONDARY }]}>
          {formatPercent(subcategory.percentageOfCategory)} de la categoría
        </Text>
        <Text style={[styles.secondaryText, { color: colors.TEXT_SECONDARY }]}>
          Prom. {NumberFormat(Math.round(subcategory.monthlyAverage))}
        </Text>
      </View>
    </View>
  );
};

interface CategoryRankRowProps {
  category: ExpenseAnalysisCategory;
  /** Total de la categoría más grande: define el 100% de la barra */
  maxTotal: number;
  /** Resalta las barras de las categorías con mayor gasto */
  highlighted: boolean;
}

export default function CategoryRankRow({ category, maxTotal, highlighted }: CategoryRankRowProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const ratio = maxTotal > 0 ? category.total / maxTotal : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded((prev) => !prev)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
          <Icon
            type="font-awesome"
            name={category.icon ?? FALLBACK_ICON}
            size={20}
            color={colors.PRIMARY}
          />
        </View>
        <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={[styles.amount, { color: colors.TEXT_PRIMARY }]}>
          {NumberFormat(Math.round(category.total))}
        </Text>
        <Icon
          type="font-awesome"
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.TEXT_SECONDARY}
        />
      </View>

      <View style={[styles.track, { backgroundColor: colors.BORDER }]}>
        <View
          style={[
            styles.fill,
            {
              width: barWidth(ratio),
              backgroundColor: highlighted ? colors.PRIMARY : colors.PRIMARY + '80'
            }
          ]}
        />
      </View>

      <View style={styles.line}>
        <Text style={[styles.percent, { color: colors.PRIMARY }]}>
          {formatPercent(category.percentage)} del total
        </Text>
        <Text style={[styles.secondaryText, { color: colors.TEXT_SECONDARY }]}>
          Prom. mensual {NumberFormat(Math.round(category.monthlyAverage))}
        </Text>
      </View>

      {expanded && (
        <View style={[styles.subcategories, { borderTopColor: colors.BORDER }]}>
          {category.subcategories.map((subcategory) => (
            <SubcategoryRow key={subcategory.id} subcategory={subcategory} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    flex: 1,
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: '700'
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  subTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4
  },
  fill: {
    height: '100%',
    borderRadius: 4
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  percent: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  },
  secondaryText: {
    fontSize: SMALL
  },
  subcategories: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12
  },
  subName: {
    flex: 1,
    fontSize: SMALL + 2,
    fontWeight: '500'
  },
  subAmount: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  }
});
