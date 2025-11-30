import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

// Types
import { ListResultSearchProps } from '~/shared/types/components/card';

export const ListResultSearch: React.FC<ListResultSearchProps> = (item) => {
  const colors = useThemeColors();
  const hasCommentary = item.commentary && item.commentary.trim().length > 0;
  const hasSubcategory = item.subcategory && item.subcategory.trim().length > 0;

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
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
        <Icon type="font-awesome" name={item.iconCategory || 'home'} size={20} color={colors.PRIMARY} />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        {hasSubcategory && (
          <Text style={[styles.subcategory, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
            {item.subcategory}
          </Text>
        )}

        {hasCommentary && (
          <Text style={[styles.commentary, { color: colors.TEXT_SECONDARY }]} numberOfLines={2}>
            {item.commentary}
          </Text>
        )}

        <View style={styles.dateRow}>
          <Icon
            type="material-community"
            name="calendar"
            size={11}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginRight: 3 }}
          />
          <Text style={[styles.date, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(item.dateFormat, 'DD MMM YYYY')}
          </Text>

          {item.createdAt && (
            <>
              <Text style={[styles.separator, { color: colors.TEXT_SECONDARY }]}>•</Text>
              <Icon
                type="material-community"
                name="clock-outline"
                size={11}
                color={colors.TEXT_SECONDARY}
                containerStyle={{ marginRight: 3 }}
              />
              <Text style={[styles.date, { color: colors.TEXT_SECONDARY }]}>
                {DateFormat(item.createdAt, 'hh:mm a')}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: colors.SUCCESS }]}>{NumberFormat(item.amount)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  infoContainer: {
    flex: 1,
    marginRight: 8
  },
  subcategory: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginBottom: 3
  },
  commentary: {
    fontSize: SMALL,
    marginBottom: 4,
    fontStyle: 'italic',
    lineHeight: 16
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  date: {
    fontSize: SMALL - 1
  },
  separator: {
    marginHorizontal: 4,
    fontSize: SMALL - 1
  },
  amountContainer: {
    alignItems: 'flex-end'
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  }
});
