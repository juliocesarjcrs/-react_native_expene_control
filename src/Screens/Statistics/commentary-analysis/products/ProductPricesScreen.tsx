import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import MyInput from '~/components/inputs/MyInput';
import FilterSelector from '../components/FilterSelector';
import { ProductCard } from './components/ProductCard/ProductCard';
import { IncompleteCard } from './components/IncompleteCard/IncompleteCard';
import { PurchaseDetailModal } from './components/PurchaseDetailModal/PurchaseDetailModal';
import { SectionHeader } from './components/shared/SectionHeader';
import { StatsGrid } from './components/shared/StatsGrid';
import { EmptyState } from './components/shared/EmptyState';
import { InfoBox } from './components/shared/InfoBox';

// Hooks
import { useProductData } from './hooks/useProductData';
import { useProductExpansion } from './hooks/useProductExpansion';

// Types
import { StackNavigationProp } from '@react-navigation/stack';
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';

// Utils
import { normalizeSearchText } from './utils/formatters';
import { DateFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';

// Config
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'productPrices'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
}

export default function ProductPricesScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.productPrices;

  // Hooks de datos
  const {
    loading,
    groupedProducts,
    completeSummaries,
    incompleteSummaries,
    currentFilters,
    loadData,
    refreshData
  } = useProductData();

  // Hook de expansión de cards
  const { isExpanded, toggleExpanded, collapseAll } = useProductExpansion();

  // Estado del modal
  const [selectedPurchase, setSelectedPurchase] = useState<ProductPrice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Búsqueda
  const { control, watch } = useForm({ defaultValues: { search: '' } });
  const searchQuery = watch('search');

  // Filtrar por búsqueda
  const normalizedSearch = normalizeSearchText(searchQuery);
  const filteredComplete = completeSummaries.filter((s) =>
    s.normalizedName.includes(normalizedSearch)
  );
  const filteredIncomplete = incompleteSummaries.filter((s) =>
    s.normalizedName.includes(normalizedSearch)
  );

  const hasResults = filteredComplete.length > 0 || filteredIncomplete.length > 0;
  const totalProducts = completeSummaries.length + incompleteSummaries.length;

  // Handlers
  const handlePurchasePress = (purchase: ProductPrice) => {
    setSelectedPurchase(purchase);
    setModalVisible(true);
  };

  const handleSavePurchase = async (updated: ProductPrice) => {
    // TODO: Actualizar en BD usando servicio
    // await updateExpenseCommentary(updated.id, generateCommentary(updated));

    setModalVisible(false);
    setSelectedPurchase(null);

    // Recargar datos
    await refreshData();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPurchase(null);
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Filtros */}
          <FilterSelector type="expenses" onAnalyze={loadData} defaultDaysBack={30} />

          {/* Info del rango seleccionado */}
          {currentFilters && (
            <InfoBox
              icon="information"
              text={`Analizando ${currentFilters.subcategoryName} desde ${DateFormat(
                currentFilters.startDate,
                'DD MMM YYYY'
              )} hasta ${DateFormat(currentFilters.endDate, 'DD MMM YYYY')}`}
            />
          )}

          {/* Búsqueda */}
          {totalProducts > 0 && (
            <View style={styles.searchContainer}>
              <MyInput
                name="search"
                control={control}
                placeholder="Buscar producto..."
                leftIcon="magnify"
                clearButton
              />
            </View>
          )}

          {/* Estadísticas globales */}
          {!loading && totalProducts > 0 && (
            <StatsGrid
              completeCount={completeSummaries.length}
              incompleteCount={incompleteSummaries.length}
              totalCount={totalProducts}
            />
          )}

          {/* Contenido principal */}
          {loading ? (
            <MyLoading />
          ) : hasResults ? (
            <View style={styles.resultsContainer}>
              {/* Sección: Productos Completos */}
              {filteredComplete.length > 0 && (
                <>
                  <SectionHeader
                    title="Comparación de precios"
                    count={filteredComplete.length}
                    icon="check-circle"
                    iconColor={colors.SUCCESS}
                  />
                  {filteredComplete.map((summary) => {
                    const purchases = groupedProducts[summary.normalizedName];
                    return (
                      <ProductCard
                        key={summary.normalizedName}
                        summary={summary}
                        purchases={purchases}
                        isExpanded={isExpanded(summary.normalizedName)}
                        onToggleExpand={() => toggleExpanded(summary.normalizedName)}
                        onPurchasePress={handlePurchasePress}
                      />
                    );
                  })}
                </>
              )}

              {/* Sección: Productos Incompletos */}
              {filteredIncomplete.length > 0 && (
                <>
                  <SectionHeader
                    title="Sin datos de peso/precio"
                    count={filteredIncomplete.length}
                    icon="alert-circle-outline"
                    iconColor={colors.WARNING}
                  />
                  <InfoBox
                    type="warning"
                    icon="alert"
                    text='Estos registros no tienen precio/kg. Toca "Editar" para completar los datos y poder compararlos.'
                    compact
                  />
                  {filteredIncomplete.map((summary) => {
                    const purchases = groupedProducts[summary.normalizedName];
                    return (
                      <IncompleteCard
                        key={summary.normalizedName}
                        summary={summary}
                        purchases={purchases}
                        isExpanded={isExpanded(summary.normalizedName)}
                        onToggleExpand={() => toggleExpanded(summary.normalizedName)}
                        onEditPress={handlePurchasePress}
                      />
                    );
                  })}
                </>
              )}
            </View>
          ) : currentFilters && totalProducts === 0 ? (
            <EmptyState
              icon="cart-outline"
              title="No se encontraron registros"
              message="No hay datos en este rango de fechas."
              hint='Formato sugerido: "Producto — 0,625 kg @ $7.168/kg [Carulla]"'
            />
          ) : searchQuery && !hasResults ? (
            <EmptyState
              icon="magnify"
              title={`No se encontró "${searchQuery}"`}
              message="Intenta con otro término de búsqueda."
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Modal de detalle/edición */}
      <PurchaseDetailModal
        visible={modalVisible}
        purchase={selectedPurchase}
        onClose={handleCloseModal}
        onSave={handleSavePurchase}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  searchContainer: {
    marginBottom: 16
  },
  resultsContainer: {
    marginTop: 10
  }
});
