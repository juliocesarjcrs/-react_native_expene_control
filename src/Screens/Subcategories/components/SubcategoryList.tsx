import React from 'react';
import { Alert, FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { deleteSubategory } from '~/services/subcategories';

// Components
import MyIconButton from '~/components/buttons/MyIconButton';

// Types
import { SubcategoriesWithExpenses } from '~/shared/types/services/subcategories-services.type';
import { StackNavigationProp } from '@react-navigation/stack';
import { ExpenseStackParamList } from '~/shared/types';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface SubcategoryListProps {
  data: SubcategoriesWithExpenses[];
  updateList: () => void;
  navigation: StackNavigationProp<ExpenseStackParamList, 'createSubcategory'>;
}

export default function SubcategoryList({ data, updateList, navigation }: SubcategoryListProps) {
  const colors = useThemeColors();

  const deleteItem = async (id: number): Promise<void> => {
    try {
      await deleteSubategory(id);
      updateList();
    } catch (error) {
      showError(error);
    }
  };

  const confirmDelete = (id: number, name: string): void => {
    Alert.alert('Eliminar subcategoría', `¿Estás seguro de que deseas eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: () => deleteItem(id), style: 'destructive' }
    ]);
  };

  const sendEditSubcategoryScreen = (subcategory: SubcategoriesWithExpenses): void => {
    navigation.navigate('editSubcategory', { subcategoryObject: subcategory });
  };

  const renderItem: ListRenderItem<SubcategoriesWithExpenses> = ({ item }) => (
    <SubcategoryListItem item={item} onEdit={sendEditSubcategoryScreen} onDelete={confirmDelete} />
  );

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon
          type="material-community"
          name="folder-open-outline"
          size={48}
          color={colors.TEXT_SECONDARY}
        />
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
          No hay subcategorías creadas
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
}

// ====================================
// COMPONENTE SEPARADO: SubcategoryListItem
// ====================================

interface SubcategoryListItemProps {
  item: SubcategoriesWithExpenses;
  onEdit: (subcategory: SubcategoriesWithExpenses) => void;
  onDelete: (id: number, name: string) => void;
}

const SubcategoryListItem = ({ item, onEdit, onDelete }: SubcategoryListItemProps) => {
  const colors = useThemeColors();
  const expenseCount = item.expenses?.length || 0;
  const hasExpenses = expenseCount > 0;

  return (
    <View
      style={[
        itemStyles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderLeftColor: colors.PRIMARY
        }
      ]}
    >
      {/* Icono de subcategoría */}
      <View style={[itemStyles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
        <Icon type="material-community" name="label" size={20} color={colors.PRIMARY} />
      </View>

      {/* Información de la subcategoría */}
      <View style={itemStyles.infoContainer}>
        <Text style={[itemStyles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {item.name}
        </Text>

        {hasExpenses && (
          <View style={itemStyles.expenseInfo}>
            <Icon
              type="material-community"
              name="receipt-text-outline"
              size={14}
              color={colors.TEXT_SECONDARY}
              containerStyle={itemStyles.expenseIcon}
            />
            <Text style={[itemStyles.expenseCount, { color: colors.TEXT_SECONDARY }]}>
              {expenseCount} {expenseCount === 1 ? 'gasto' : 'gastos'}
            </Text>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <View style={itemStyles.actionsContainer}>
        <MyIconButton variant="edit" onPress={() => onEdit(item)} />
        <MyIconButton
          variant="delete"
          onPress={() => onDelete(item.id, item.name)}
          disabled={hasExpenses}
        />
      </View>

      {/* Badge de advertencia si tiene gastos */}
      {hasExpenses && (
        <View style={[itemStyles.warningBadge, { backgroundColor: colors.WARNING + '15' }]}>
          <Icon
            type="material-community"
            name="alert"
            size={14}
            color={colors.WARNING}
            containerStyle={itemStyles.expenseIcon}
          />
          <Text style={[itemStyles.warningText, { color: colors.WARNING }]}>
            No se puede eliminar (tiene gastos)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 8,
    paddingTop: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: MEDIUM,
    marginTop: 12
  }
});

const itemStyles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    marginRight: 12
  },
  infoContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8
  },
  name: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  expenseIcon: {
    marginRight: 4
  },
  expenseCount: {
    fontSize: SMALL
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8
  },
  warningBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12
  },
  warningText: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  }
});
