import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Icon } from 'react-native-elements';
import { Control, Controller, FieldError } from 'react-hook-form';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

// ==========================================
// TIPOS Y INTERFACES
// ==========================================

type InputType = 'text' | 'number' | 'currency' | 'password' | 'search' | 'textarea';

interface MyInputProps {
  // React Hook Form
  name: string;
  control: Control<any>;
  rules?: object;

  // Configuración básica
  label?: string;
  placeholder?: string;
  type?: InputType;
  defaultValue?: string;

  // Iconos
  leftIcon?: string;
  rightIcon?: string;

  // Validaciones y límites
  maxLength?: number;
  disabled?: boolean;

  // Comportamiento especial
  autoFocus?: boolean;
  clearButton?: boolean;
  onSubmitEditing?: () => void;

  // Estilos personalizados (opcional)
  containerStyle?: object;
  inputStyle?: object;

  // Mensaje de ayuda
  helperText?: string;

  // Multiline (para textarea)
  multiline?: boolean;
  numberOfLines?: number;
}

// ==========================================
// FUNCIONES HELPER PARA FORMATO DE MONEDA
// ==========================================

/**
 * Formatea un número con separadores de miles
 * Ejemplo: 50000 → "50.000"
 */
const formatCurrency = (value: string | number): string => {
  if (!value && value !== 0) return '';

  // Convertir a string y limpiar
  const stringValue = String(value);
  const cleanValue = stringValue.replace(/\D/g, ''); // Solo números

  if (!cleanValue) return '';

  // Convertir a número y formatear
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return '';

  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(numValue);
};

/**
 * Limpia el formato de moneda y devuelve solo números
 * Ejemplo: "50.000" → "50000"
 */
const cleanCurrency = (text: string): string => {
  if (!text) return '';
  return text.replace(/\D/g, ''); // Remueve todo excepto dígitos
};

/**
 * Parsea un string formateado a número
 * Ejemplo: "50.000" → 50000
 */
