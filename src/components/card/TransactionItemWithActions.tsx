import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import Popover from 'react-native-popover-view';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { DateFormat, NumberFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface BaseTransaction {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  dateFormat: string;
  iconCategory: string | null;
  category?: string;
  subcategory?: string;
}

interface TransactionItemWithActionsProps<T extends BaseTransaction> {
  item: T;
  type: 'expense' | 'income';
  onEdit: (item: T) => void;
  onDelete: (id: number) => Promise<void>;
  updateList: () => void;
}

export default function TransactionItemWithActions<T extends BaseTransaction>({
  item,
  type,
  onEdit,
  onDelete,
  updateList
}: TransactionItemWithActionsProps<T>) {
  const colors = useThemeColors();
  const [showPopover, setShowPopover] = useState(false);

  const displayName = type === 'expense' ? item.subcategory : item.category;
  const typeColor = type === 'expense' ? colors.WARNING : colors.SUCCESS;

  const handleEdit = (): void => {
    setShowPopover(false);
    onEdit(item);
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await onDelete(item.id);
      ShowToast(`${type === 'expense' ? 'Gasto' : 'Ingreso'} eliminado exitosamente`);
      updateList();
    } catch (error) {
      showError(error);
    }
  };

  const confirmDelete = (): void => {
    setShowPopover(false);
    const message =
      type === 'expense'
        ? `¿Desea eliminar gasto de ${displayName} por ${NumberFormat(item.cost)}?`
        : '¿Desea eliminar este ingreso?';

    Alert.alert('Eliminar', message, [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Eliminar',
        onPress: handleDelete,
        style: 'destructive'
      }
    ]);
  };

  const hasCommentary = item.commentary && item.commentary.trim().length > 0;

  return (
    <View style={[styles.container, { borderBottomColor: colors.BORDER }]}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
        <Icon type="font-awesome" name={item.iconCategory || 'home'} size={20} color={typeColor} />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {displayName}
        </Text>

        {hasCommentary && (
          <Text style={[styles.commentary, { color: colors.TEXT_SECONDARY }]} numberOfLines={3}>
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
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: typeColor }]}>{NumberFormat(item.cost)}</Text>
      </View>

      {/* Actions Popover */}
      <Popover
        isVisible={showPopover}
        onRequestClose={() => setShowPopover(false)}
        popoverStyle={{ backgroundColor: colors.CARD_BACKGROUND }}
        from={
          <TouchableOpacity onPress={() => setShowPopover(true)} style={styles.menuButton}>
            <Icon
              type="material-community"
              name="dots-vertical"
              size={22}
              color={colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>
        }
      >
        <View style={[styles.popoverContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <TouchableOpacity
            style={[styles.popoverItem, { borderBottomColor: colors.BORDER }]}
            onPress={handleEdit}
          >
            <Icon
              type="material-community"
              name="pencil-outline"
              size={18}
              color={colors.INFO}
              containerStyle={{ marginRight: 10 }}
            />
            <Text style={[styles.popoverText, { color: colors.TEXT_PRIMARY }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.popoverItem} onPress={confirmDelete}>
            <Icon
              type="material-community"
              name="delete-outline"
              size={18}
              color={colors.ERROR}
              containerStyle={{ marginRight: 10 }}
            />
            <Text style={[styles.popoverText, { color: colors.TEXT_PRIMARY }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </Popover>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 2
  },
  infoContainer: {
    flex: 1,
    marginRight: 8
  },
  title: {
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
    alignItems: 'flex-end',
    marginRight: 8
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  },
  menuButton: {
    padding: 4
  },
  popoverContainer: {
    minWidth: 160,
    paddingVertical: 4,
    borderRadius: 8
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  popoverText: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  }
});
