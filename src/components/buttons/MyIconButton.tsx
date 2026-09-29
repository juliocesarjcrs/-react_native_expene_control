import React from 'react';
import { ActivityIndicator, StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { Icon } from 'react-native-elements';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

type IconButtonVariant =
  | 'edit' // Editar (INFO) - icono por defecto: pencil-outline
  | 'delete' // Eliminar (ERROR) - icono por defecto: delete-outline
  | 'primary' // Acción principal (PRIMARY)
  | 'success' // Confirmar / positivo (SUCCESS)
  | 'warning' // Advertencia (WARNING)
  | 'neutral'; // Acción secundaria / discreta (TEXT_SECONDARY)

type IconButtonSize = 'small' | 'medium' | 'large';

type Props = {
  onPress: () => void;
  variant?: IconButtonVariant;
  icon?: string; // Nombre de material-community. Opcional para 'edit' y 'delete'
  size?: IconButtonSize;
  filled?: boolean; // Fondo circular suave (color + '20')
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const DEFAULT_ICONS: Partial<Record<IconButtonVariant, string>> = {
  edit: 'pencil-outline',
  delete: 'delete-outline'
};

const DEFAULT_LABELS: Partial<Record<IconButtonVariant, string>> = {
  edit: 'Editar',
  delete: 'Eliminar'
};

// Tamaño del icono según el estándar: 16 / 20 / 24
const ICON_SIZES: Record<IconButtonSize, number> = {
  small: 16,
  medium: 20,
  large: 24
};

const PADDING = 8;

export default function MyIconButton({
  onPress,
  variant = 'primary',
  icon,
  size = 'medium',
  filled = false,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel
}: Props) {
  const colors = useThemeColors();

  const variantColors: Record<IconButtonVariant, string> = {
    edit: colors.INFO,
    delete: colors.ERROR,
    primary: colors.PRIMARY,
    success: colors.SUCCESS,
    warning: colors.WARNING,
    neutral: colors.TEXT_SECONDARY
  };

  const isDisabled = disabled || loading;
  const iconSize = ICON_SIZES[size];
  const buttonSize = iconSize + PADDING * 2;
  const color = isDisabled ? colors.TEXT_SECONDARY : variantColors[variant];
  const iconName = icon ?? DEFAULT_ICONS[variant] ?? 'circle-outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? DEFAULT_LABELS[variant]}
      style={[
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? color + '20' : 'transparent',
          opacity: isDisabled && !loading ? 0.5 : 1
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Icon type="material-community" name={iconName} size={iconSize} color={color} />
      )}
    </TouchableOpacity>
  );
}