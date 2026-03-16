import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import { formatPrice } from '../../utils/formatters';
import { DateFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface ProductCardPricesProps {
  best: ProductPrice | null;
  worst: ProductPrice | null;
  unit: 'kg' | 'un';
}

export const ProductCardPrices: React.FC<ProductCardPricesProps> = ({ best, worst }) => {
  const colors = useThemeColors();

  if (!best || !worst) return null;

  const bestHasDiscount = best.originalPricePerKg && best.discountPercent;

  return (
    <View style={styles.container}>
      {/* Mejor precio */}
      <View
        style={[
          styles.priceBox,
          { backgroundColor: colors.SUCCESS + '10', borderColor: colors.SUCCESS }
        ]}
      >
        <View style={styles.priceHeader}>
          <Icon type="material-community" name="arrow-down" size={16} color={colors.SUCCESS} />
          <Text style={[styles.priceLabel, { color: colors.SUCCESS }]}>Mejor precio</Text>
        </View>

        {/* Precio original tachado + descuento si aplica */}
        {bestHasDiscount && (
          <View style={styles.discountRow}>
            <Text style={[styles.strikePrice, { color: colors.TEXT_SECONDARY }]}>
              {formatPrice(best.originalPricePerKg!, best)}
            </Text>
            <View style={[styles.discountBadge, { backgroundColor: colors.SUCCESS }]}>
              <Text style={styles.discountText}>-{best.discountPercent}%</Text>
            </View>
          </View>
        )}

        <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
          {formatPrice(best.pricePerKg, best)}
        </Text>
        {best.store && (
          <Text style={[styles.priceStore, { color: colors.TEXT_SECONDARY }]}>📍 {best.store}</Text>
        )}
        <Text style={[styles.priceDate, { color: colors.TEXT_SECONDARY }]}>
          {DateFormat(best.date, 'DD MMM YYYY')}
        </Text>
      </View>

      {/* Mayor precio */}
      <View
        style={[
          styles.priceBox,
          { backgroundColor: colors.ERROR + '10', borderColor: colors.ERROR }
        ]}
      >
        <View style={styles.priceHeader}>
          <Icon type="material-community" name="arrow-up" size={16} color={colors.ERROR} />
          <Text style={[styles.priceLabel, { color: colors.ERROR }]}>Mayor precio</Text>
        </View>

        <Text style={[styles.priceValue, { color: colors.TEXT_PRIMARY }]}>
          {formatPrice(worst.pricePerKg, worst)}
        </Text>
        {worst.store && (
          <Text style={[styles.priceStore, { color: colors.TEXT_SECONDARY }]}>
            📍 {worst.store}
          </Text>
        )}
        <Text style={[styles.priceDate, { color: colors.TEXT_SECONDARY }]}>
          {DateFormat(worst.date, 'DD MMM YYYY')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  priceBox: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  priceLabel: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  priceValue: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  },
  priceStore: {
    fontSize: SMALL - 2
  },
  priceDate: {
    fontSize: SMALL - 2
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  strikePrice: {
    fontSize: SMALL - 1,
    textDecorationLine: 'line-through'
  },
  discountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  discountText: {
    fontSize: SMALL - 2,
    fontWeight: '700',
    color: '#fff'
  }
});
