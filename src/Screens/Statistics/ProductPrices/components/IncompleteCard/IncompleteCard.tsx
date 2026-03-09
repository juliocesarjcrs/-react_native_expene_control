import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Icon } from 'react-native-elements';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/commentary-analysis.types';
import { ProductSummary } from '../../types';
import { IncompleteCardDetail } from './IncompleteCardDetail';
import { NumberFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface IncompleteCardProps {
  summary: ProductSummary;
  purchases: ProductPrice[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditPress: (purchase: ProductPrice) => void;
}

export const IncompleteCard: React.FC<IncompleteCardProps> = ({
  summary,
  purchases,
  isExpanded,
  onToggleExpand,
  onEditPress
}) => {
  const colors = useThemeColors();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.WARNING + '40' }
      ]}
    >
      <TouchableOpacity style={styles.cardContent} onPress={handleToggle} activeOpacity={0.7}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.nameRow}>
              <Text style={[styles.productName, { color: colors.TEXT_PRIMARY }]}>
                {summary.name}
              </Text>
              <View style={[styles.incompleteBadge, { backgroundColor: colors.WARNING + '20' }]}>
                <Text style={[styles.incompleteBadgeText, { color: colors.WARNING }]}>
                  Sin precio/kg
                </Text>
              </View>
            </View>
            <Text style={[styles.productCount, { color: colors.TEXT_SECONDARY }]}>
              {summary.count} {summary.count === 1 ? 'compra' : 'compras'}
              {summary.stores.length > 0 && ` · ${summary.stores.join(', ')}`}
            </Text>
          </View>

          {/* Badge de costo total */}
          <View style={[styles.totalBadge, { backgroundColor: colors.WARNING + '15' }]}>
            <Text style={[styles.totalBadgeLabel, { color: colors.WARNING }]}>Total</Text>
            <Text style={[styles.totalBadgeValue, { color: colors.WARNING }]}>
              {NumberFormat(summary.totalCost)}
            </Text>
          </View>
        </View>

        {/* Indicador de expansión */}
        <View style={styles.expandIndicator}>
          <Icon
            type="material-community"
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.TEXT_SECONDARY}
          />
          <Text style={[styles.expandText, { color: colors.TEXT_SECONDARY }]}>
            {isExpanded ? 'Ocultar' : 'Ver'} registros
          </Text>
        </View>
      </TouchableOpacity>

      {/* Detalle expandible */}
      {isExpanded && <IncompleteCardDetail purchases={purchases} onEditPress={onEditPress} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    opacity: 0.85
  },
  cardContent: {
    padding: 12,
    gap: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  headerLeft: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  productName: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  },
  productCount: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  incompleteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  incompleteBadgeText: {
    fontSize: SMALL - 3,
    fontWeight: '600'
  },
  totalBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  totalBadgeLabel: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },
  totalBadgeValue: {
    fontSize: SMALL,
    fontWeight: '700',
    marginTop: 2
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
