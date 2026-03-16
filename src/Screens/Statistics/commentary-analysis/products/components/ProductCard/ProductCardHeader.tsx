import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductSummary } from '../../types';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import { formatPrice } from '../../utils/formatters';
import { NumberFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface ProductCardHeaderProps {
  summary: ProductSummary;
}

export const ProductCardHeader: React.FC<ProductCardHeaderProps> = ({ summary }) => {
  const colors = useThemeColors();

  // Crear ProductPrice temporal para formatear el promedio
  const avgProduct: ProductPrice = {
    cost: 0,
    product: summary.name,
    quantity: 1,
    pricePerKg: summary.avgPrice,
    date: '',
    unit: summary.unit
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={[styles.productName, { color: colors.TEXT_PRIMARY }]}>{summary.name}</Text>
        <Text style={[styles.productCount, { color: colors.TEXT_SECONDARY }]}>
          {summary.count} {summary.count === 1 ? 'compra' : 'compras'}
        </Text>
      </View>

      <View style={[styles.avgBadge, { backgroundColor: colors.PRIMARY + '15' }]}>
        <Text style={[styles.avgBadgeLabel, { color: colors.PRIMARY }]}>Promedio</Text>
        <Text style={[styles.avgBadgeValue, { color: colors.PRIMARY }]}>
          {formatPrice(summary.avgPrice, avgProduct)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  headerLeft: {
    flex: 1
  },
  productName: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  },
  productCount: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  avgBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  avgBadgeLabel: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },
  avgBadgeValue: {
    fontSize: SMALL,
    fontWeight: '700',
    marginTop: 2
  }
});
