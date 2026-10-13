import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Control, FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyInput from '~/components/inputs/MyInput';
import TemplateChips from './TemplateChips';
import HistorySuggestions from './HistorySuggestions';
import { useCommentaryInput } from './useCommentaryInput.hook';
import { RecentExpenseForSuggestion } from '~/shared/types/screens/settings/commentary-templates.types';

// ============================================================
// TIPOS Y CONSTANTES
// ============================================================

// Cualquier formulario que tenga un campo "commentary" de texto
type CommentaryForm = FieldValues & { commentary: string };

interface CommentaryInputProps<T extends CommentaryForm> {
  /** react-hook-form control */
  control: Control<T>;
  /** react-hook-form setValue para inyectar templates */
  setValue: UseFormSetValue<T>;
  /** Valor actual del campo (useWatch de 'commentary') */
  currentValue: string;
  /** ID de la subcategoría seleccionada */
  subcategoryId: number | null;
  /** Nombre de la subcategoría (para detectar tipo de plantilla) */
  subcategoryName?: string;
  /** Nombre de la categoría padre */
  categoryName?: string;
  /** Gastos recientes ya cargados desde el backend */
  recentExpenses?: RecentExpenseForSuggestion[];
}

// Referencia estable: un [] en los parámetros se recrearía en cada render
const NO_EXPENSES: RecentExpenseForSuggestion[] = [];

const MAX_LENGTH = 200;

const BORDER_STATES = ['valid', 'warning'] as const;

// ============================================================
// COMPONENTE
// ============================================================

/**
 * CommentaryInput
 *
 * Reemplaza el MyInput de comentario en las pantallas de crear gasto e ingreso.
 * Agrega:
 *  - Chips de plantilla rápida (según subcategoría)
 *  - Dropdown con historial filtrado mientras escribe
 *  - Borde de validación sutil (verde/amarillo)
 *
 * Es genérico: sirve con cualquier formulario que tenga `commentary: string`.
 */
export default function CommentaryInput<T extends CommentaryForm>({
  control,
  setValue,
  currentValue,
  subcategoryId,
  subcategoryName,
  categoryName,
  recentExpenses = NO_EXPENSES
}: CommentaryInputProps<T>) {
  const colors = useThemeColors();

  const {
    templateConfig,
    filteredSuggestions,
    showSuggestions,
    validation,
    hideSuggestions,
    openSuggestions
  } = useCommentaryInput({
    subcategoryId,
    subcategoryName,
    categoryName,
    recentExpenses,
    currentValue
  });

  // Inserta un texto en el campo y cierra las sugerencias
  const handleSelect = useCallback(
    (text: string) => {
      setValue('commentary' as Path<T>, text as PathValue<T, Path<T>>);
      hideSuggestions();
    },
    [setValue, hideSuggestions]
  );

  // Color del borde según validación (MyInput maneja el resto: focus, error)
  const borderColors = { valid: colors.SUCCESS, warning: colors.WARNING };
  const isBorderState = (state: string): state is (typeof BORDER_STATES)[number] =>
    (BORDER_STATES as readonly string[]).includes(state);

  const borderColor =
    templateConfig?.enableValidation && isBorderState(validation.state)
      ? borderColors[validation.state]
      : undefined;
  const inputContainerStyle = borderColor ? { borderColor } : undefined;

  const chips = templateConfig?.chips ?? [];

  return (
    <View>
      {/* Chips de plantilla rápida — solo si la subcategoría los tiene */}
      {chips.length > 0 && <TemplateChips chips={chips} onSelect={handleSelect} />}

      <MyInput
        name={'commentary' as Path<T>}
        type="textarea"
        control={control}
        label="Comentario"
        placeholder={templateConfig?.smartPlaceholder ?? 'Ej: Compra de una camisa'}
        rules={{
          maxLength: {
            value: MAX_LENGTH,
            message: `El comentario no puede superar ${MAX_LENGTH} caracteres`
          }
        }}
        multiline
        numberOfLines={2}
        maxLength={MAX_LENGTH}
        leftIcon="text"
        containerStyle={inputContainerStyle}
        onFocus={openSuggestions}
      />

      {/* Dropdown de historial */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <HistorySuggestions
          suggestions={filteredSuggestions}
          onSelect={handleSelect}
          onClose={hideSuggestions}
        />
      )}
    </View>
  );
}
