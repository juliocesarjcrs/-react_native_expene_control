import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Text
} from 'react-native';
import { Icon } from 'react-native-elements';
import { ProductPrice } from '~/shared/types/screens/Statistics/commentary-analysis.types';
import { ProductSummary } from '../../types';
import { ProductCardHeader } from './ProductCardHeader';
import { ProductCardPrices } from './ProductCardPrices';
import { ProductCardDetail } from './ProductCardDetail';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { NumberFormat } from '~/utils/Helpers';
import { formatPrice } from '../../utils/formatters';

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProductCardProps {
  summary: ProductSummary;
  purchases: ProductPrice[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPurchasePress: (purchase: ProductPrice) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  summary,
  purchases,
  isExpanded,
  onToggleExpand,
  onPurchasePress
}) => {
  const colors = useThemeColors();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
  };

  // Crear ProductPrice temporal para formatear el ahorro
  const avgProduct: ProductPrice = {
    cost: 0,
    product: summary.name,
    quantity: 1,
    pricePerKg: summary.savings,
    date: '',
    unit: summary.unit
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <TouchableOpacity style={styles.cardContent} onPress={handleToggle} activeOpacity={0.7}>
        {/* Cabecera: nombre + promedio */}
        <ProductCardHeader summary={summary} />

        {/* Mejor/peor precio */}
        <ProductCardPrices best={summary.best} worst={summary.worst} unit={summary.unit} />

        {/* Ahorro potencial */}
        {summary.savings > 0 && (
          <View style={[styles.savingsContainer, { backgroundColor: colors.INFO + '15' }]}>
            <Icon type="material-community" name="piggy-bank" size={16} color={colors.INFO} />
            <Text style={[styles.savingsText, { color: colors.INFO }]}>
              Ahorro potencial: {formatPrice(summary.savings, avgProduct)}
            </Text>
          </View>
        )}

        {/* Indicador de expansión */}
        <View style={styles.expandIndicator}>
          <Icon
            type="material-community"
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.TEXT_SECONDARY}
          />
          <Text style={[styles.expandText, { color: colors.TEXT_SECONDARY }]}>
            {isExpanded ? 'Ocultar' : 'Ver'} detalle
          </Text>
        </View>
      </TouchableOpacity>

      {/* Detalle expandible: lista de compras */}
      {isExpanded && <ProductCardDetail purchases={purchases} onPurchasePress={onPurchasePress} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden'
  },
  cardContent: {
    padding: 12,
    gap: 10
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 8,
    marginTop: 4
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 8
  },
  expandText: {
    fontSize: 12,
    fontWeight: '500'
  }
});
