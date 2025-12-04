import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';

interface ModernTableHeadProps {
  data: string[];
  columnWidths?: number[];
  columnAlignments?: ('left' | 'center' | 'right')[];
}

const ModernTableHead: React.FC<ModernTableHeadProps> = ({
  data,
  columnWidths,
  columnAlignments
}) => {
  const colors = useThemeColors();

  // Si no se especifican anchos, usar 120px por defecto para cada columna
  const getColumnWidth = (index: number): number => {
    if (columnWidths && columnWidths[index]) {
      return columnWidths[index];
    }
    return 120; // Ancho fijo por defecto
  };

  const getTextAlign = (index: number): 'left' | 'center' | 'right' => {
    if (columnAlignments && columnAlignments[index]) {
      return columnAlignments[index];
    }
    return 'left';
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.PRIMARY + '15', borderColor: colors.BORDER }
      ]}
    >
      {data.map((headerText, idx) => (
        <View key={idx} style={[styles.headerCell, { width: getColumnWidth(idx) }]}>
          <Text
            style={[
              styles.headerText,
              { color: colors.TEXT_PRIMARY, textAlign: getTextAlign(idx) }
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {headerText}
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
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'center'
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});

export default ModernTableHead;