const parseFormattedNumber = (text: string): number => {
  if (!text) return 0;
  const cleaned = text.replace(/\./g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * MyInput - Componente general de inputs para la aplicación
 *
 * @example
 * // Input de moneda
 * <MyInput
 *   name="cost"
 *   type="currency"
 *   control={control}
 *   label="Gasto"
 *   placeholder="0"
 *   rules={{ required: 'El gasto es obligatorio' }}
 *   leftIcon="cash"
 * />
 *
 * @example
 * // Input de texto simple
 * <MyInput
 *   name="name"
 *   control={control}
 *   label="Nombre"
 *   placeholder="Ej: Almuerzo"
 *   rules={{ required: 'El nombre es obligatorio' }}
 * />
 */
export default function MyInput({
  name,
  control,
  rules,
  label,
  placeholder,
  type = 'text',
  defaultValue = '',
  leftIcon,
  rightIcon,
  maxLength,
  disabled = false,
  autoFocus = false,
  clearButton = false,
  onSubmitEditing,
  containerStyle,
  inputStyle,
  helperText,
  multiline = false,
  numberOfLines = 1
}: MyInputProps): React.JSX.Element {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // ==========================================
  // DETERMINAR TIPO DE TECLADO
  // ==========================================
  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'currency':
      case 'number':
        return 'number-pad';
      case 'search':
      case 'text':
      case 'textarea':
      default:
        return 'default';
    }
  };

  // ==========================================
  // RENDERIZAR ICONOS
  // ==========================================
  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    return (
      <Icon
        type="material-community"
        name={leftIcon}
        size={20}
        color={isFocused ? colors.PRIMARY : colors.TEXT_SECONDARY}
        containerStyle={styles.iconLeft}
      />
    );
  };

  const renderRightIcon = (onClear?: () => void) => {
    // Para password: mostrar icono de ojo
    if (type === 'password') {
      return (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconRight}>
          <Icon
            type="material-community"
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={colors.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      );
    }

    // Para search con clearButton: mostrar X
    if (clearButton && onClear) {
      return (
        <TouchableOpacity onPress={onClear} style={styles.iconRight}>
          <Icon
            type="material-community"
            name="close-circle"
            size={20}
            color={colors.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      );
    }

    // Icono personalizado
    if (rightIcon) {
      return (
        <Icon
          type="material-community"
          name={rightIcon}
          size={20}
          color={isFocused ? colors.PRIMARY : colors.TEXT_SECONDARY}
          containerStyle={styles.iconRight}
        />
      );
    }

    return null;
  };

  // ==========================================
  // DETERMINAR COLOR DEL BORDE
  // ==========================================
  const getBorderColor = (error?: FieldError) => {
    if (error) return colors.ERROR;
    if (isFocused) return colors.PRIMARY;
    return colors.BORDER;
  };

  // ==========================================
  // DETERMINAR FONDO
  // ==========================================
  const getBackgroundColor = () => {
    if (disabled) return colors.GRAY + '20'; // Opacidad 20%
    return colors.CARD_BACKGROUND;
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
        // ==========================================
        // MANEJO DE VALORES SEGÚN TIPO
        // ==========================================

        // Para currency: formatear valor para display
        const displayValue =
          type === 'currency' && value ? formatCurrency(value) : String(value || '');

        // Handler para cambio de texto
        const handleChangeText = (text: string) => {
          if (type === 'currency') {
            // Limpiar y parsear a número
            const cleanedValue = cleanCurrency(text);
            const numericValue = parseFormattedNumber(cleanedValue);
            onChange(numericValue);
          } else if (type === 'number') {
            // Solo números sin formato
            const cleanedValue = text.replace(/\D/g, '');
            const numericValue = parseFloat(cleanedValue) || 0;
            onChange(numericValue);
          } else {
            // Texto normal
            onChange(text);
          }
        };

        // Handler para limpiar input
        const handleClear = () => {
          onChange('');
          inputRef.current?.focus();
        };

        // Handler para blur
        const handleBlur = () => {
          setIsFocused(false);
          onBlur();
        };

        // Handler para focus
        const handleFocus = () => {
          setIsFocused(true);
        };

        return (
          <View style={[styles.container, containerStyle]}>
            {/* LABEL */}
            {label && (
              <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
                {label}
                {rules && (rules as any).required && (
                  <Text style={{ color: colors.ERROR }}> *</Text>
                )}
              </Text>
            )}

            {/* INPUT CONTAINER */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: getBackgroundColor(),
                  borderColor: getBorderColor(error),
                  opacity: disabled ? 0.5 : 1
                }
              ]}
            >
              {/* ICONO IZQUIERDO */}
              {renderLeftIcon()}

              {/* INPUT */}
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    color: colors.TEXT_PRIMARY,
                    textAlignVertical: multiline ? 'top' : 'center',
                    height: multiline ? numberOfLines * 20 + 20 : undefined
                  },
                  inputStyle
                ]}
                value={displayValue}
                placeholder={placeholder}
                placeholderTextColor={colors.TEXT_SECONDARY}
                onChangeText={handleChangeText}
                onBlur={handleBlur}
                onFocus={handleFocus}
                keyboardType={getKeyboardType()}
                secureTextEntry={type === 'password' && !showPassword}
                editable={!disabled}
                autoFocus={autoFocus}
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={numberOfLines}
                onSubmitEditing={onSubmitEditing}
                returnKeyType={onSubmitEditing ? 'done' : 'default'}
              />

              {/* ICONO DERECHO / CLEAR BUTTON / PASSWORD TOGGLE */}
              {renderRightIcon(handleClear)}
            </View>

            {/* CHARACTER COUNTER */}
            {maxLength && isFocused && (
              <Text style={[styles.helperText, { color: colors.TEXT_SECONDARY }]}>
                {String(value || '').length} / {maxLength}
              </Text>
            )}

            {/* HELPER TEXT */}
            {helperText && !error && (
              <Text style={[styles.helperText, { color: colors.TEXT_SECONDARY }]}>
                {helperText}
              </Text>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <Text style={[styles.errorText, { color: colors.ERROR }]}>{error.message}</Text>
            )}
          </View>
        );
      }}
    />
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48
  },
  input: {
    flex: 1,
    fontSize: MEDIUM,
    padding: 0 // Remover padding por defecto
  },
  iconLeft: {
    marginRight: 8
  },
  iconRight: {
    marginLeft: 8
  },
  errorText: {
    fontSize: SMALL - 1,
    marginTop: 4
  },
  helperText: {
    fontSize: SMALL - 1,
    marginTop: 4
  }
});
