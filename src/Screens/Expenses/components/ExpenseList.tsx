import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Icon, Tooltip, TooltipProps } from "react-native-elements";

// Services
import { deleteExpense } from "~/services/expenses";

// Utils
import { showError } from "~/utils/showError";
import { DateFormat, NumberFormat } from "~/utils/Helpers";

// Theme
import { useThemeColors } from "~/customHooks/useThemeColors";

// Types
import { ExpenseModel } from "~/shared/types";

// Styles
import { SMALL, MEDIUM } from "~/styles/fonts";

interface ExpenseListProps {
  expenses: ExpenseModel[];
  updateList: () => void;
}

export default function ExpenseList({ expenses, updateList }: ExpenseListProps) {
  const colors = useThemeColors();

  const deleteItem = async (idExpense: number): Promise<void> => {
    try {
      await deleteExpense(idExpense);
      updateList();
    } catch (err) {
      showError(err);
    }
  };

  const confirmDelete = (id: number): void => {
    Alert.alert("Eliminar gasto", "¿Estás seguro de que deseas eliminar este gasto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", onPress: () => deleteItem(id), style: "destructive" },
    ]);
  };

  if (expenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon
          type="material-community"
          name="receipt-text-outline"
          size={48}
          color={colors.TEXT_SECONDARY}
        />
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
          No hay gastos registrados
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {expenses.map((item) => (
        <ExpenseListItem
          key={item.id}
          item={item}
          onDelete={confirmDelete}
          colors={colors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: MEDIUM,
    marginTop: 12,
  },
});

// ====================================
// COMPONENTE SEPARADO: ExpenseListItem
// ====================================

interface ExpenseListItemProps {
  item: ExpenseModel;
  onDelete: (id: number) => void;
  colors: ReturnType<typeof useThemeColors>;
}

const ExpenseListItem = ({ item, onDelete, colors }: ExpenseListItemProps) => {
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
        itemStyles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderLeftColor: colors.WARNING,
        }
      ]}
    >
      {/* Indicador de gasto */}
      <View style={[itemStyles.indicator, { backgroundColor: colors.WARNING + '15' }]}>
        <Icon
          type="material-community"
          name="cash-minus"
          size={20}
          color={colors.WARNING}
        />
      </View>

      {/* Información del gasto */}
      <View style={itemStyles.infoContainer}>
        <View style={itemStyles.amountRow}>
          <Text style={[itemStyles.amount, { color: colors.TEXT_PRIMARY }]}>
            {NumberFormat(item.cost)}
          </Text>
          
          {hasCommentary && (
            <Tooltip {...tooltipProps}>
              <Icon
                type="material-community"
                name="message-text"
                size={16}
                color={colors.INFO}
              />
            </Tooltip>
          )}
        </View>

        <View style={itemStyles.metaInfo}>
          <Icon
            type="material-community"
            name="calendar"
            size={12}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginRight: 4 }}
          />
          <Text style={[itemStyles.date, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(item.date, "DD MMM")}
          </Text>
          
          <Text style={[itemStyles.separator, { color: colors.TEXT_SECONDARY }]}>•</Text>
          
          <Icon
            type="material-community"
            name="clock-outline"
            size={12}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginRight: 4 }}
          />
          <Text style={[itemStyles.date, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(item.createdAt, "hh:mm a")}
          </Text>
        </View>

        {/* Mostrar comentario directamente si existe */}
        {hasCommentary && (
          <View style={itemStyles.commentaryContainer}>
            <Text 
              style={[itemStyles.commentary, { color: colors.TEXT_SECONDARY }]}
              numberOfLines={2}
            >
              {item.commentary}
            </Text>
          </View>
        )}
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        style={itemStyles.deleteButton}
      >
        <Icon
          type="material-community"
          name="delete-outline"
          size={22}
          color={colors.ERROR}
        />
      </TouchableOpacity>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: "600",
    marginRight: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: SMALL,
  },
  separator: {
    marginHorizontal: 6,
    fontSize: SMALL,
  },
  commentaryContainer: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  commentary: {
    fontSize: SMALL,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  deleteButton: {
    padding: 6,
  },
});