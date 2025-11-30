import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';


// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { Transaction } from './LastTransactionsCard';

interface TransactionItemProps {
  item: Transaction;
  type: 'expense' | 'income';
  colors: ReturnType<typeof useThemeColors>;
}

export const TransactionItem = ({ item, type, colors }: TransactionItemProps) => {
  const hasCommentary = item.commentary && item.commentary.trim().length > 0;
  const displayName = type === 'expense' ? item.subcategory : item.category;

  return (
    <View style={[itemStyles.container, { borderBottomColor: colors.BORDER }]}>
      {/* Icon */}
      <View style={[itemStyles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
        <Icon
          type="font-awesome"
          name={item.iconCategory || 'home'}
          size={18}
          color={colors.PRIMARY}
        />
      </View>

      {/* Info */}
      <View style={itemStyles.infoContainer}>
        <Text 
          style={[itemStyles.name, { color: colors.TEXT_PRIMARY }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        
        {hasCommentary && (
          <Text 
            style={[itemStyles.commentary, { color: colors.TEXT_SECONDARY }]}
            numberOfLines={1}
          >
            {item.commentary}
          </Text>
        )}

        <View style={itemStyles.dateRow}>
          <Icon
            type="material-community"
            name="calendar"
            size={11}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginRight: 3 }}
          />
          <Text style={[itemStyles.date, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(item.dateFormat, 'DD MMM YYYY')}
          </Text>
          <Text style={[itemStyles.separator, { color: colors.TEXT_SECONDARY }]}>•</Text>
          <Icon
            type="material-community"
            name="clock-outline"
            size={11}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginRight: 3 }}
          />
          <Text style={[itemStyles.date, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(item.createdAt, 'hh:mm a')}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View style={itemStyles.amountContainer}>
        <Text 
          style={[
            itemStyles.amount, 
            { color: type === 'expense' ? colors.WARNING : colors.SUCCESS }
          ]}
        >
          {NumberFormat(item.cost)}
        </Text>
      </View>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentary: {
    fontSize: SMALL,
    marginBottom: 3,
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: SMALL - 1,
  },
  separator: {
    marginHorizontal: 4,
    fontSize: SMALL - 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
  },
});