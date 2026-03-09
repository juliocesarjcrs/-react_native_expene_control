import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Control, Controller } from 'react-hook-form';
import { useThemeColors } from '~/customHooks/useThemeColors';
import MyInput from '~/components/inputs/MyInput';
import TemplateChips from './TemplateChips';
import HistorySuggestions from './HistorySuggestions';
import { useCommentaryInput } from './useCommentaryInput.hook';
import { RecentExpenseForSuggestion } from '~/shared/types/screens/settings/commentary-templates.types';

// ============================================================
// TIPOS
// ============================================================

interface CommentaryInputProps {
  /** react-hook-form control */
  control: Control<any>;
  /** react-hook-form setValue para inyectar templates */
  setValue: (name: string, value: string) => void;
  /** Valor actual del campo (watch('commentary')) */
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

// ============================================================
// COMPONENTE
// ============================================================

/**
 * CommentaryInput
 *
 * Reemplaza el MyInput de comentario en CreateExpenseScreen.
 * Agrega:
 *  - Chips de plantilla rápida (según subcategoría)
 *  - Dropdown con historial filtrado mientras escribe
 *  - Borde de validación sutil (verde/amarillo)
 *
 * @example
 * <CommentaryInput
 *   control={control}
 *   setValue={setValue}
 *   currentValue={watch('commentary') ?? ''}
 *   subcategoryId={subcategoryId}
 *   subcategoryName="Proteinas"
 *   categoryName="Alimentación"
 *   recentExpenses={expenses}
 * />
 */
export default function CommentaryInput({
  control,
  setValue,
  currentValue,
  subcategoryId,
  subcategoryName,
  categoryName,
  recentExpenses = []
}: CommentaryInputProps) {
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

  // ── Insertar template en el campo ──
  const handleChipSelect = useCallback(
    (template: string) => {
      setValue('commentary', template);
      hideSuggestions();
    },
    [setValue, hideSuggestions]
  );

  // ── Seleccionar sugerencia del historial ──
  const handleSuggestionSelect = useCallback(
    (commentary: string) => {
      setValue('commentary', commentary);
      hideSuggestions();
    },
    [setValue, hideSuggestions]
  );

  // ── Color del borde según validación ──
  const getBorderOverride = () => {
    if (!templateConfig?.enableValidation) return undefined;
    switch (validation.state) {
      case 'valid':
        return colors.SUCCESS;
      case 'warning':
        return colors.WARNING;
      default:
        return undefined; // MyInput maneja el resto (focus, error)
    }
  };

  const borderOverride = getBorderOverride();
  const hasChips = (templateConfig?.chips?.length ?? 0) > 0;

  return (
    <View style={styles.wrapper}>
      {/* Chips de plantilla rápida — solo si la subcategoría los tiene */}
      {hasChips && <TemplateChips chips={templateConfig!.chips} onSelect={handleChipSelect} />}

      {/* Controller para inyectar el override de borde */}
      <Controller
        name="commentary"
        control={control}
        defaultValue=""
        rules={{
          maxLength: { value: 200, message: 'El comentario no puede superar 200 caracteres' }
        }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <MyInput
            name="commentary"
            type="textarea"
            control={control}
            label="Comentario"
            placeholder={templateConfig?.smartPlaceholder ?? 'Ej: Compra de una camisa'}
            rules={{
              maxLength: { value: 200, message: 'El comentario no puede superar 200 caracteres' }
            }}
            multiline
            numberOfLines={2}
            maxLength={200}
            leftIcon="text"
            // Override sutil del borde para validación
            containerStyle={borderOverride ? { borderColor: borderOverride } : undefined}
          />
        )}
      />

      {/* Dropdown de historial */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <HistorySuggestions
          suggestions={filteredSuggestions}
          onSelect={handleSuggestionSelect}
          onClose={hideSuggestions}
        />
      )}
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0 // MyInput ya tiene marginBottom: 16
  }
});
