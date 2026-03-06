import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { ProductPrice } from '~/shared/types/screens/Statistics/commentary-analysis.types';
import { DateFormat, NumberFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface IncompleteCardDetailProps {
  purchases: ProductPrice[];
  onEditPress: (purchase: ProductPrice) => void;
}

export const IncompleteCardDetail: React.FC<IncompleteCardDetailProps> = ({
  purchases,
  onEditPress
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.WARNING + '08' }]}>
      <View style={[styles.warningHeader, { backgroundColor: colors.WARNING + '15' }]}>
        <Icon
          type="material-community"
          name="alert-circle-outline"
          size={14}
          color={colors.WARNING}
        />
        <Text style={[styles.warningText, { color: colors.WARNING }]}>
          Sin precio/kg. Edita para incluir en análisis.
        </Text>
      </View>

      {purchases.map((purchase, index) => (
        <View
          key={`${purchase.date}-${index}`}
          style={[styles.incompleteRow, { borderBottomColor: colors.BORDER }]}
        >
          <View style={styles.incompleteLeft}>
            <Text style={[styles.incompleteDate, { color: colors.TEXT_PRIMARY }]}>
              📅 {DateFormat(purchase.date, 'DD MMM YYYY')}
            </Text>
            <Text style={[styles.incompleteCost, { color: colors.TEXT_SECONDARY }]}>
              Costo total: {NumberFormat(purchase.cost)}
            </Text>
            {purchase.store && (
              <Text style={[styles.incompleteStore, { color: colors.TEXT_SECONDARY }]}>
                📍 {purchase.store}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => onEditPress(purchase)}
            activeOpacity={0.8}
          >
            <Icon type="material-community" name="pencil" size={14} color="#fff" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
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
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  warningText: {
    flex: 1,
    fontSize: SMALL - 2,
    fontWeight: '600',
    lineHeight: 16
  },
  incompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  incompleteLeft: {
    flex: 1,
    gap: 2
  },
  incompleteDate: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  incompleteCost: {
    fontSize: SMALL - 1
  },
  incompleteStore: {
    fontSize: SMALL - 1
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  editButtonText: {
    fontSize: SMALL - 1,
    fontWeight: '600',
    color: '#fff'
  }
});
