import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Components
import SelectJoinCategory from '~/components/dropDown/SelectJoinCategory';
import SelectOnlyCategory from '~/components/dropDown/SelectOnlyCategory';
import { DateSelector } from '~/components/datePicker';
import MyButton from '~/components/MyButton';

// Types
import {
  SubcategorySelection,
  CategorySelection
} from '~/shared/types/components/dropDown/SelectJoinCategory.type';
import { DropDownSelectFormat } from '~/shared/types/components';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

type FilterType = 'expenses' | 'incomes';

interface FilterSelectorProps {
  type: FilterType;
  onAnalyze: (filters: AnalysisFilters) => void;
  defaultDaysBack?: number; // Días hacia atrás por defecto (ej: 365 para 1 año)
}

export interface AnalysisFilters {
  // Para gastos
  subcategoryId?: number;
  subcategoryName?: string;
  categoryId?: number;
  categoryName?: string;

  // Fechas
  startDate: Date;
  endDate: Date;
}

export default function FilterSelector({
  type,
  onAnalyze,
  defaultDaysBack = 365
}: FilterSelectorProps) {
  const colors = useThemeColors();
  const selectJoinCategoryRef = useRef<any>(null);
  const selectOnlyCategoryRef = useRef<any>(null);

  // Estados
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategorySelection | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    CategorySelection | DropDownSelectFormat | null
  >(null);

  // Fechas por defecto: último año
  const today = new Date();
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - defaultDaysBack);

  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartDate, setShowStartDate] = useState<boolean>(false);
  const [showEndDate, setShowEndDate] = useState<boolean>(false);

  // Handlers
  const handleSubcategoryChange = (data: SubcategorySelection) => {
    setSelectedSubcategory(data);
  };

  const handleCategoryOnlyChange = (data: CategorySelection) => {
    // Cuando se selecciona solo categoría en gastos
    setSelectedCategory(data);
  };

  const handleIncomeCategoryChange = (data: DropDownSelectFormat) => {
    // Cuando se selecciona categoría en ingresos
    setSelectedCategory(data);
  };

  const handleAnalyze = () => {
    const filters: AnalysisFilters = {
      startDate,
      endDate
    };

    if (type === 'expenses' && selectedSubcategory) {
      filters.subcategoryId = selectedSubcategory.value;
      filters.subcategoryName = selectedSubcategory.label;
      filters.categoryId = selectedSubcategory.categoryId;
      filters.categoryName = selectedSubcategory.categoryName;
    } else if (type === 'incomes' && selectedCategory && selectedCategory.id !== null) {
      filters.categoryId = selectedCategory.id;
      filters.categoryName = selectedCategory.label;
    }

    onAnalyze(filters);
  };

  const isReadyToAnalyze = () => {
    if (type === 'expenses') {
      return selectedSubcategory !== null;
    } else {
      return selectedCategory !== null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Selector de Categoría/Subcategoría */}
      <View style={styles.categorySection}>
        {type === 'expenses' ? (
          <SelectJoinCategory
            fetchExpensesSubcategory={handleSubcategoryChange}
            fetchExpensesOnlyCategory={handleCategoryOnlyChange}
            ref={selectJoinCategoryRef}
          />
        ) : (
          <SelectOnlyCategory
            searchType={1}
            handleCategoryChange={handleIncomeCategoryChange}
            ref={selectOnlyCategoryRef}
          />
        )}
      </View>

      {/* Selector de Rango de Fechas */}
      <View style={styles.dateSection}>
        <Text style={[styles.sectionLabel, { color: colors.TEXT_PRIMARY }]}>Rango de fechas</Text>
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

      {/* Botón Analizar */}
      <MyButton
        title="Analizar Comentarios"
        onPress={handleAnalyze}
        variant="primary"
        disabled={!isReadyToAnalyze()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 16
  },
  categorySection: {
    zIndex: 3000
  },
  dateSection: {
    zIndex: 1000,
    gap: 8
  },
  sectionLabel: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginBottom: 4
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12
  }
});
