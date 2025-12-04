import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
// import { useThemeColors } from '~/hooks/useThemeColors';

type ButtonVariant =
  | 'primary' // Botón principal (morado)
  | 'secondary' // Botón secundario (azul/info)
  | 'success' // Guardar, confirmar (verde)
  | 'danger' // Eliminar, cancelar acciones críticas (rojo)
  | 'warning' // Advertencias (naranja)
  | 'outline' // Borde con fondo transparente
  | 'ghost' // Sin borde ni fondo, solo texto
  | 'cancel'; // Cancelar (gris outline)

type ButtonSize = 'small' | 'medium' | 'large';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export default function MyButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  style
}: Props) {
  const colors = useThemeColors();

  // Configuración de colores según variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.PRIMARY,
          textColor: colors.WHITE,
          borderColor: colors.PRIMARY,
          borderWidth: 0
        };

      case 'secondary':
        return {
          backgroundColor: colors.INFO,
          textColor: colors.WHITE,
          borderColor: colors.INFO,
          borderWidth: 0
        };

      case 'success':
        return {
          backgroundColor: colors.SUCCESS,
          textColor: colors.WHITE,
          borderColor: colors.SUCCESS,
          borderWidth: 0
        };

      case 'danger':
        return {
          backgroundColor: colors.ERROR,
          textColor: colors.WHITE,
          borderColor: colors.ERROR,
          borderWidth: 0
        };

      case 'warning':
        return {
          backgroundColor: colors.WARNING,
          textColor: colors.WHITE,
          borderColor: colors.WARNING,
          borderWidth: 0
        };

      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: colors.PRIMARY,
          borderColor: colors.PRIMARY,
          borderWidth: 1.5
        };

      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: colors.PRIMARY,
          borderColor: 'transparent',
          borderWidth: 0
        };

      case 'cancel':
        return {
          backgroundColor: 'transparent',
          textColor: colors.TEXT_SECONDARY,
          borderColor: colors.BORDER,
          borderWidth: 1.5
        };

      default:
        return {
          backgroundColor: colors.PRIMARY,
          textColor: colors.WHITE,
          borderColor: colors.PRIMARY,
          borderWidth: 0
        };
    }
  };

  // Configuración de tamaño
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          borderRadius: 6
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: 18,
          borderRadius: 12
        };
      case 'medium':
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          borderRadius: 8
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          width: fullWidth ? '100%' : 'auto',
          alignSelf: fullWidth ? 'stretch' : 'center'
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
                marginLeft: icon ? 8 : 0
              }
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6
  },
  text: {
    fontWeight: '500'
    // letterSpacing: 0.5
  }
});
