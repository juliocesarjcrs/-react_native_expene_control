import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import { formatPrice } from '../../utils/formatters';
import { DateFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface ProductCardDetailProps {
  purchases: ProductPrice[];
  onPurchasePress: (purchase: ProductPrice) => void;
}

export const ProductCardDetail: React.FC<ProductCardDetailProps> = ({
  purchases,
  onPurchasePress
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND + 'CC' }]}>
      <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.headerText, { color: colors.TEXT_SECONDARY }]}>
          {purchases.length} {purchases.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      {purchases.map((purchase, index) => (
        <TouchableOpacity
          key={`${purchase.date}-${index}`}
          style={[styles.purchaseRow, { borderBottomColor: colors.BORDER }]}
          onPress={() => onPurchasePress(purchase)}
          activeOpacity={0.7}
        >
          <View style={styles.purchaseLeft}>
            <Text style={[styles.purchaseDate, { color: colors.TEXT_PRIMARY }]}>
              📅 {DateFormat(purchase.date, 'ddd DD MMM YYYY')}
            </Text>
            <View style={styles.purchaseDetails}>
              <Text style={[styles.purchaseQuantity, { color: colors.TEXT_SECONDARY }]}>
                {purchase.quantity} {purchase.unit || 'kg'}
              </Text>
              {purchase.store && (
                <Text style={[styles.purchaseStore, { color: colors.TEXT_SECONDARY }]}>
                  · {purchase.store}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.purchaseRight}>
            <Text style={[styles.purchasePrice, { color: colors.TEXT_PRIMARY }]}>
              {formatPrice(purchase.pricePerKg, purchase)}
            </Text>
            {purchase.discountPercent && (
              <View style={[styles.discountBadge, { backgroundColor: colors.SUCCESS }]}>
                <Text style={styles.discountText}>-{purchase.discountPercent}%</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden'
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  headerText: {
    fontSize: SMALL - 1,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  purchaseLeft: {
    flex: 1
  },
  purchaseDate: {
    fontSize: SMALL,
    fontWeight: '500',
    marginBottom: 2
  },
  purchaseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  purchaseQuantity: {
    fontSize: SMALL - 1
  },
  purchaseStore: {
    fontSize: SMALL - 1
  },
  purchaseRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  purchasePrice: {
    fontSize: SMALL,
    fontWeight: '700'
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  discountText: {
    fontSize: SMALL - 3,
    fontWeight: '700',
    color: '#fff'
  }
});
