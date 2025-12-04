import React from 'react';
import { StyleSheet, View, ScrollView, useWindowDimensions } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import ModernTableHead from './ModernTableHead';
import ModernTableRow from './ModernTableRow';

export interface ModernTableProps {
  /** Encabezados de las columnas */
  tableHead: string[];
  /** Datos de las filas. Cada elemento es un array de strings */
  tableData: string[][];
  /** Ancho en pixeles de cada columna. Ejemplo: [150, 100, 120] */
  columnWidths?: number[];
  /** Alineación de texto por columna. Ejemplo: ['left', 'center', 'right'] */
  columnAlignments?: ('left' | 'center' | 'right')[];
  /** Índices de filas que deben destacarse (ej: fila de totales) */
  highlightedRows?: number[];
  /** Hacer la tabla horizontalmente scrollable */
  horizontalScroll?: boolean;
  /** Ancho por defecto para columnas sin especificar */
  defaultColumnWidth?: number;
}

const ModernTable: React.FC<ModernTableProps> = ({
  tableHead,
  tableData,
  columnWidths,
  columnAlignments,
  highlightedRows = [],
  horizontalScroll = false,
  defaultColumnWidth = 120
}) => {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();

  // Generar anchos automáticos si no se especifican
  const getColumnWidths = (): number[] => {
    if (columnWidths) {
      return columnWidths;
    }
    // Si no se especifican, usar ancho por defecto para todas las columnas
    return tableHead.map(() => defaultColumnWidth);
  };

  const finalColumnWidths = getColumnWidths();

  // Calcular ancho total de la tabla (sumamos los anchos de columnas
  // y el padding horizontal del header/filas: 12px a cada lado = 24px)
  const totalTableWidth = finalColumnWidths.reduce((sum, width) => sum + width, 0) + 24;

  // Determinar si necesita scroll automáticamente
  const needsScroll = horizontalScroll || totalTableWidth > windowWidth;

  // Detectar si es la última fila basándose en texto "Promedio" o "Total"
  const isHighlightedRow = (index: number, rowData: string[]): boolean => {
    if (highlightedRows.includes(index)) return true;

    // Auto-detectar filas de resumen
    const firstCell = rowData[0]?.toLowerCase() || '';
    return (
      firstCell.includes('promedio') || firstCell.includes('total') || firstCell.includes('suma')
    );
  };

  const tableContent = (
    // Forzar ancho total del contenido para que ScrollView y los
    // elementos hijos (header + filas) compartan exactamente la misma base
    // y no haya desalineamiento en móviles.
    <View
      style={[
        styles.container,
        { backgroundColor: colors.CARD_BACKGROUND, width: totalTableWidth }
      ]}
    >
      <ModernTableHead
        data={tableHead}
        columnWidths={finalColumnWidths}
        columnAlignments={columnAlignments}
      />
      {tableData.map((rowData, idx) => (
        <ModernTableRow
          key={idx}
          data={rowData}
          isLastRow={idx === tableData.length - 1}
          isHighlighted={isHighlightedRow(idx, rowData)}
          columnWidths={finalColumnWidths}
          columnAlignments={columnAlignments}
        />
      ))}
    </View>
  );

  if (needsScroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scrollContainer}
        // Mantener padding 0 en el content container para que el ancho
        // calculado arriba (sumatoria de columnas) coincida visualmente.
        contentContainerStyle={styles.scrollContent}
      >
        {tableContent}
      </ScrollView>
    );
  }

  return tableContent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginVertical: 12
  },
  scrollContainer: {
    marginVertical: 12
  },
  scrollContent: {
    paddingHorizontal: 0
  }
});

export default ModernTable;
