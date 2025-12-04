import React from 'react';
import { Text, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Tooltip, TooltipProps } from 'react-native-elements';

import { IncomeModel } from '~/shared/types';
import { MEDIUM, SMALL } from '~/styles/fonts';
// Utils

import { NumberFormat, DateFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

interface IncomeListItemProps {
  item: IncomeModel;
  onDelete: (id: number) => void;
  colors: ReturnType<typeof useThemeColors>;
}

export const IncomeListItem = ({ item, onDelete, colors }: IncomeListItemProps) => {
  const hasCommentary = item.commentary && item.commentary.trim().length > 0;

  const tooltipProps: TooltipProps = {
    withPointer: true,
    popover: (
      <View style={{ padding: 4 }}>
        <Text style={{ color: colors.WHITE, fontSize: SMALL }}>
          {item.commentary || 'Sin comentario'}
        </Text>
      </View>
    ),
    toggleOnPress: true,
    toggleAction: 'onPress',
    height: 80,
    width: 200,
    containerStyle: {},
    pointerColor: colors.CARD_BACKGROUND,
    onClose: () => {},
    onOpen: () => {},
    overlayColor: 'transparent',
    withOverlay: true,
    backgroundColor: colors.TEXT_PRIMARY,
    highlightColor: 'transparent',
    skipAndroidStatusBar: false,
    ModalComponent: Modal,
    closeOnlyOnBackdropPress: false
  };

  return (
    <View
      style={[
        incomeItemStyles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderLeftColor: colors.SUCCESS
        }
      ]}
    >
      {/* Fecha y hora */}
      <View style={incomeItemStyles.dateContainer}>
        <Text style={[incomeItemStyles.date, { color: colors.TEXT_PRIMARY }]}>
          {DateFormat(item.date, 'DD MMM')}
        </Text>
        {item.createdAt && (
          <Text style={[incomeItemStyles.time, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(item.createdAt, 'hh:mm a')}
          </Text>
        )}
      </View>

      {/* Monto con tooltip opcional */}
      <View style={incomeItemStyles.amountContainer}>
        {hasCommentary ? (
          <Tooltip {...tooltipProps}>
            <View style={incomeItemStyles.amountWithIcon}>
              <Text style={[incomeItemStyles.amount, { color: colors.SUCCESS }]}>
                {NumberFormat(item.amount)}
              </Text>
              <Icon
                type="material-community"
                name="message-text-outline"
                size={16}
                color={colors.INFO}
                containerStyle={{ marginLeft: 4 }}
              />
            </View>
          </Tooltip>
        ) : (
          <Text style={[incomeItemStyles.amount, { color: colors.SUCCESS }]}>
            {NumberFormat(item.amount)}
          </Text>
        )}
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity onPress={() => onDelete(item.id)} style={incomeItemStyles.deleteButton}>
        <Icon type="material-community" name="delete-outline" size={20} color={colors.ERROR} />
      </TouchableOpacity>
    </View>
  );
};

const incomeItemStyles = StyleSheet.create({
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
  dateContainer: {
    flex: 1
  },
  date: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 2
  },
  time: {
    fontSize: SMALL
  },
  amountContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12
  },
  amountWithIcon: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  },
  deleteButton: {
    padding: 4
  }
});
