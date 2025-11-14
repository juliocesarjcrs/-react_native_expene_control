import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, Searchbar, IconButton } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { getCategoryWithSubcategories } from '~/services/categories';
import { Category } from '~/shared/types/services';
import { showError } from '~/utils/showError';

interface CategorySelectorProps {
  onChange: (value: { categoryId: number; subcategoriesId: number[] }[]) => void;
}

export default function CategorySelector({ onChange }: CategorySelectorProps) {
  const colors = useThemeColors();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<{ [key: number]: number[] }>({});
  const [expandedCategories, setExpandedCategories] = useState<{ [key: number]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategoryWithSubcategories();
        setCategories(response.data.data);
      } catch (error) {
        showError(error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const formatted = Object.entries(selected).map(([catId, subIds]) => ({
      categoryId: Number(catId),
      subcategoriesId: subIds
    }));
    onChange(formatted);
  }, [selected]);

  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const selectAllInCategory = (catId: number, subcategories: any[]) => {
    const allIds = subcategories.map((s) => s.id);
    const currentSelected = selected[catId] || [];
    const allSelected = allIds.every((id) => currentSelected.includes(id));

    if (allSelected) {
      setSelected((prev) => ({ ...prev, [catId]: [] }));
    } else {
      setSelected((prev) => ({ ...prev, [catId]: allIds }));
    }
  };

  const toggleSubcategory = (catId: number, subId: number) => {
    setSelected((prev) => {
      const subs = prev[catId] || [];
      const newSubs = subs.includes(subId) ? subs.filter((id) => id !== subId) : [...subs, subId];
      return { ...prev, [catId]: newSubs };
    });
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subcategories.some((sub: any) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSelectedCount = () => {
    return Object.values(selected).reduce((acc, subs) => acc + subs.length, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Categorías y subcategorías</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          {getSelectedCount()} subcategorías seleccionadas
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar categorías..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.CARD_BACKGROUND }]}
      />

      <ScrollView style={styles.scrollView} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategories[cat.id];
          const selectedSubs = selected[cat.id] || [];
          const allSelected = selectedSubs.length === cat.subcategories.length && cat.subcategories.length > 0;

          return (
            <View key={cat.id} style={[styles.categoryCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
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
                    <Text style={[styles.categoryName, { color: colors.TEXT_PRIMARY }]}>{cat.name}</Text>
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
                    style={{ marginRight: 4 }}
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
                <View style={styles.subcategoriesContainer}>
                  {cat.subcategories.map((sub: any) => (
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
    maxHeight: 500 // Aumentado para mostrar más categorías
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
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  subcategoryChip: {
    margin: 2
  }
});
