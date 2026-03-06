import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface StatsGridProps {
  completeCount: number;
  incompleteCount: number;
  totalCount: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  completeCount,
  incompleteCount,
  totalCount
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.grid}>
      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.SUCCESS + '15', borderColor: colors.SUCCESS }
        ]}
      >
        <Icon type="material-community" name="package-variant" size={20} color={colors.SUCCESS} />
        <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>{completeCount}</Text>
        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Con precio</Text>
      </View>

      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.WARNING + '15', borderColor: colors.WARNING }
        ]}
      >
        <Icon
          type="material-community"
          name="alert-circle-outline"
          size={20}
          color={colors.WARNING}
        />
        <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>{incompleteCount}</Text>
        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Sin precio/kg</Text>
      </View>

      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.PRIMARY + '15', borderColor: colors.PRIMARY }
        ]}
      >
        <Icon type="material-community" name="chart-bar" size={20} color={colors.PRIMARY} />
        <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>{totalCount}</Text>
        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Compras</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4
  },
  statValue: {
    fontSize: MEDIUM + 2,
    fontWeight: '700',
    marginTop: 4
  },
  statLabel: {
    fontSize: SMALL - 2,
    textAlign: 'center'
  }
});
