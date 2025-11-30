import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { Icon, Divider } from 'react-native-elements';

// Services
import { deleteIncome } from '~/services/incomes';

// Utils
import { showError } from '~/utils/showError';
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Types
import { CategoryIncomesSumary } from '~/shared/types/services';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { IncomeListItem } from './IncomeListItem';

interface MyAcordeonIncomeProps {
  data: CategoryIncomesSumary;
  editCategory: (id: number) => void;
  updateList: () => void;
}

export default function MyAcordeonIncome({ data, editCategory, updateList }: MyAcordeonIncomeProps) {
  const colors = useThemeColors();
  const { id, icon, name } = data;
  const [expanded, setExpanded] = useState<boolean>(false);

  const sendEditCategoryScreen = (categoryId: number): void => {
    editCategory(categoryId);
  };

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  const confirmDelete = (incomeId: number): void => {
    Alert.alert('Eliminar ingreso', '¿Estás seguro de que deseas eliminar este ingreso?', [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Eliminar',
        onPress: () => deleteItem(incomeId),
        style: 'destructive'
      }
    ]);
  };

  const deleteItem = async (incomeId: number): Promise<void> => {
    try {
      await deleteIncome(incomeId);
      updateList();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
        {/* Header con título e iconos */}
        <View style={styles.headerRow}>
          <View style={styles.titleSection}>
            <Icon
              type="font-awesome"
              name={icon || 'home'}
              size={22}
              color={expanded ? colors.PRIMARY : colors.TEXT_SECONDARY}
            />
            <Text
              style={[
                styles.categoryName,
                {
                  color: expanded ? colors.PRIMARY : colors.TEXT_PRIMARY,
                  fontWeight: expanded ? 'bold' : 'normal'
                }
              ]}
            >
              {name}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.SUCCESS + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.SUCCESS }]}>{data.incomes.length}</Text>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Icon
              type="material-community"
              name="pencil-outline"
              size={20}
              color={colors.TEXT_SECONDARY}
              onPress={() => sendEditCategoryScreen(id)}
              containerStyle={styles.iconButton}
            />
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              type="font-awesome"
              size={20}
              color={colors.TEXT_SECONDARY}
              onPress={toggleExpanded}
              containerStyle={styles.iconButton}
            />
          </View>
        </View>

        {/* Total de ingresos */}
        <View style={styles.totalSection}>
          <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>Total ingresos:</Text>
          <Text style={[styles.totalAmount, { color: colors.SUCCESS }]}>{NumberFormat(data.total)}</Text>
        </View>

        <Divider style={{ backgroundColor: colors.BORDER, marginTop: 8 }} />
      </View>

      {/* Lista de ingresos expandible */}
      <View>
        {expanded &&
          data.incomes.map((item) => (
            <IncomeListItem key={item.id} item={item} onDelete={confirmDelete} colors={colors} />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoryName: {
    fontSize: MEDIUM,
    marginLeft: 10,
    marginRight: 6
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  badgeText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    marginLeft: 8
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8
  },
  totalLabel: {
    fontSize: SMALL
  },
  totalAmount: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  }
});
