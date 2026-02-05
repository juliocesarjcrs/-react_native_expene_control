import React, { useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { getSubategoriesByCategory } from '../../services/subcategories';
import { findIncomesByCategoryId } from '../../services/incomes';
import { findExpensesBySubcategories } from '../../services/expenses';

// Types
import { SubcategoryModel } from '../../shared/types';
import { DropDownSelectFormat } from '../../shared/types/components';
import { ListResultSearchProps } from '../../shared/types/components/card';
import { IncomeSearchOptionsQuery } from '../../shared/types/services/income-service.type';
import { ExpenseSearchOptionsQuery } from '../../shared/types/services/expense-service.type';

// Components
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import { RadioButtonGroup } from '../../components/radioButton';
import { DateSelector } from '../../components/datePicker';
import { ListResultSearch } from '../../components/card';
import { ScreenHeader } from '~/components/ScreenHeader';

// Hooks & Utils
import { showError } from '../../utils/showError';
import { NumberFormat } from '../../utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import BarSearch from '~/components/search/BarSearch';

export default function AdvancedSearchScreen() {
  const config = screenConfigs.advancedSearch;
  const colors = useThemeColors();
  const selectOnlyCategoryRef = useRef<any>(null);

  const [selectedCategory, setSelectedCategory] = useState<DropDownSelectFormat | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryModel[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
  const [searchType, setSearchType] = useState<number>(1); // Default: Ingreso
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const [resultSearch, setResultSearch] = useState<ListResultSearchProps[]>([]);
  const [sumResultSearch, setSumResultSearch] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCategoryChange = async (categorySelectFormat: DropDownSelectFormat) => {
    const categoryId = categorySelectFormat.id;
    try {
      const { data } = await getSubategoriesByCategory(categoryId, { withExpenses: false });
      setSubcategories(data as SubcategoryModel[]);
      setSelectedCategory(categorySelectFormat);
      setSelectedSubcategories([]);
      setResultSearch([]);
      setHasSearched(false);
    } catch (error) {
      showError(error);
    }
  };

  const handleSearch = async (searchText: string) => {
    try {
      if (searchType === 1 && selectedCategory) {
        const queryParams: IncomeSearchOptionsQuery = {
          startDate,
          endDate,
          searchValue: searchText,
          orderBy: 'date'
        };
        const { data } = await findIncomesByCategoryId(selectedCategory.id, queryParams);
        const dataResultSearchFormated: ListResultSearchProps[] = data.incomes.map((e) => {
          return {
            id: e.id,
            iconCategory: selectedCategory.iconName,
            subcategory: 'N/A',
            commentary: e.commentary,
            amount: e.amount,
            dateFormat: e.date,
            createdAt: e.createdAt
          };
        });

        setResultSearch(dataResultSearchFormated);
        setSumResultSearch(data.sum);
      } else if (searchType === 0 && selectedCategory) {
        if (selectedSubcategories.length === 0) {
          showError(
            { message: 'Debe seleccionar al menos una subcategoría' },
            'Debe seleccionar al menos una subcategoría'
          );
          return;
        }

        const queryParams: ExpenseSearchOptionsQuery = {
          subcategoriesId: selectedSubcategories,
          startDate,
          endDate,
          searchValue: searchText,
          orderBy: 'date'
        };
        const { data } = await findExpensesBySubcategories(queryParams);
        const dataResultSearchFormated: ListResultSearchProps[] = data.expenses.map((e) => {
          return {
            id: e.id,
            iconCategory: selectedCategory.iconName,
            subcategory: e.subcategory.name,
            commentary: e.commentary,
            amount: e.cost,
            dateFormat: e.date,
            createdAt: e.createdAt
          };
        });

        setResultSearch(dataResultSearchFormated);
        setSumResultSearch(data.sum);
      }
      setHasSearched(true);
    } catch (error) {
      showError(error);
    }
  };

  const handleSearchTypeChange = (value: number) => {
    setSelectedSubcategories([]);
    setResultSearch([]);
    setHasSearched(false);
    setSearchType(value);
  };

  const toggleSubcategory = (subcategoryId: number) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategoryId)
        ? prev.filter((id) => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      {/* Header fijo con filtros */}
      <View style={[styles.filterSection, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {/* Tipo de búsqueda */}
          <View style={styles.filterGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Tipo de búsqueda</Text>
            <RadioButtonGroup selectedValue={searchType} onSelect={handleSearchTypeChange} />
          </View>

          {/* Categoría */}
          <View style={styles.filterGroup}>
            <SelectOnlyCategory
              handleCategoryChange={handleCategoryChange}
              ref={selectOnlyCategoryRef}
              searchType={searchType}
            />
          </View>

          {/* Subcategorías */}
          {selectedCategory && subcategories.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
                Subcategorías ({selectedSubcategories.length} seleccionadas)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subcategoriesScroll}
              >
                <View style={styles.subcategoriesContainer}>
                  {subcategories.map((subcategory) => (
                    <TouchableOpacity
                      key={subcategory.id}
                      style={[
                        styles.subcategoryChip,
                        {
                          backgroundColor: selectedSubcategories.includes(subcategory.id)
                            ? colors.PRIMARY
                            : colors.BACKGROUND,
                          borderColor: colors.BORDER
                        }
                      ]}
                      onPress={() => toggleSubcategory(subcategory.id)}
                    >
                      <Text
                        style={[
                          styles.subcategoryText,
                          {
                            color: selectedSubcategories.includes(subcategory.id)
                              ? '#FFFFFF'
                              : colors.TEXT_PRIMARY
                          }
                        ]}
                      >
                        {subcategory.name}
                      </Text>
                      {selectedSubcategories.includes(subcategory.id) && (
                        <Icon name="check" type="material-community" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Fechas */}
          <View style={styles.filterGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Rango de fechas</Text>
            <View style={styles.dateRow}>
              <DateSelector
                label="Fecha Inicio"
                date={startDate}
                showDatePicker={showStartDate}
                onPress={() => setShowStartDate(true)}
                onDateChange={(date) => {
                  setShowStartDate(false);
                  if (date) setStartDate(date);
                }}
                onCancel={() => setShowStartDate(false)}
              />
              <DateSelector
                label="Fecha Fin"
                date={endDate}
                showDatePicker={showEndDate}
                onPress={() => setShowEndDate(true)}
                onDateChange={(date) => {
                  setShowEndDate(false);
                  if (date) setEndDate(date);
                }}
                onCancel={() => setShowEndDate(false)}
              />
            </View>
          </View>

          {/* Búsqueda - Usa el componente BarSearch con su botón interno */}
          <View style={styles.filterGroup}>
            <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Buscar por texto</Text>
            <BarSearch shouldDispatch={false} onQueryChange={handleSearch} />
          </View>
        </ScrollView>
      </View>

      {/* Resultados */}
      <View style={styles.resultsSection}>
        {hasSearched && (
          <>
            {/* Header de resultados */}
            <View style={[styles.resultsHeader, { backgroundColor: colors.PRIMARY }]}>
              <View style={styles.resultsHeaderContent}>
                <Icon
                  name="chart-box-outline"
                  type="material-community"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.resultsHeaderText}>
                  {resultSearch.length} resultado{resultSearch.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.totalAmount}>Total: {NumberFormat(sumResultSearch)}</Text>
            </View>

            {/* Lista de resultados */}
            {resultSearch.length > 0 ? (
              <FlatList
                keyExtractor={(item) => item.id.toString()}
                data={resultSearch}
                renderItem={({ item }) => <ListResultSearch {...item} />}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={true}
              />
            ) : (
              <View style={styles.emptyState}>
                <Icon
                  name="magnify"
                  type="material-community"
                  size={64}
                  color={colors.TEXT_SECONDARY}
                />
                <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                  No se encontraron resultados
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
                  Intenta ajustar los filtros de búsqueda
                </Text>
              </View>
            )}
          </>
        )}

        {!hasSearched && (
          <View style={styles.emptyState}>
            <Icon
              name="file-search-outline"
              type="material-community"
              size={64}
              color={colors.TEXT_SECONDARY}
            />
            <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
              Configura los filtros y presiona buscar
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  filterSection: {
    maxHeight: '50%',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  filterContent: {
    padding: 16,
    paddingBottom: 20
  },
  filterGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  subcategoriesScroll: {
    maxHeight: 120
  },
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8
  },
  subcategoryText: {
    fontSize: 13,
    fontWeight: '500'
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12
  },
  resultsSection: {
    flex: 1
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  resultsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  resultsHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  resultsList: {
    padding: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  }
});
