import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';

interface ModernTableRowProps {
  data: string[];
  isLastRow?: boolean;
  isHighlighted?: boolean;
  columnWidths?: number[];
  columnAlignments?: ('left' | 'center' | 'right')[];
}

const ModernTableRow: React.FC<ModernTableRowProps> = ({ 
  data, 
  isLastRow = false,
  isHighlighted = false,
  columnWidths,
  columnAlignments
}) => {
  const colors = useThemeColors();

  const getTextAlign = (index: number): 'left' | 'center' | 'right' => {
    if (columnAlignments && columnAlignments[index]) {
      return columnAlignments[index];
    }
    return 'left';
  };

  const getCellColor = (text: string, index: number): string => {
    // Si es la última fila (Promedio), usar color primario
    if (isHighlighted) {
      return colors.PRIMARY;
    }
    
    // Para porcentajes negativos, usar color de error
    if (text.includes('%') && text.includes('-')) {
      return colors.ERROR;
    }
    
    // Para porcentajes positivos altos (>20%), usar color de éxito
    if (text.includes('%')) {
      const percentage = parseInt(text.replace(/[^0-9-]/g, ''));
      if (percentage > 20) {
        return colors.SUCCESS;
      }
    }
    
    // Para valores monetarios negativos
    if (text.includes('$') && text.includes('-')) {
      return colors.ERROR;
    }
    
    // Default
    return colors.TEXT_PRIMARY;
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: isHighlighted ? colors.PRIMARY + '08' : colors.CARD_BACKGROUND,
          borderBottomColor: colors.BORDER 
        },
        isLastRow && styles.lastRow
      ]}
    >
      {data.map((cellText, idx) => (
        <View 
          key={idx} 
          style={[
            styles.cell,
            // Cuando se pasan `columnWidths` queremos usar un ancho fijo (px)
            // para que coincida con el header. Si no hay ancho para la
            // columna, dejamos que el `flex: 1` del estilo por defecto actúe.
            (columnWidths && columnWidths[idx]) ? { width: columnWidths[idx] } : undefined
          ]}
        >
          <Text 
            style={[
              styles.cellText, 
              { 
                color: getCellColor(cellText, idx),
                textAlign: getTextAlign(idx),
                fontWeight: isHighlighted ? '700' : '500'
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {cellText}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  lastRow: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center'
  },
  cellText: {
    fontSize: 12
  }
});

export default ModernTableRow;