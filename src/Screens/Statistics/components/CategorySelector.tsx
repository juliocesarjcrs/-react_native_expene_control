import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, Searchbar, IconButton } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { getCategoryWithSubcategories } from '~/services/categories';
import { CategoryExpense } from '~/shared/types/services';
import { showError } from '~/utils/showError';

type Subcategory = CategoryExpense['subcategories'][number];
type SelectedMap = Record<number, number[]>;
type SelectionValue = { categoryId: number; subcategoriesId: number[] }[];

interface CategorySelectorProps {
  onChange: (value: SelectionValue) => void;
}

const formatSelection = (selected: SelectedMap): SelectionValue =>
  Object.entries(selected).map(([catId, subIds]) => ({
    categoryId: Number(catId),
    subcategoriesId: subIds
  }));

export default function CategorySelector({ onChange }: CategorySelectorProps) {
  const colors = useThemeColors();
  const [categories, setCategories] = useState<CategoryExpense[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await getCategoryWithSubcategories();
        if (isMounted) setCategories(response.data.data);
      } catch (error) {
        if (isMounted) showError(error);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Actualiza la selección y avisa al padre en el mismo evento
  const applySelection = (next: SelectedMap) => {
    setSelected(next);
    onChange(formatSelection(next));
  };

  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const selectAllInCategory = (catId: number, subcategories: Subcategory[]) => {
    const allIds = subcategories.map((s) => s.id);
    const currentSelected = selected[catId] ?? [];
    const allSelected = allIds.every((id) => currentSelected.includes(id));

    applySelection({ ...selected, [catId]: allSelected ? [] : allIds });
  };

  const toggleSubcategory = (catId: number, subId: number) => {
    const subs = selected[catId] ?? [];
    const newSubs = subs.includes(subId) ? subs.filter((id) => id !== subId) : [...subs, subId];
    applySelection({ ...selected, [catId]: newSubs });
  };

  const query = searchQuery.toLowerCase();
  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(query) ||
      cat.subcategories.some((sub) => sub.name.toLowerCase().includes(query))
  );

  const selectedCount = Object.values(selected).reduce((acc, subs) => acc + subs.length, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Categorías y subcategorías
        </Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          {selectedCount} subcategorías seleccionadas
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar categorías..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.CARD_BACKGROUND }]}
        iconColor={colors.TEXT_SECONDARY}
        placeholderTextColor={colors.TEXT_SECONDARY}
      />

      <ScrollView style={styles.scrollView} nestedScrollEnabled>
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategories[cat.id];
          const selectedSubs = selected[cat.id] ?? [];
          const allSelected =
            selectedSubs.length === cat.subcategories.length && cat.subcategories.length > 0;

          return (
            <View
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: colors.CARD_BACKGROUND }]}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Icon
                    type="font-awesome"
                    name={cat.icon || 'folder'}
                    size={20}
                    color={colors.PRIMARY}
                    containerStyle={styles.iconContainer}
                  />
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.TEXT_PRIMARY }]}>
                      {cat.name}
                    </Text>
                    <Text style={[styles.subcategoryCount, { color: colors.TEXT_SECONDARY }]}>
                      {selectedSubs.length}/{cat.subcategories.length} seleccionadas
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryActions}>
                  <Chip
                    selected={allSelected}
                    onPress={() => selectAllInCategory(cat.id, cat.subcategories)}
                    mode="outlined"
                    compact
                    style={styles.selectAllChip}
                  >
                    {allSelected ? 'Quitar' : 'Todas'}
                  </Chip>
                  <IconButton
                    icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    onPress={() => toggleCategory(cat.id)}
                  />
                </View>
              </View>

              {isExpanded && (
                <View style={[styles.subcategoriesContainer, { borderTopColor: colors.BORDER }]}>
                  {cat.subcategories.map((sub) => (
                    <Chip
                      key={sub.id}
                      selected={selectedSubs.includes(sub.id)}
                      onPress={() => toggleSubcategory(cat.id, sub.id)}
                      style={styles.subcategoryChip}
                      mode="outlined"
                    >
                      {sub.name}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  header: {
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4
  },
  searchBar: {
    marginBottom: 12,
    elevation: 1
  },
  scrollView: {
    maxHeight: 500
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 2
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    marginRight: 12
  },
  categoryInfo: {
    flex: 1
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600'
  },
  subcategoryCount: {
    fontSize: 11,
    marginTop: 2
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectAllChip: {
    marginRight: 4
  },
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1
  },
  subcategoryChip: {
    margin: 2
  }
});
