import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icon } from 'react-native-elements';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface MyChipProps {
  /** Texto del chip */
  label: string;
  /** Acción al presionar */
  onPress: () => void;
  /** Segunda línea más pequeña bajo el texto (ej: un monto) */
  sublabel?: string;
  /** Estado activo: fondo PRIMARY y contenido blanco */
  selected?: boolean;
  /** Nombre de icono `material-community` (opcional, a la izquierda del texto) */
  icon?: string;
  /** Deshabilita (opacidad 0.5) */
  disabled?: boolean;
  /** Sobrescribe estilos (se aplica al final). Con `{ flex: 1 }` los chips se reparten el ancho */
  style?: StyleProp<ViewStyle>;
}

/**
 * Chip seleccionable para filtros, atajos y toggles.
 * Centralizado: cambiar su estilo aquí lo actualiza en toda la app.
 */
const MyChip: React.FC<MyChipProps> = ({
  label,
  onPress,
  sublabel,
  selected = false,
  icon,
  disabled = false,
  style
}) => {
  const colors = useThemeColors();
  const contentColor = selected ? colors.WHITE : colors.TEXT_SECONDARY;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.PRIMARY : colors.CARD_BACKGROUND,
          borderColor: selected ? colors.PRIMARY : colors.BORDER,
          opacity: disabled ? 0.5 : 1
        },
        style
      ]}
    >
      {icon ? <Icon type="material-community" name={icon} size={16} color={contentColor} /> : null}
      <View style={styles.textContainer}>
        <Text
          style={[styles.label, { color: contentColor, fontWeight: selected ? '600' : '500' }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.sublabel, { color: contentColor }]} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4
  },
  textContainer: {
    alignItems: 'center',
    flexShrink: 1
  },
  label: {
    fontSize: SMALL + 1
  },
  sublabel: {
    fontSize: SMALL - 1,
    opacity: 0.85,
    marginTop: 2
  }
});

export default MyChip;
