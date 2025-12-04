import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM } from '~/styles/fonts';

// Types
import { SubcategoryExpense } from '~/shared/types/services';

interface ListSubcategoryProps {
  item: SubcategoryExpense;
  index?: number;
}

export default function ListSubcategory({ item, index }: ListSubcategoryProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderLeftColor: colors.PRIMARY
        }
      ]}
    >
      {/* Icono de subcategoría */}
      <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
        <Icon type="material-community" name="label-outline" size={18} color={colors.PRIMARY} />
      </View>

      {/* Información de la subcategoría */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      {/* Monto gastado */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: colors.TEXT_PRIMARY }]}>
          {NumberFormat(item.total)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginVertical: 3,
    borderRadius: 8,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  infoContainer: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '500'
  },
  amountContainer: {
    alignItems: 'flex-end'
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  }
});
