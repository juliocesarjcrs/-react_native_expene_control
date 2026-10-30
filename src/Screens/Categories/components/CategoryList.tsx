import React from 'react';
import { FlatList, StyleSheet, Text, View, ListRenderItem } from 'react-native';
import { Icon } from 'react-native-elements';

// Components
import { CategoryListItem } from './CategoryListItem';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Types
import { CategoryModel } from '~/shared/types';

// Styles
import { MEDIUM } from '~/styles/fonts';
import { useDeleteCategory } from '~/customHooks/useDeleteCategory';

interface CategoryListProps {
  data: CategoryModel[];
  updateList: () => void;
}

export default function CategoryList({ data, updateList }: CategoryListProps) {
  const colors = useThemeColors();
  const { requestDelete, busyId } = useDeleteCategory(updateList);

  const renderItem: ListRenderItem<CategoryModel> = ({ item }) => (
    <CategoryListItem
      item={item}
      onDelete={requestDelete}
      disabled={busyId !== null}
      colors={colors}
    />
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
