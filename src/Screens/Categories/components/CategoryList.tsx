import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  ListRenderItem
} from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { deleteCategory } from '~/services/categories';
// Components
import { CategoryListItem } from './CategoryListItem';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Types
import { CategoryModel } from '~/shared/types';

// Styles
import { MEDIUM } from '~/styles/fonts';

interface CategoryListProps {
  data: CategoryModel[];
  updateList: () => void;
}

export default function CategoryList({ data, updateList }: CategoryListProps) {
  const colors = useThemeColors();

  const confirmDelete = (id: number, name: string): void => {
    Alert.alert('Eliminar categoría', `¿Estás seguro de que deseas eliminar "${name}"?`, [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Eliminar',
        onPress: () => deleteItem(id),
        style: 'destructive'
      }
    ]);
  };

  const deleteItem = async (idCategory: number): Promise<void> => {
    try {
      await deleteCategory(idCategory);
      updateList();
    } catch (error) {
      showError(error);
    }
  };

  const renderItem: ListRenderItem<CategoryModel> = ({ item }) => (
    <CategoryListItem item={item} onDelete={confirmDelete} colors={colors} />
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
          No hay categorías creadas
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
