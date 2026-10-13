/**
 * EditCommentaryModal — Modal genérico para corregir el comentario de un gasto
 * Ubicación: src/Screens/Statistics/commentary-analysis/components/EditCommentaryModal.tsx
 *
 * Reutilizable en cualquier pantalla de análisis de comentarios.
 * Llama editExpense(id, { commentary }) sin tocar otros campos.
 * Al guardar exitosamente llama onSaved() para que la pantalla recargue.
 *
 * Uso:
 *   <EditCommentaryModal
 *     visible={editingExpense !== null}
 *     expense={editingExpense}
 *     formatHint="Ej: Copago Colmedica terapia física #11/20"
 *     onClose={() => setEditingExpense(null)}
 *     onSaved={refreshData}
 *   />
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { editExpense } from '~/services/expenses';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

// Types
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';

interface EditCommentaryModalProps {
  visible: boolean;
  expense: ExpenseToEdit | null;
  /** Texto de ayuda que muestra el formato esperado */
  formatHint?: string;
  onClose: () => void;
  /** Se llama tras guardar exitosamente — usar para refreshData() */
  onSaved: () => void;
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.5)';
const MAX_LENGTH = 200;

// ─────────────────────────────────────────────
// CONTENIDO (solo existe mientras el modal está abierto)
// ─────────────────────────────────────────────

interface ContentProps extends Omit<EditCommentaryModalProps, 'visible' | 'expense'> {
  expense: ExpenseToEdit;
}

function EditCommentaryModalContent({ expense, formatHint, onClose, onSaved }: ContentProps) {
  const colors = useThemeColors();
  const [commentary, setCommentary] = useState(expense.commentary);
  const [saving, setSaving] = useState(false);

  const trimmed = commentary.trim();
  const canSave = trimmed.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      await editExpense(expense.id, { commentary: trimmed });
      ShowToast('Comentario actualizado');
      onSaved();
      onClose();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Corregir comentario</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon
                type="material-community"
                name="close"
                size={24}
                color={colors.TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </View>

          {/* Info del gasto */}
          <View
            style={[
              styles.expenseInfo,
              { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
            ]}
          >
            <Text style={[styles.expenseInfoText, { color: colors.TEXT_SECONDARY }]}>
              {DateFormat(expense.date, 'DD MMM YYYY')} · {NumberFormat(expense.cost)}
            </Text>
          </View>

          {/* Hint de formato */}
          {formatHint && (
            <View style={[styles.hint, { backgroundColor: colors.INFO + '15' }]}>
              <Icon
                type="material-community"
                name="lightbulb-outline"
                size={14}
                color={colors.INFO}
              />
              <Text style={[styles.hintText, { color: colors.TEXT_SECONDARY }]}>{formatHint}</Text>
            </View>
          )}

          {/* TextInput */}
          <TextInput
            value={commentary}
            onChangeText={setCommentary}
            multiline
            numberOfLines={4}
            maxLength={MAX_LENGTH}
            style={[
              styles.input,
              {
                color: colors.TEXT_PRIMARY,
                borderColor: colors.BORDER,
                backgroundColor: colors.BACKGROUND
              }
            ]}
            placeholder="Escribe el comentario..."
            placeholderTextColor={colors.TEXT_SECONDARY}
            autoFocus
          />

          <Text style={[styles.charCount, { color: colors.TEXT_SECONDARY }]}>
            {commentary.length}/{MAX_LENGTH}
          </Text>

          {/* Botones */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.buttonCancel, { borderColor: colors.BORDER }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonCancelText, { color: colors.TEXT_SECONDARY }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buttonSave,
                { backgroundColor: colors.PRIMARY },
                !canSave && styles.buttonDisabled
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.WHITE} />
              ) : (
                <Text style={[styles.buttonSaveText, { color: colors.WHITE }]}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PÚBLICO
// ─────────────────────────────────────────────

export default function EditCommentaryModal({
  visible,
  expense,
  ...rest
}: EditCommentaryModalProps) {
  // Mientras está cerrado no se monta nada; al abrirse, el estado arranca limpio
  if (!visible || !expense) return null;
  return <EditCommentaryModalContent expense={expense} {...rest} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'flex-end'
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  expenseInfo: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  expenseInfoText: {
    fontSize: SMALL
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8
  },
  hintText: {
    fontSize: SMALL - 1,
    flex: 1,
    fontStyle: 'italic'
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: SMALL + 1,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: SMALL - 1,
    textAlign: 'right',
    marginTop: -8
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  buttonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  buttonCancelText: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  },
  buttonSave: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonSaveText: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
