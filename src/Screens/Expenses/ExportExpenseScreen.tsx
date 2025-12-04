import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getAllExpensesByRangeDates } from '../../services/categories';

// Utils
import { DateFormat, NumberFormat, cutText } from '../../utils/Helpers';
import { showError } from '~/utils/showError';

// Components
import { DateSelector } from '../../components/datePicker';
import MyLoading from '../../components/loading/MyLoading';
import ModernTable from '../../components/tables/ModernTable';
import MyButton from '../../components/MyButton';
import { SettingsStackParamList } from '../../shared/types';
import { Icon } from 'react-native-elements';
import { ScreenHeader } from '~/components/ScreenHeader';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ExportExpenseScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'exportData'>;

interface ExportExpenseScreenProps {
  navigation: ExportExpenseScreenNavigationProp;
}

export default function ExportExpenseScreen({ navigation }: ExportExpenseScreenProps) {
  const config = screenConfigs.exportData;
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [tableHead, setTableHead] = useState<string[]>([]);
  const [isEmptyData, setIsEmptyData] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const handleStartDateChange = (selectedDate?: Date) => {
    setShowStartDate(false);
    if (!selectedDate) {
      return;
    }
    setStartDate(selectedDate);
  };

  const handleEndDateChange = (selectedDate?: Date) => {
    setShowEndDate(false);
    if (!selectedDate) {
      return;
    }
    setEndDate(selectedDate);
  };

  const showStartDatePicker = () => {
    setShowStartDate(true);
  };

  const showEndDatePicker = () => {
    setShowEndDate(true);
  };

  const exportDataApi = async () => {
    try {
      setLoading(true);
      const { data } = await getAllExpensesByRangeDates(
        DateFormat(startDate, 'YYYY-MM-DD'),
        DateFormat(endDate, 'YYYY-MM-DD')
      );
      setLoading(false);

      if (data.rows.length <= 0) {
        setIsEmptyData(true);
        setTableHead([]);
        setTableData([]);
      } else {
        setIsEmptyData(false);
        setTableHead(data.tableHead);

        // Formatear datos dinámicamente
        const dataFormatted = data.rows.map((row: (string | number)[]) => {
          return row.map((value) => {
            if (typeof value === 'number') {
              return NumberFormat(value);
            } else {
              return cutText(String(value), 15);
            }
          });
        });
        setTableData(dataFormatted);
      }
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };

  // Generar anchos dinámicamente según el número de columnas (en píxeles)
  const getColumnWidths = (): number[] | undefined => {
    if (tableHead.length === 0) return undefined;

    // Para tablas dinámicas, ajustar anchos según el tipo de dato
    return tableHead.map((header) => {
      const lowerHeader = header.toLowerCase();

      // Columnas de descripción/nombre más anchas
      if (
        lowerHeader.includes('descripción') ||
        lowerHeader.includes('nombre') ||
        lowerHeader.includes('categoría')
      ) {
        return 180;
      }

      // Columnas de fecha
      if (lowerHeader.includes('fecha')) {
        return 110;
      }

      // Columnas numéricas (valores, montos)
      if (
        lowerHeader.includes('valor') ||
        lowerHeader.includes('monto') ||
        lowerHeader.includes('precio') ||
        lowerHeader.includes('total')
      ) {
        return 130;
      }

      // Default
      return 120;
    });
  };

  const getColumnAlignments = (): ('left' | 'center' | 'right')[] | undefined => {
    if (tableHead.length === 0) return undefined;

    return tableHead.map((header) => {
      const lowerHeader = header.toLowerCase();

      // Valores monetarios a la derecha
      if (
        lowerHeader.includes('valor') ||
        lowerHeader.includes('monto') ||
        lowerHeader.includes('precio') ||
        lowerHeader.includes('total') ||
        lowerHeader.includes('$')
      ) {
        return 'right';
      }

      // Fechas al centro
      if (lowerHeader.includes('fecha')) {
        return 'center';
      }

      // Texto a la izquierda
      return 'left';
    });
  };

  // Determinar si necesita scroll horizontal
  const totalWidth = getColumnWidths()?.reduce((sum, w) => sum + w, 0) || 0;
  const needsHorizontalScroll = totalWidth > 380; // Si es más ancho que la pantalla típica

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.CARD_BACKGROUND }]}>
          {/* <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Exportar Gastos</Text> */}
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
            Seleccione el rango de fechas
          </Text>
        </View>

        {/* Selectores de fecha */}
        <View style={styles.dateContainer}>
          <DateSelector
            label="Fecha Inicial"
            date={startDate}
            showDatePicker={showStartDate}
            onPress={showStartDatePicker}
            onDateChange={handleStartDateChange}
            onCancel={() => setShowStartDate(false)}
          />
          <DateSelector
            label="Fecha Final"
            date={endDate}
            showDatePicker={showEndDate}
            onPress={showEndDatePicker}
            onDateChange={handleEndDateChange}
            onCancel={() => setShowEndDate(false)}
          />
        </View>

        {/* Info del rango */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Icon type="material-community" name="calendar-range" size={18} color={colors.INFO} />
          <Text style={[styles.infoText, { color: colors.TEXT_SECONDARY }]}>
            Del {DateFormat(startDate, 'DD/MM/YYYY')} al {DateFormat(endDate, 'DD/MM/YYYY')}
          </Text>
        </View>

        {/* Botón de búsqueda */}
        {loading ? (
          <MyLoading />
        ) : (
          <MyButton onPress={exportDataApi} title="Generar tabla" variant="primary" />
        )}

        {/* Mensaje de datos vacíos */}
        {isEmptyData && (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.WARNING + '10', borderColor: colors.WARNING }
            ]}
          >
            <Icon
              type="material-community"
              name="alert-circle-outline"
              size={48}
              color={colors.WARNING}
            />
            <Text style={[styles.emptyTitle, { color: colors.TEXT_PRIMARY }]}>Sin datos</Text>
            <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
              No se encontraron gastos en el rango seleccionado
            </Text>
          </View>
        )}

        {/* Tabla dinámica */}
        {!isEmptyData && tableHead.length > 0 && (
          <View>
            {needsHorizontalScroll && (
              <View
                style={[
                  styles.scrollHint,
                  { backgroundColor: colors.INFO + '10', borderColor: colors.INFO }
                ]}
              >
                <Icon
                  type="material-community"
                  name="gesture-swipe-horizontal"
                  size={16}
                  color={colors.INFO}
                />
                <Text style={[styles.scrollHintText, { color: colors.TEXT_SECONDARY }]}>
                  Desliza horizontalmente para ver todas las columnas
                </Text>
              </View>
            )}

            <ModernTable
              tableHead={tableHead}
              tableData={tableData}
              columnWidths={getColumnWidths()}
              columnAlignments={getColumnAlignments()}
              horizontalScroll={needsHorizontalScroll}
              defaultColumnWidth={120}
            />

            {/* Stats */}
            <View style={[styles.statsCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                  Total registros
                </Text>
                <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
                  {tableData.length}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.BORDER }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Columnas</Text>
                <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
                  {tableHead.length}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500'
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 10
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center'
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    gap: 8
  },
  scrollHintText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1
  },
  statsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800'
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16
  }
});
