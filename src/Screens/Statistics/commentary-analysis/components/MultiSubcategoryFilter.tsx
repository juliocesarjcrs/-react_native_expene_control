import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Components
import SelectMultiSubcategory, {
  MultiSubcategorySelection,
  SelectMultiSubcategoryHandle
} from '~/components/dropDown/SelectMultiSubcategory';
import { DateSelector } from '~/components/datePicker';
import MyButton from '~/components/MyButton';

// Hook compartido
import { useDateRange } from '~/customHooks/useDateRange';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

// ─── Tipos públicos ────────────────────────────────────────────────────────────

/**
 * Filtros que emite este componente.
 * Compatible directamente con findExpensesBySubcategories del backend.
 */
export interface MultiAnalysisFilters {
  subcategoryIds: number[]; // array — listo para el backend
  subcategoryNames: string[];
  categoryId: number;
  categoryName: string;
  startDate: Date;
  endDate: Date;
}

interface MultiSubcategoryFilterProps {
  onAnalyze: (filters: MultiAnalysisFilters) => void;
  /** Días hacia atrás para la fecha de inicio por defecto (default: 365) */
  defaultDaysBack?: number;
  /** Texto del botón de acción (default: "Analizar") */
  buttonTitle?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MultiSubcategoryFilter({
  onAnalyze,
  defaultDaysBack = 365,
  buttonTitle = 'Analizar Comentarios'
}: MultiSubcategoryFilterProps) {
  const colors = useThemeColors();
  const selectorRef = useRef<SelectMultiSubcategoryHandle>(null);

  // Selección actual de subcategorías
  const [selection, setSelection] = React.useState<MultiSubcategorySelection | null>(null);

  // Rango de fechas (hook compartido, misma lógica que FilterSelector)
  const {
    startDate,
    endDate,
    showStartDate,
    showEndDate,
    openStartDate,
    closeStartDate,
    openEndDate,
    closeEndDate,
    handleStartDateChange,
    handleEndDateChange
  } = useDateRange(defaultDaysBack);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectionChange = (data: MultiSubcategorySelection | null) => {
    setSelection(data);
  };

  const handleAnalyze = () => {
    if (!selection || selection.subcategories.length === 0) return;

    const filters: MultiAnalysisFilters = {
      subcategoryIds: selection.subcategories.map((s) => s.value),
      subcategoryNames: selection.subcategories.map((s) => s.label),
      categoryId: selection.categoryId,
      categoryName: selection.categoryName,
      startDate,
      endDate
    };

    onAnalyze(filters);
  };

  const isReadyToAnalyze = selection !== null && selection.subcategories.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Selector de Categoría + Subcategorías múltiples */}
      <View style={styles.categorySection}>
        <SelectMultiSubcategory ref={selectorRef} onSelectionChange={handleSelectionChange} />
      </View>

      {/* Rango de Fechas */}
      <View style={styles.dateSection}>
        <Text style={[styles.sectionLabel, { color: colors.TEXT_PRIMARY }]}>Rango de fechas</Text>
        <View style={styles.dateRow}>
          <DateSelector
            label="Fecha Inicio"
            date={startDate}
            showDatePicker={showStartDate}
            onPress={openStartDate}
            onDateChange={handleStartDateChange}
            onCancel={closeStartDate}
          />
          <DateSelector
            label="Fecha Fin"
            date={endDate}
            showDatePicker={showEndDate}
            onPress={openEndDate}
            onDateChange={handleEndDateChange}
            onCancel={closeEndDate}
          />
        </View>
      </View>

      {/* Botón */}
      <MyButton
        title={buttonTitle}
        onPress={handleAnalyze}
        variant="primary"
        disabled={!isReadyToAnalyze}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
